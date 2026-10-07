import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { FarmAccessService } from '../../auth/services/farm-access.service';
import { AnimalBusinessRulesService } from '../../common/business-rules/animal-business-rules.service';
import { Prisma, NotificationType, NotificationPriority } from '@prisma/client';
import { NotificationsService } from '../../notifications/notifications.service';
import { CreateMilkProductionDto, UpdateMilkProductionDto } from '../dto';
import { FormattedMilkRecord } from '../types/milk-production.types';
import {
  parseNotesMetadata,
  serializeNotesMetadata,
  parseDateString,
  formatRecord,
  UUID_REGEX,
  MilkProductionRecordInput,
} from '../utils/milk-production.utils';

@Injectable()
export class MilkProductionCrudService {
  private readonly logger = new Logger(MilkProductionCrudService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly farmAccessService: FarmAccessService,
    private readonly notificationsService: NotificationsService,
    private readonly animalBusinessRulesService: AnimalBusinessRulesService,
  ) {}

  /**
   * Helper: Resolves an animal by ID (UUID) or Tag (animalNumber), ensuring it
   * belongs to the target farm.
   *
   * IMPORTANT: The `id` column is UUID NOT NULL in PostgreSQL. Passing a non-UUID
   * string (e.g. "COW-LK-5103") to a UUID column via the pg driver adapter causes
   * Prisma error P2007. We therefore only include the id-match condition when the
   * input looks like a valid UUID.
   */
  private async resolveAnimal(animalIdOrTag: string, targetFarmId: string) {
    const trimmed = animalIdOrTag.trim();
    const isUuid = UUID_REGEX.test(trimmed);

    const orConditions: Prisma.AnimalWhereInput[] = [
      { animalNumber: { equals: trimmed, mode: 'insensitive' } },
    ];

    // Only match on `id` when the input is a valid UUID — otherwise PostgreSQL
    // will throw P2007 (data validation error) because the UUID column type
    // strictly validates its input via the pg driver adapter.
    if (isUuid) {
      orConditions.push({ id: trimmed });
    }

    const animal = await this.prisma.animal.findFirst({
      where: {
        farmId: targetFarmId,
        deletedAt: null,
        OR: orConditions,
      },
      include: {
        farm: { select: { id: true, name: true } },
      },
    });

    if (!animal) {
      throw new NotFoundException(
        `Animal "${animalIdOrTag}" was not found on the specified farm facility.`,
      );
    }

    return animal;
  }

  /**
   * Create a new milk production yield record
   */
  async createRecord(
    userId: string,
    dto: CreateMilkProductionDto,
  ): Promise<FormattedMilkRecord> {
    const { farmIds } = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      ['milk:create'],
    );

    if (!farmIds.includes(dto.farmId)) {
      throw new ForbiddenException(
        'You do not have permission to log production yields for this farm facility.',
      );
    }

    // Resolve animal on target farm
    const animal = await this.resolveAnimal(dto.animalId, dto.farmId);

    // Validate production date
    const prodDate = parseDateString(dto.productionDate);
    if (isNaN(prodDate.getTime())) {
      throw new BadRequestException(
        'Please provide a valid date for the production record.',
      );
    }

    const now = new Date();
    if (prodDate.getTime() > now.getTime() + 86400000) {
      throw new BadRequestException(
        'Production dates cannot be set in the future. Please select a valid date.',
      );
    }

    // Business Rules Validation
    this.animalBusinessRulesService.validateMilkEligibility(animal, prodDate);

    // Verify withdrawal period
    const activeWithdrawal = await this.prisma.withdrawalPeriod.findFirst({
      where: {
        animalId: animal.id,
        productType: 'MILK',
        status: 'ACTIVE',
        startDate: { lte: prodDate },
        endDate: { gte: prodDate },
      },
    });

    if (activeWithdrawal) {
      const quality = dto.milkQuality?.toUpperCase() || 'ACCEPTED';
      if (
        quality !== 'WITHHELD' &&
        quality !== 'REJECTED' &&
        quality !== 'RESTRICTED'
      ) {
        throw new BadRequestException({
          message:
            'Cannot record normal milk production. This animal is under an active milk withdrawal period. Milk must be marked as WITHHELD or RESTRICTED.',
          code: 'TREATMENT_WITHDRAWAL_ACTIVE',
        });
      }
    }

