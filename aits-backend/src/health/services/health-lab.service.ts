import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma, LabResultStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { FarmAccessService } from '../../auth/services/farm-access.service';
import { HealthStateService, AnimalHealthState } from '../health-state.service';
import { SurveillanceService } from '../surveillance.service';
import { AnimalBusinessRulesService } from '../../common/business-rules/animal-business-rules.service';
import { CreateLabResultDto, UpdateLabResultDto, HealthQueryDto } from '../dto';
import { NotificationDispatchService } from '../../notifications/services/notification-dispatch.service';

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface TimelineEvent {
  id?: string;
  date: string;
  category:
    | 'EXAMINATION'
    | 'DIAGNOSIS'
    | 'TREATMENT'
    | 'WITHDRAWAL'
    | 'LAB'
    | 'VACCINATION'
    | 'QUARANTINE'
    | 'CLEARANCE'
    | 'FOLLOWUP';
  title: string;
  description: string;
  actor: string;
  status?: string;
  data?: Record<string, unknown>;
}

export interface AnimalHealthTimelineResponse {
  animal: {
    id: string;
    tag: string;
    name: string | null;
    species: string;
    breed: string;
    farmName: string;
  };
  compositeState: AnimalHealthState;
  timeline: TimelineEvent[];
}

@Injectable()
export class HealthLabService {
  private readonly logger = new Logger(HealthLabService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly farmAccessService: FarmAccessService,
    private readonly animalBusinessRulesService: AnimalBusinessRulesService,
    private readonly healthStateService: HealthStateService,
    private readonly surveillanceService: SurveillanceService,
    private readonly notificationDispatchService: NotificationDispatchService,
  ) {}

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

