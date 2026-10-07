import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import {
  Prisma,
  HealthStatus,
  QuarantineStatus,
  AnimalStatus,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { FarmAccessService } from '../../auth/services/farm-access.service';
import { CreateDiagnosisDto, UpdateDiagnosisDto, HealthQueryDto } from '../dto';
import { PaginatedResult } from '../health.types';

@Injectable()
export class HealthDiagnosisService {
  private readonly logger = new Logger(HealthDiagnosisService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly farmAccessService: FarmAccessService,
  ) {}

  /**
   * Helper to verify and find animal by UUID or Tag Number scoped to user authorization.
   */
  private async findAuthorizedAnimal(
    animalTagOrId: string,
    farmScope: { farmIds: string[] },
  ) {
    const animal = await this.prisma.animal.findFirst({
      where: {
        OR: [
          { animalNumber: animalTagOrId },
          { id: animalTagOrId.length === 36 ? animalTagOrId : undefined },
        ],
        deletedAt: null,
      },
      include: { farm: true },
    });

    if (!animal) {
      throw new NotFoundException(
        `Animal '${animalTagOrId}' not found in registry`,
      );
    }

    if (!farmScope.farmIds.includes(animal.farmId)) {
      throw new ForbiddenException(
        `Access denied for animal '${animal.animalNumber}' on farm '${animal.farm.name}'`,
      );
    }

    if (animal.status === 'SOLD') {
      throw new ForbiddenException(
        `Animal '${animal.animalNumber}' has been sold and is no longer available for farm processes.`,
      );
    }

    return animal;
  }

  async getDiagnoses(
    query: HealthQueryDto,
    userId: string,
  ): Promise<PaginatedResult<unknown>> {
    const scope = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      ['health:read'],
    );
    const {
      page = 1,
      limit = 20,
      search,
      severity,
      status,
      farmId,
      animalId,
    } = query;

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    const where: Prisma.HealthRecordWhereInput = {
      treatments: { none: {} }, // Exclude records that have treatments
      ...(farmId
        ? { animal: { farmId } }
        : { animal: { farmId: { in: scope.farmIds } } }),
      ...(animalId ? { animalId } : {}),
      ...(severity ? { severity } : {}),
      ...(status ? { healthStatus: status as HealthStatus } : {}),
      ...(search
        ? {
            OR: [
              { diagnosis: { contains: search, mode: 'insensitive' } },
              { symptoms: { contains: search, mode: 'insensitive' } },
              { notes: { contains: search, mode: 'insensitive' } },
              {
                animal: {
                  animalNumber: { contains: search, mode: 'insensitive' },
                },
              },
              {
                animal: {
                  name: { contains: search, mode: 'insensitive' },
                },
              },
            ],
          }
        : {}),
    };

    const [total, records] = await Promise.all([
      this.prisma.healthRecord.count({ where }),
      this.prisma.healthRecord.findMany({
        where,
        include: {
          animal: {
            select: {
              id: true,
              animalNumber: true,
              name: true,
              breed: true,
              species: true,
              imageUrl: true,
              farm: { select: { id: true, name: true } },
            },
          },
          recordedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          labResults: true,
        },
        orderBy: { recordDate: 'desc' },
        skip,
        take: limitNum,
      }),
    ]);

    const formatted = records.map((r) => {
      let parsedSymptoms: string[] = [];
      if (r.symptoms) {
        try {
          const parsed = JSON.parse(r.symptoms) as unknown;
          if (Array.isArray(parsed)) {
            parsedSymptoms = parsed.map(String);
          }
        } catch {
          parsedSymptoms = r.symptoms.split(',').map((s) => s.trim());
        }
      }

      return {
        id: r.id,
        animalTag: r.animal.animalNumber,
        animalName: r.animal.name || 'Unnamed',
        breed: r.animal.breed,
        species: r.animal.species,
        imageUrl: r.animal.imageUrl,
        condition: r.diagnosis || 'Unspecified Condition',
        severity: r.severity || 'moderate',
        status: r.healthStatus,
        date: r.recordDate.toISOString().split('T')[0],
        vet: `${r.recordedBy.firstName} ${r.recordedBy.lastName}`,
        symptoms: parsedSymptoms,
        notes: r.notes || '',
        farmName: r.animal.farm.name,
        labResultRequired: r.labResultRequired,
        labResults: r.labResults,
      };
    });

    return {
      data: formatted,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  async createDiagnosis(dto: CreateDiagnosisDto, userId: string) {
    const scope = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      ['health:record'],
    );
    const animal = await this.findAuthorizedAnimal(dto.animalTag, scope);

    const recordDate = dto.recordDate ? new Date(dto.recordDate) : new Date();
    const symptomsString = dto.symptoms ? JSON.stringify(dto.symptoms) : null;
    const healthStatus = dto.healthStatus || HealthStatus.UNDER_TREATMENT;

    return this.prisma.$transaction(async (tx) => {
      // 1. Create health record
      const record = await tx.healthRecord.create({
        data: {
          animalId: animal.id,
          recordedById: userId,
          recordDate,
          healthStatus,
          severity: dto.severity || 'moderate',
          diagnosis: dto.condition,
          symptoms: symptomsString,
          notes: dto.notes,
          labResultRequired: dto.labResultRequired || false,
        },
        include: {
          animal: true,
          recordedBy: true,
        },
      });

      // 2. If isolation recommended, place animal in quarantine status
      if (dto.recommendIsolation) {
        await tx.animal.update({
          where: { id: animal.id },
          data: { status: AnimalStatus.QUARANTINED },
        });

        // Check if there is an available quarantine zone for the farm
        const defaultZone = await tx.quarantineZone.findFirst({
          where: { farmId: animal.farmId },
        });

        const zoneName = defaultZone
          ? defaultZone.name
          : 'Emergency Isolation Pen';

        await tx.quarantineRecord.create({
          data: {
            farmId: animal.farmId,
            animalId: animal.id,
            zoneId: defaultZone?.id,
            zoneName,
            reason: `Isolation following clinical diagnosis: ${dto.condition}`,
            startDate: recordDate,
            expectedRelease: new Date(
              recordDate.getTime() + 14 * 24 * 60 * 60 * 1000,
            ),
            status: QuarantineStatus.ACTIVE,
            orderedById: userId,
            notes: dto.notes,
          },
        });
      }

      // 3. Create a pending lab result if required
      if (dto.labResultRequired) {
        await tx.labResult.create({
          data: {
            farmId: animal.farmId,
            animalId: animal.id,
            healthRecordId: record.id,
            testType: `Diagnostic Lab Test for ${dto.condition}`,
            laboratory: 'Pending Selection',
            sampleDate: recordDate,
            status: 'PENDING',
            requestedById: userId,
            notes: 'Automatically generated request from clinical diagnosis',
          },
        });
      }

      // 3. Audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'HEALTH_RECORD_CREATE',
          entityType: 'HealthRecord',
          entityId: record.id,
          newValues: {
            animalNumber: animal.animalNumber,
            condition: dto.condition,
            severity: dto.severity,
            isolation: dto.recommendIsolation,
          },
        },
      });

      return record;
    });
  }

  async updateDiagnosis(id: string, dto: UpdateDiagnosisDto, userId: string) {
    const record = await this.prisma.healthRecord.findUnique({
      where: { id },
      include: { animal: true },
    });

    if (!record)
      throw new NotFoundException('The diagnosis record could not be found.');

    const scope = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      ['health:record'],
    );
    if (!scope.farmIds.includes(record.animal.farmId)) {
      throw new ForbiddenException(
        'You do not have permission to update this diagnosis.',
      );
    }

    const symptomsString = dto.symptoms
      ? JSON.stringify(dto.symptoms)
      : undefined;

    return this.prisma.healthRecord.update({
      where: { id },
      data: {
        diagnosis: dto.condition !== undefined ? dto.condition : undefined,
        severity: dto.severity !== undefined ? dto.severity : undefined,
        healthStatus:
          dto.healthStatus !== undefined ? dto.healthStatus : undefined,
        notes: dto.notes !== undefined ? dto.notes : undefined,
        symptoms: symptomsString,
      },
    });
  }

  async resolveDiagnosis(id: string, userId: string) {
    const record = await this.prisma.healthRecord.findUnique({
      where: { id },
      include: { animal: true },
    });

    if (!record)
      throw new NotFoundException('The diagnosis record could not be found.');

    const scope = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      ['health:record'],
    );
    if (!scope.farmIds.includes(record.animal.farmId)) {
      throw new ForbiddenException(
        'You do not have permission to resolve this diagnosis.',
      );
    }

    return this.prisma.healthRecord.update({
      where: { id },
      data: {
        healthStatus: HealthStatus.RECOVERED,
      },
    });
  }

  async deleteDiagnosis(id: string, userId: string) {
    const record = await this.prisma.healthRecord.findUnique({
      where: { id },
      include: { animal: true },
    });

    if (!record)
      throw new NotFoundException('The diagnosis record could not be found.');

    const scope = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      ['health:record'],
    );
    if (!scope.farmIds.includes(record.animal.farmId)) {
      throw new ForbiddenException(
        'You do not have permission to delete this diagnosis.',
      );
    }

    await this.prisma.healthRecord.delete({
      where: { id },
    });

    return { success: true, message: 'Diagnosis deleted successfully' };
  }
}