    // Check duplicate record
    const existing = await this.prisma.milkProduction.findFirst({
      where: {
        animalId: animal.id,
        productionDate: prodDate,
        milkingSession: dto.milkingSession,
      },
    });

    if (existing) {
      throw new ConflictException(
        `A milk production record already exists for animal "${animal.animalNumber}" on ${dto.productionDate} (${dto.milkingSession} session).`,
      );
    }

    this.logger.debug(
      `Creating milk production record: animalId=${animal.id}, farmId=${dto.farmId}, ` +
        `recordedById=${userId}, productionDate=${prodDate.toISOString()}, ` +
        `milkingSession=${dto.milkingSession}, quantityLiters=${dto.quantityLiters} (type: ${typeof dto.quantityLiters}), ` +
        `milkQuality=${dto.milkQuality || 'ACCEPTED'}`,
    );

    // Check for active milk withdrawal periods
    const activeWithdrawals = await this.prisma.withdrawalPeriod.findMany({
      where: {
        animalId: animal.id,
        productType: 'MILK',
        status: 'ACTIVE',
        startDate: { lte: prodDate },
        endDate: { gte: prodDate },
      },
    });

    let finalMilkQuality = dto.milkQuality ?? 'ACCEPTED';
    let finalNotes = dto.notes ?? null;

    if (activeWithdrawals.length > 0) {
      finalMilkQuality = 'REJECTED';
      finalNotes = finalNotes
        ? `${finalNotes}\n(Auto-rejected due to active milk withdrawal)`
        : 'Auto-rejected due to active milk withdrawal';
    }

    let created: MilkProductionRecordInput;
    try {
      created = await this.prisma.milkProduction.create({
        data: {
          animalId: animal.id,
          farmId: dto.farmId,
          recordedById: userId,
          productionDate: prodDate,
          milkingSession: dto.milkingSession,
          quantityLiters: Number(dto.quantityLiters),
          milkQuality: finalMilkQuality,
          fatPercentage: dto.fatPercentage ?? null,
          proteinPercentage: dto.proteinPercentage ?? null,
          notes: finalNotes,
        },
        include: {
          animal: {
            select: {
              id: true,
              animalNumber: true,
              name: true,
              imageUrl: true,
              species: true,
            },
          },
          farm: { select: { id: true, name: true } },
          recordedBy: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });

      // Notify farm users of new milk production
      this.notificationsService
        .notifyFarmUsers(dto.farmId, {
          title: 'Milk Production Logged',
          message: `${dto.quantityLiters}L of milk logged for cow ${animal.animalNumber} (${dto.milkingSession} session)`,
          notificationType: NotificationType.SYSTEM,
          category: 'MILK_PRODUCTION',
          priority: NotificationPriority.NORMAL,
          referenceType: 'MilkProduction',
          referenceId: created.id,
          actionUrl: `/milk-production/${created.id}`,
          dedupKey: `milk:create:${created.id}`,
        })
        .catch((err) =>
          this.logger.warn(
            `Failed to dispatch milk production notification: ${String(err)}`,
          ),
        );
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        this.logger.error(
          `Prisma error ${err.code} creating milk production record: ${err.message}`,
          `Meta: ${JSON.stringify(err.meta)}`,
        );
      } else {
        this.logger.error(
          `Unexpected error creating milk production record:`,
          err,
        );
      }
      throw err;
    }

