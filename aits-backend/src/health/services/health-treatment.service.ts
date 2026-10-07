import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import {
  Prisma,
  TreatmentStatus,
  WithdrawalProduct,
  WithdrawalStatus,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { FarmAccessService } from '../../auth/services/farm-access.service';
import { AnimalBusinessRulesService } from '../../common/business-rules/animal-business-rules.service';
import { CreateTreatmentDto, UpdateTreatmentDto, HealthQueryDto } from '../dto';
import { PaginatedResult } from '../health.types';

@Injectable()
export class HealthTreatmentService {
  private readonly logger = new Logger(HealthTreatmentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly farmAccessService: FarmAccessService,
    private readonly animalBusinessRulesService: AnimalBusinessRulesService,
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
      throw new BadRequestException(
        `Animal '${animal.animalNumber}' has been sold and is no longer available for farm processes.`,
      );
    }

    return animal;
  }

  async getTreatments(
    query: HealthQueryDto,
    userId: string,
  ): Promise<PaginatedResult<unknown>> {
    const scope = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      ['health:read'],
    );
    const { page = 1, limit = 20, search, status, farmId, animalId } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.TreatmentWhereInput = {
      ...(farmId
        ? { animal: { farmId } }
        : { animal: { farmId: { in: scope.farmIds } } }),
      ...(animalId ? { animalId } : {}),
      ...(status ? { status: status as TreatmentStatus } : {}),
      ...(search
        ? {
            OR: [
              { treatmentName: { contains: search, mode: 'insensitive' } },
              { category: { contains: search, mode: 'insensitive' } },
              { condition: { contains: search, mode: 'insensitive' } },
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
      this.prisma.treatment.count({ where }),
      this.prisma.treatment.findMany({
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
          veterinarian: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { startDate: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const formatted = records.map((t) => {
      const now = new Date();
      const start = new Date(t.startDate);
      const diffDays = Math.max(
        1,
        Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) +
          1,
      );
      const duration = t.duration || 7;
      const currentDay =
        t.status === TreatmentStatus.COMPLETED
          ? duration
          : Math.min(duration, diffDays);

      return {
        id: t.id,
        animalTag: t.animal.animalNumber,
        animalName: t.animal.name || 'Unnamed',
        breed: t.animal.breed,
        species: t.animal.species,
        imageUrl: t.animal.imageUrl,
        medication: t.treatmentName,
        category: t.category || 'General Medication',
        dose: t.dose || 'Standard dose',
        duration,
        day: currentDay,
        startDate: t.startDate.toISOString().split('T')[0],
        endDate: t.endDate
          ? t.endDate.toISOString().split('T')[0]
          : new Date(start.getTime() + duration * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0],
        withdrawalMilk: t.withdrawalMilk,
        withdrawalMeat: t.withdrawalMeat,
        milkWithheld: t.milkWithheld,
        condition: t.condition || 'Clinical Treatment',
        prescribedBy: `Dr. ${t.veterinarian.firstName} ${t.veterinarian.lastName}`,
        status: t.status === TreatmentStatus.COMPLETED ? 'completed' : 'active',
        notes: t.notes || '',
        farmName: t.animal.farm.name,
      };
    });

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

  async createTreatment(dto: CreateTreatmentDto, userId: string) {
    const scope = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      ['health:record'],
    );
    const animal = await this.findAuthorizedAnimal(dto.animalTag, scope);

    // 1. Verify active status (not sold/deceased)
    this.animalBusinessRulesService.validateActiveStatus(animal, 'treatment');

    // 2. Verify eligible diagnosis exists
    const activeDiagnosis = await this.prisma.healthRecord.findFirst({
      where: {
        animalId: animal.id,
        healthStatus: {
          in: ['SICK', 'UNDER_TREATMENT', 'QUARANTINED'],
        },
      },
      include: {
        labResults: true,
      },
    });

    if (!activeDiagnosis) {
      throw new BadRequestException({
        message: `Animal '${animal.animalNumber}' does not have an eligible active diagnosis for treatment.`,
        code: 'TREATMENT_DIAGNOSIS_REQUIRED',
      });
    }

    if (activeDiagnosis.labResultRequired) {
      const hasProvidedLabResult = activeDiagnosis.labResults.some(
        (lr) => lr.status !== 'PENDING',
      );
      if (!hasProvidedLabResult) {
        throw new BadRequestException({
          message:
            'This diagnosis requires a completed lab result before a prescription can be written.',
          code: 'LAB_RESULT_REQUIRED_BEFORE_PRESCRIPTION',
        });
      }
    }

    const startDate = new Date(dto.startDate);
    const duration = dto.duration || 7;
    const endDate = dto.endDate
      ? new Date(dto.endDate)
      : new Date(startDate.getTime() + duration * 24 * 60 * 60 * 1000);
    const withdrawalMilk = dto.withdrawalMilk || 0;
    const withdrawalMeat = dto.withdrawalMeat || 0;

    return this.prisma.$transaction(async (tx) => {
      const treatment = await tx.treatment.create({
        data: {
          animalId: animal.id,
          veterinarianId: userId,
          healthRecordId: dto.healthRecordId || activeDiagnosis.id,
          caseId: dto.caseId,
          medicationId: dto.medicationId,
          treatmentName: dto.medication,
          category: dto.category || 'Antibiotic',
          dose: dto.dose || 'Standard dose',
          duration,
          startDate,
          endDate,
          withdrawalMilk,
          withdrawalMeat,
          milkWithheld: withdrawalMilk > 0,
          condition: dto.condition,
          notes: dto.notes,
          status: TreatmentStatus.IN_PROGRESS,
        },
        include: { animal: true, veterinarian: true },
      });

      // Automatically generate WithdrawalPeriod records
      if (withdrawalMilk > 0) {
        const milkEnd = new Date(
          endDate.getTime() + withdrawalMilk * 24 * 60 * 60 * 1000,
        );
        await tx.withdrawalPeriod.create({
          data: {
            treatmentId: treatment.id,
            animalId: animal.id,
            farmId: animal.farmId,
            productType: WithdrawalProduct.MILK,
            startDate,
            endDate: milkEnd,
            status: WithdrawalStatus.ACTIVE,
            notes: `Mandatory milk withhold for ${dto.medication} (${withdrawalMilk} days post-treatment)`,
          },
        });
      }

      if (withdrawalMeat > 0) {
        const meatEnd = new Date(
          endDate.getTime() + withdrawalMeat * 24 * 60 * 60 * 1000,
        );
        await tx.withdrawalPeriod.create({
          data: {
            treatmentId: treatment.id,
            animalId: animal.id,
            farmId: animal.farmId,
            productType: WithdrawalProduct.MEAT,
            startDate,
            endDate: meatEnd,
            status: WithdrawalStatus.ACTIVE,
            notes: `Meat/slaughter withdrawal for ${dto.medication} (${withdrawalMeat} days post-treatment)`,
          },
        });
      }

      await tx.healthRecord.update({
        where: { id: activeDiagnosis.id },
        data: { healthStatus: 'UNDER_TREATMENT' },
      });

      if (dto.followUpDate) {
        await tx.followUp.create({
          data: {
            animalId: animal.id,
            farmId: animal.farmId,
            caseId: dto.caseId,
            assignedVetId: userId,
            scheduledDate: new Date(dto.followUpDate),
            reason: `Recheck after treatment: ${dto.medication}`,
            status: 'PENDING',
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId,
          action: 'TREATMENT_CREATE',
          entityType: 'Treatment',
          entityId: treatment.id,
          newValues: {
            animalNumber: animal.animalNumber,
            medication: dto.medication,
            withdrawalMilk,
            withdrawalMeat,
          },
        },
      });

      return treatment;
    });
  }

  async completeTreatment(id: string, userId: string) {
    const scope = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      ['health:record'],
    );
    const treatment = await this.prisma.treatment.findUnique({
      where: { id },
      include: { animal: true, withdrawals: true },
    });

    if (!treatment) {
      throw new NotFoundException(
        'The treatment prescription could not be found.',
      );
    }

    if (!scope.farmIds.includes(treatment.animal.farmId)) {
      throw new ForbiddenException(
        'You do not have permission to modify this treatment record.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const now = new Date();
      // Check if milk withdrawal is still actively running in future
      const activeMilkWithhold = treatment.withdrawals.some(
        (w) =>
          w.productType === WithdrawalProduct.MILK &&
          w.endDate > now &&
          w.status === WithdrawalStatus.ACTIVE,
      );

      const updated = await tx.treatment.update({
        where: { id },
        data: {
          status: TreatmentStatus.COMPLETED,
          endDate: now,
          milkWithheld: activeMilkWithhold,
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'TREATMENT_COMPLETE',
          entityType: 'Treatment',
          entityId: id,
        },
      });

      return updated;
    });
  }

  async updateTreatment(id: string, dto: UpdateTreatmentDto, userId: string) {
    const scope = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      ['health:record'],
    );

    const treatment = await this.prisma.treatment.findUnique({
      where: { id },
      include: { animal: true },
    });

    if (!treatment) {
      throw new NotFoundException(
        'The treatment prescription could not be found.',
      );
    }

    if (!scope.farmIds.includes(treatment.animal.farmId)) {
      throw new ForbiddenException(
        'You do not have permission to modify this treatment record.',
      );
    }

    if (treatment.status !== TreatmentStatus.IN_PROGRESS) {
      throw new BadRequestException(
        'Cannot edit a completed or cancelled treatment record.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.treatment.update({
        where: { id },
        data: {
          category: dto.category !== undefined ? dto.category : undefined,
          dose: dto.dose !== undefined ? dto.dose : undefined,
          condition: dto.condition !== undefined ? dto.condition : undefined,
          notes: dto.notes !== undefined ? dto.notes : undefined,
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'TREATMENT_UPDATE',
          entityType: 'Treatment',
          entityId: id,
          newValues: { ...dto },
        },
      });

      return updated;
    });
  }

  async voidTreatment(id: string, reason: string, userId: string) {
    const scope = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      ['health:record'],
    );

    const treatment = await this.prisma.treatment.findUnique({
      where: { id },
      include: { animal: true },
    });

    if (!treatment) {
      throw new NotFoundException(
        'The treatment prescription could not be found.',
      );
    }

    if (!scope.farmIds.includes(treatment.animal.farmId)) {
      throw new ForbiddenException(
        'You do not have permission to void this treatment record.',
      );
    }

    if (treatment.status === TreatmentStatus.CANCELLED) {
      throw new BadRequestException(
        'This treatment record has already been voided.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const cancelled = await tx.treatment.update({
        where: { id },
        data: {
          status: TreatmentStatus.CANCELLED,
          notes:
            (treatment.notes ? treatment.notes + '\n' : '') +
            `[VOIDED] Reason: ${reason}`,
        },
      });

      await tx.withdrawalPeriod.updateMany({
        where: { treatmentId: id, status: WithdrawalStatus.ACTIVE },
        data: { status: WithdrawalStatus.CANCELLED, endDate: new Date() },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'TREATMENT_VOID',
          entityType: 'Treatment',
          entityId: id,
          newValues: { reason },
        },
      });

      return cancelled;
    });
  }

  async getActiveWithdrawals(query: HealthQueryDto, userId: string) {
    const scope = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      ['health:read'],
    );
    const where: Prisma.WithdrawalPeriodWhereInput = {
      status: WithdrawalStatus.ACTIVE,
      endDate: { gt: new Date() },
      ...(query.farmId
        ? { farmId: query.farmId }
        : { farmId: { in: scope.farmIds } }),
    };

    const records = await this.prisma.withdrawalPeriod.findMany({
      where,
      include: {
        animal: {
          select: {
            animalNumber: true,
            name: true,
            breed: true,
            farm: { select: { name: true } },
          },
        },
        treatment: { select: { treatmentName: true, dose: true } },
      },
      orderBy: { endDate: 'asc' },
    });

    const now = new Date();
    return records.map((w) => {
      const msLeft = w.endDate.getTime() - now.getTime();
      const hoursRemaining = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60)));
      const daysRemaining = Math.max(
        0,
        Math.ceil(msLeft / (1000 * 60 * 60 * 24)),
      );

      return {
        id: w.id,
        animalTag: w.animal.animalNumber,
        animalName: w.animal.name || 'Unnamed',
        productType: w.productType,
        medication: w.treatment?.treatmentName || 'Prescription',
        startDate: w.startDate.toISOString().split('T')[0],
        endDate: w.endDate.toISOString().split('T')[0],
        hoursRemaining,
        daysRemaining,
        farmName: w.animal.farm.name,
      };
    });
  }
}
