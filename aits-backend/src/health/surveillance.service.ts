import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateExposureRecordDto } from './dto/create-exposure.dto';

export interface OutbreakAlertResult {
  detected: boolean;
  diseaseName: string;
  caseCount: number;
  farmId: string;
  farmName: string;
  riskLevel: 'HIGH' | 'CRITICAL';
  recommendation: string;
  alertId?: string;
}

@Injectable()
export class SurveillanceService {
  private readonly logger = new Logger(SurveillanceService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Scans epidemiological logs over rolling 14-day window to identify disease clusters.
   * Creates an OUTBREAK_SUSPECTED alert if clustering threshold (≥3 cases of contagious disease) is exceeded.
   */
  async detectOutbreaks(farmId?: string): Promise<OutbreakAlertResult[]> {
    const windowStart = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    const farmFilter = farmId ? { farmId } : {};

    // 1. Fetch active contagious / reportable diseases
    const contagiousDiseases = await this.prisma.disease.findMany({
      where: {
        OR: [{ contagious: true }, { reportable: true }],
      },
      select: {
        id: true,
        name: true,
        code: true,
        contagious: true,
        reportable: true,
      },
    });

    const diseaseMap = new Map(contagiousDiseases.map((d) => [d.id, d]));
    const diseaseIds = contagiousDiseases.map((d) => d.id);

    // 2. Fetch diagnosis logs within window
    const recentDiagnoses = await this.prisma.animalDisease.findMany({
      where: {
        ...farmFilter,
        diseaseId: { in: diseaseIds },
        diagnosedDate: { gte: windowStart },
      },
      include: {
        animal: {
          select: {
            farmId: true,
            animalNumber: true,
            farm: { select: { name: true } },
          },
        },
      },
    });

    // 3. Cluster by farmId + diseaseId
    const clusterMap = new Map<
      string,
      {
        count: number;
        farmId: string;
        farmName: string;
        diseaseId: string;
        animals: string[];
      }
    >();

    for (const diag of recentDiagnoses) {
      const key = `${diag.animal.farmId}_${diag.diseaseId}`;
      const existing = clusterMap.get(key) || {
        count: 0,
        farmId: diag.animal.farmId,
        farmName: diag.animal.farm.name,
        diseaseId: diag.diseaseId,
        animals: [],
      };
      existing.count += 1;
      existing.animals.push(diag.animal.animalNumber);
      clusterMap.set(key, existing);
    }

    const results: OutbreakAlertResult[] = [];

    // 4. Evaluate Thresholds (≥3 cases = critical outbreak suspect, ≥2 cases = high surveillance)
    for (const [, cluster] of clusterMap.entries()) {
      if (cluster.count >= 2) {
        const disease = diseaseMap.get(cluster.diseaseId);
        const diseaseName = disease?.name || 'Infectious Agent';
        const isCritical = cluster.count >= 3 || (disease?.reportable ?? false);

        // Check if alert already exists for this farm + disease in past 7 days
        const existingAlert = await this.prisma.healthAlert.findFirst({
          where: {
            farmId: cluster.farmId,
            type: 'OUTBREAK_SUSPECTED',
            title: { contains: diseaseName },
            createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
        });

        let alertId: string | undefined = existingAlert?.id;

        if (!existingAlert) {
          const newAlert = await this.prisma.healthAlert.create({
            data: {
              farmId: cluster.farmId,
              type: 'OUTBREAK_SUSPECTED',
              severity: isCritical ? 'CRITICAL' : 'HIGH',
              title: `Potential Outbreak: ${diseaseName} (${cluster.count} cases in 14 days)`,
              message: `Epidemiological surveillance detected ${cluster.count} cases of ${diseaseName} on ${cluster.farmName} affecting animals (${cluster.animals.slice(0, 5).join(', ')}). Immediate veterinary review and contact tracing required.`,
            },
          });
          alertId = newAlert.id;
          this.logger.warn(
            `🚨 Outbreak alert triggered for ${diseaseName} on farm ${cluster.farmName} (${cluster.count} cases)`,
          );
        }

        results.push({
          detected: true,
          diseaseName,
          caseCount: cluster.count,
          farmId: cluster.farmId,
          farmName: cluster.farmName,
          riskLevel: isCritical ? 'CRITICAL' : 'HIGH',
          recommendation: `Isolate affected animals (${cluster.animals.join(', ')}). Impose farm movement restrictions. Notify state veterinary authority.`,
          alertId,
        });
      }
    }

    return results;
  }

  /**
   * Registers an exposure / contact tracing record between source animal and contact animal.
   */
  async createExposureRecord(dto: CreateExposureRecordDto) {
    const sourceAnimal = await this.prisma.animal.findFirst({
      where: { animalNumber: dto.sourceAnimalTag.trim() },
    });
    if (!sourceAnimal) {
      throw new Error(`Source animal '${dto.sourceAnimalTag}' not found`);
    }

    const contactAnimal = await this.prisma.animal.findFirst({
      where: { animalNumber: dto.contactAnimalTag.trim() },
    });
    if (!contactAnimal) {
      throw new Error(`Contact animal '${dto.contactAnimalTag}' not found`);
    }

    return this.prisma.exposureRecord.create({
      data: {
        farmId: sourceAnimal.farmId,
        sourceAnimalId: sourceAnimal.id,
        contactAnimalId: contactAnimal.id,
        exposureDate: dto.exposureDate
          ? new Date(dto.exposureDate)
          : new Date(),
        exposureType: dto.exposureType,
        location: dto.location,
        riskLevel: dto.riskLevel || 'MODERATE',
        recommendedAction: dto.recommendedAction,
        actionTaken: dto.actionTaken,
        notes: dto.notes,
      },
      include: {
        sourceAnimal: {
          select: { animalNumber: true, species: true, breed: true },
        },
        contactAnimal: {
          select: { animalNumber: true, species: true, breed: true },
        },
      },
    });
  }

  /**
   * Retrieves full contact tracing graph for a farm.
   */
  async getFarmExposureGraph(farmId: string) {
    const exposures = await this.prisma.exposureRecord.findMany({
      where: { farmId },
      orderBy: { exposureDate: 'desc' },
      include: {
        sourceAnimal: {
          select: { id: true, animalNumber: true, name: true, species: true },
        },
        contactAnimal: {
          select: { id: true, animalNumber: true, name: true, species: true },
        },
      },
    });

    return exposures.map((e) => ({
      id: e.id,
      exposureDate: e.exposureDate.toISOString(),
      exposureType: e.exposureType,
      location: e.location,
      riskLevel: e.riskLevel,
      recommendedAction: e.recommendedAction,
      actionTaken: e.actionTaken,
      notes: e.notes,
      source: {
        id: e.sourceAnimal.id,
        tag: e.sourceAnimal.animalNumber,
        name: e.sourceAnimal.name,
        species: e.sourceAnimal.species,
      },
      contact: {
        id: e.contactAnimal.id,
        tag: e.contactAnimal.animalNumber,
        name: e.contactAnimal.name,
        species: e.contactAnimal.species,
      },
    }));
  }
}