    return formatRecord(created);
  }

  /**
   * Update an existing milk production record
   */
  async updateRecord(
    userId: string,
    id: string,
    dto: UpdateMilkProductionDto,
  ): Promise<FormattedMilkRecord> {
    const existing = await this.prisma.milkProduction.findUnique({
      where: { id },
      include: { animal: true },
    });

    if (!existing) {
      throw new NotFoundException(
        `Milk production record "${id}" was not found.`,
      );
    }

    const { meta: existingMeta } = parseNotesMetadata(existing.notes);
    if (existingMeta.isVoided) {
      throw new BadRequestException(
        'Cannot modify a voided milk production record. Historical audit integrity must be preserved.',
      );
    }

    const { farmIds } = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      ['milk:update'],
    );
    if (!farmIds.includes(existing.farmId)) {
      throw new ForbiddenException(
        'You do not have permission to modify records from this farm facility.',
      );
    }

    const targetFarmId = dto.farmId || existing.farmId;
    if (!farmIds.includes(targetFarmId)) {
      throw new ForbiddenException(
        'Target farm facility is not accessible to your account.',
      );
    }

    let animalId = existing.animalId;
    if (dto.animalId && dto.animalId !== existing.animalId) {
      const resolvedAnimal = await this.resolveAnimal(
        dto.animalId,
        targetFarmId,
      );
      animalId = resolvedAnimal.id;
    }

    let prodDate = existing.productionDate;
    if (dto.productionDate) {
      prodDate = parseDateString(dto.productionDate);
      if (isNaN(prodDate.getTime())) {
        throw new BadRequestException(
          'Please provide a valid date for the production record.',
        );
      }

      const now = new Date();
      if (prodDate.getTime() > now.getTime() + 86400000) {
        throw new BadRequestException(
          'Production dates cannot be set in the future. Please select a valid date.',
        );
      }
    }

    const currentAnimal =
      dto.animalId && dto.animalId !== existing.animalId
        ? await this.resolveAnimal(dto.animalId, targetFarmId)
        : existing.animal;

    // Business Rules Validation
    this.animalBusinessRulesService.validateMilkEligibility(
      currentAnimal,
      prodDate,
    );

    const session = dto.milkingSession || existing.milkingSession;

    // If animal, date, or session changed, verify duplicate uniqueness
    if (
      animalId !== existing.animalId ||
      prodDate.getTime() !== existing.productionDate.getTime() ||
      session !== existing.milkingSession
    ) {
      const duplicate = await this.prisma.milkProduction.findUnique({
        where: {
          animalId_productionDate_milkingSession: {
            animalId,
            productionDate: prodDate,
            milkingSession: session,
          },
        },
      });

      if (duplicate && duplicate.id !== id) {
        throw new ConflictException(
          `A milk production record already exists for animal on this date and ${session} session.`,
        );
      }
    }

    // Check for active milk withdrawal periods
    const activeWithdrawals = await this.prisma.withdrawalPeriod.findMany({
      where: {
        animalId: currentAnimal.id,
        productType: 'MILK',
        status: 'ACTIVE',
        startDate: { lte: prodDate },
        endDate: { gte: prodDate },
      },
    });

    let finalMilkQuality =
      dto.milkQuality !== undefined ? dto.milkQuality : existing.milkQuality;
    let finalNotes =
      dto.notes !== undefined
        ? dto.notes
        : existingMeta.userNotes || existing.notes;

    if (activeWithdrawals.length > 0) {
      finalMilkQuality = 'REJECTED';
      finalNotes = finalNotes
        ? `${finalNotes}\n(Auto-rejected due to active milk withdrawal)`
        : 'Auto-rejected due to active milk withdrawal';
    }

    const updated = await this.prisma.milkProduction.update({
      where: { id },
      data: {
        animalId,
        farmId: targetFarmId,
        productionDate: prodDate,
        milkingSession: session,
        quantityLiters:
          dto.quantityLiters !== undefined
            ? Number(dto.quantityLiters)
            : existing.quantityLiters,
        milkQuality: finalMilkQuality,
        fatPercentage:
          dto.fatPercentage !== undefined
            ? dto.fatPercentage
            : existing.fatPercentage,
        proteinPercentage:
          dto.proteinPercentage !== undefined
            ? dto.proteinPercentage
            : existing.proteinPercentage,
        notes: finalNotes,
      },
      include: {
        animal: {
          select: {
            id: true,
            animalNumber: true,
            name: true,
            imageUrl: true,
            species: true,
          },
        },
        farm: { select: { id: true, name: true } },
        recordedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    return formatRecord(updated);
  }

  /**
   * Void a milk production record (non-destructive audit workflow)
   */
  async voidRecord(
    userId: string,
    id: string,
    reason: string,
  ): Promise<{
    success: boolean;
    message: string;
    record: FormattedMilkRecord;
  }> {
    const existing = await this.prisma.milkProduction.findUnique({
      where: { id },
      include: {
        animal: {
          select: {
            id: true,
            animalNumber: true,
            name: true,
            imageUrl: true,
            species: true,
          },
        },
        farm: { select: { id: true, name: true } },
        recordedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException(
        `Milk production record "${id}" was not found.`,
      );
    }

    const { farmIds } = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      ['milk:delete'],
    );
    if (!farmIds.includes(existing.farmId)) {
      throw new ForbiddenException(
        'You do not have permission to void or delete records from this farm facility.',
      );
    }

    const { userNotes, meta } = parseNotesMetadata(existing.notes);
    if (meta.isVoided) {
      throw new BadRequestException(
        `Milk production record "${id}" has already been voided.`,
      );
    }

    const actingUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, firstName: true, lastName: true, email: true },
    });
    const voidedByName = actingUser
      ? `${actingUser.firstName} ${actingUser.lastName}`.trim() ||
        actingUser.email
      : 'Authorized User';
    const voidedAt = new Date().toISOString();

    // 1. Create audit log entry for regulatory traceability (Rule 9)
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'VOID_MILK_PRODUCTION',
        entityType: 'MilkProduction',
        entityId: id,
        oldValues: {
          id: existing.id,
          animalId: existing.animalId,
          animalTag: existing.animal.animalNumber,
          farmId: existing.farmId,
          productionDate: existing.productionDate.toISOString(),
          milkingSession: existing.milkingSession,
          quantityLiters: existing.quantityLiters,
          milkQuality: existing.milkQuality,
          notes: existing.notes,
        },
        newValues: {
          isVoided: true,
          voidReason: reason,
          voidedAt,
          voidedById: userId,
          voidedByName,
        },
      },
    });

    // 2. Mark record as VOIDED by persisting structured metadata in notes
    const newNotes = serializeNotesMetadata({
      userNotes,
      isVoided: true,
      voidReason: reason,
      voidedAt,
      voidedById: userId,
      voidedBy: voidedByName,
    });

    const updated = await this.prisma.milkProduction.update({
      where: { id },
      data: {
        notes: newNotes,
      },
      include: {
        animal: {
          select: {
            id: true,
            animalNumber: true,
            name: true,
            imageUrl: true,
            species: true,
          },
        },
        farm: { select: { id: true, name: true } },
        recordedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    this.logger.log(
      `Milk production record "${id}" voided by user "${userId}". Reason: ${reason}`,
    );

    return {
      success: true,
      message: `Milk production record "${id}" was successfully marked as voided.`,
      record: formatRecord(updated),
    };
  }

  /**
   * Delete a milk production record by invoking the auditable void flow
   */
  async deleteRecord(
    userId: string,
    id: string,
    reason = 'Record deleted by authorized user',
  ): Promise<{ success: boolean; message: string }> {
    const res = await this.voidRecord(userId, id, reason);
    return {
      success: res.success,
      message: res.message,
    };
  }

  /**
   * Permanently delete a milk production record from the database.
   * This is a destructive operation.
   */
  async deleteRecordPermanent(
    userId: string,
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    if (!UUID_REGEX.test(id)) {
      throw new BadRequestException('The provided record ID is invalid.');
    }

    const record = await this.prisma.milkProduction.findUnique({
      where: { id },
      include: { farm: true },
    });

    if (!record) {
      throw new NotFoundException(
        `The milk production record could not be found.`,
      );
    }

    // Verify user has 'milk:create' permission on this specific farm
    const { farmIds } = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      ['milk:delete-permanent'],
    );

    if (!farmIds.includes(record.farmId)) {
      throw new ForbiddenException(
        'You do not have permission to permanently delete records for this farm.',
      );
    }

    // 1. Fetch user for audit log mapping
    const actingUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true, email: true },
    });

    const deletedByName = actingUser
      ? `${actingUser.firstName} ${actingUser.lastName}`.trim() ||
        actingUser.email
      : 'Authorized User';

    // 2. Create permanent destruction audit log
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'DELETE_PERMANENT_MILK_PRODUCTION',
        entityType: 'MilkProduction',
        entityId: id,
        oldValues: {
          id: record.id,
          animalId: record.animalId,
          farmId: record.farmId,
          productionDate: record.productionDate.toISOString(),
          quantityLiters: record.quantityLiters,
        },
        newValues: {
          destroyedAt: new Date().toISOString(),
          destroyedBy: deletedByName,
        },
      },
    });

    await this.prisma.milkProduction.delete({
      where: { id },
    });

    this.logger.warn(
      `🗑️ Milk production record ${id} permanently deleted by User ${userId}`,
    );

    return {
      success: true,
      message: `Milk production record permanently deleted.`,
    };
  }
}