  async getLabResults(
    query: HealthQueryDto,
    userId: string,
  ): Promise<PaginatedResult<unknown>> {
    const scope = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      ['health:read'],
    );
    const { page = 1, limit = 20, search, status, farmId, animalId } = query;
    const skip = (page - 1) * limit;
    const where: Prisma.LabResultWhereInput = {
      ...(farmId ? { farmId } : { farmId: { in: scope.farmIds } }),
      ...(animalId ? { animalId } : {}),
      ...(status ? { status: status as LabResultStatus } : {}),
      ...(search
        ? {
            OR: [
              { testType: { contains: search, mode: 'insensitive' } },
              { laboratory: { contains: search, mode: 'insensitive' } },
              { resultText: { contains: search, mode: 'insensitive' } },
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
      this.prisma.labResult.count({ where }),
      this.prisma.labResult.findMany({
        where,
        select: {
          id: true,
          testType: true,
          laboratory: true,
          sampleDate: true,
          resultDate: true,
          status: true,
          resultText: true,
          isFlagged: true,
          notes: true,
          healthRecordId: true,
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
          requestedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          healthRecord: {
            select: {
              id: true,
              diagnosis: true,
            },
          },
        },
        orderBy: { sampleDate: 'desc' },
        skip,
        take: limit,
      }),
    ]);
    const formatted = records.map((l) => ({
      id: l.id,
      animalTag: l.animal.animalNumber,
      animalName: l.animal.name || 'Unnamed',
      breed: l.animal.breed,
      species: l.animal.species,
      imageUrl: l.animal.imageUrl,
      testType: l.testType,
      lab: l.laboratory,
      sampleDate: l.sampleDate.toISOString().split('T')[0],
      resultDate: l.resultDate
        ? l.resultDate.toISOString().split('T')[0]
        : null,
      status: l.status.toLowerCase(),
      result: l.resultText || null,
      flagged: l.isFlagged,
      requestedBy: `Dr. ${l.requestedBy.firstName} ${l.requestedBy.lastName}`,
      notes: l.notes || '',
      farmName: l.animal.farm.name,
      healthRecordId: l.healthRecordId,
      diagnosisName: l.healthRecord?.diagnosis || null,
    }));
    return {
      data: formatted,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createLabResult(dto: CreateLabResultDto, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { userRoles: { include: { role: true } } },
    });

    const isMedicalOfficerOrPharmacy = user?.userRoles.some(
      (ur) => ur.role.name === 'Medical Officer' || ur.role.name === 'Pharmacy',
    );

    if (!isMedicalOfficerOrPharmacy) {
      throw new ForbiddenException(
        'Only Medical Officer or Pharmacy roles can add lab results.',
      );
    }

    const scope = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      ['health:record'],
    );
    const animal = await this.findAuthorizedAnimal(dto.animalTag, scope);
    const sampleDate = new Date(dto.sampleDate);
    const resultDate = dto.resultDate ? new Date(dto.resultDate) : null;
    return this.prisma.$transaction(async (tx) => {
      const labResult = await tx.labResult.create({
        data: {
          farmId: animal.farmId,
          animalId: animal.id,
          testType: dto.testType,
          laboratory: dto.laboratory,
          sampleDate,
          resultDate,
          status: dto.status || LabResultStatus.PENDING,
          resultText: dto.resultText,
          isFlagged: dto.isFlagged || false,
          notes: dto.notes,
          requestedById: userId,
          healthRecordId: dto.caseId,
          documentUrl: dto.documentUrl,
          documentUrls: dto.documentUrls || [],
        },
        include: { animal: true, requestedBy: true },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'LAB_RESULT_CREATE',
          entityType: 'LabResult',
          entityId: labResult.id,
          newValues: {
            animalNumber: animal.animalNumber,
            testType: dto.testType,
            status: dto.status,
          },
        },
      });

      this.notificationDispatchService
        .notifyFarmUsers(animal.farmId, {
          title: dto.isFlagged ? 'Flagged Lab Result' : 'New Lab Result',
          message: `A ${dto.isFlagged ? 'flagged ' : ''}lab result was added for animal ${animal.animalNumber}. Test: ${dto.testType}`,
          notificationType: 'HEALTH',
          priority: dto.isFlagged ? 'HIGH' : 'NORMAL',
          referenceType: 'LabResult',
          referenceId: labResult.id,
          actionUrl: `/health/lab-results/${labResult.id}`,
        })
        .catch((err) =>
          this.logger.error('Failed to dispatch notification', err),
        );

      return labResult;
    });
  }

  async updateLabResult(id: string, dto: UpdateLabResultDto, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { userRoles: { include: { role: true } } },
    });

    const isMedicalOfficerOrPharmacy = user?.userRoles.some(
      (ur) => ur.role.name === 'Medical Officer' || ur.role.name === 'Pharmacy',
    );

    if (!isMedicalOfficerOrPharmacy) {
      throw new ForbiddenException(
        'Only Medical Officer or Pharmacy roles can modify lab results.',
      );
    }

    const scope = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      ['health:record'],
    );
    const lab = await this.prisma.labResult.findUnique({
      where: { id },
      include: { animal: true },
    });
    if (!lab) {
      throw new NotFoundException(
        'The laboratory test record could not be found.',
      );
    }

    if (!scope.farmIds.includes(lab.farmId)) {
      throw new ForbiddenException(
        'Unauthorized to update this laboratory result',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.labResult.update({
        where: { id },
        data: {
          ...(dto.status ? { status: dto.status } : {}),
          ...(dto.resultDate ? { resultDate: new Date(dto.resultDate) } : {}),
          ...(dto.resultText !== undefined
            ? { resultText: dto.resultText }
            : {}),
          ...(dto.isFlagged !== undefined ? { isFlagged: dto.isFlagged } : {}),
          ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
          ...(dto.documentUrl !== undefined
            ? { documentUrl: dto.documentUrl }
            : {}),
          ...(dto.documentUrls !== undefined
            ? { documentUrls: dto.documentUrls }
            : {}),
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'LAB_RESULT_UPDATE',
          entityType: 'LabResult',
          entityId: id,
          newValues: JSON.parse(JSON.stringify(dto)) as Prisma.InputJsonValue,
        },
      });

      this.notificationDispatchService
        .notifyFarmUsers(lab.farmId, {
          title: dto.isFlagged ? 'Lab Result Flagged' : 'Lab Result Updated',
          message: `Lab result for animal ${lab.animal.animalNumber} has been updated. Status: ${dto.status || lab.status}`,
          notificationType: 'HEALTH',
          priority: dto.isFlagged ? 'HIGH' : 'NORMAL',
          referenceType: 'LabResult',
          referenceId: updated.id,
          actionUrl: `/health/lab-results/${updated.id}`,
        })
        .catch((err) =>
          this.logger.error('Failed to dispatch notification', err),
        );

      return updated;
    });
  }

  async getLabTestCatalogs() {
    return this.prisma.labTestCatalog.findMany({
      where: { active: true },
      orderBy: { category: 'asc' },
    });
  }
}
