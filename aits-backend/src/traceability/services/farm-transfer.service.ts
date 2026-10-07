import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  FarmTransferStatus,
  FarmTransferReason,
  Prisma,
  NotificationPriority,
  NotificationType,
} from '@prisma/client';
import { NotificationsService } from '../../notifications/notifications.service';
import {
  ConfirmArrivalDto,
  CreateFarmTransferDto,
  CancelTransferDto,
} from '../dto/farm-transfer.dto';
import { transferInclude, shapeTransfer } from './traceability-shapes';

import { FarmAccessService } from '../../auth/services/farm-access.service';
import { AnimalBusinessRulesService } from '../../common/business-rules/animal-business-rules.service';

@Injectable()
export class FarmTransferService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly farmAccessService: FarmAccessService,
    private readonly animalBusinessRulesService: AnimalBusinessRulesService,
  ) {}

  async getFarmTransfers(
    userId: string,
    filters: {
      page?: number;
      limit?: number;
      search?: string;
      fromFarmId?: string;
      toFarmId?: string;
      animalId?: string;
      status?: FarmTransferStatus | 'ALL';
      reason?: FarmTransferReason | 'ALL';
      startDate?: string;
      endDate?: string;
    } = {},
  ) {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 10, 50);
    const skip = (page - 1) * limit;

    const { farmIds } = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      ['traceability:write'],
    );

    const where: Prisma.FarmTransferWhereInput = { deletedAt: null };

    if (farmIds.length === 0) {
      return { data: [], meta: { total: 0, page, limit, totalPages: 0 } };
    }
    where.OR = [{ fromFarmId: { in: farmIds } }, { toFarmId: { in: farmIds } }];

    if (filters.fromFarmId && filters.fromFarmId !== 'ALL')
      where.fromFarmId = filters.fromFarmId;
    if (filters.toFarmId && filters.toFarmId !== 'ALL')
      where.toFarmId = filters.toFarmId;
    if (filters.animalId && filters.animalId !== 'ALL')
      where.animalId = filters.animalId;
    if (filters.status && filters.status !== 'ALL')
      where.status = filters.status;
    if (filters.reason && filters.reason !== 'ALL')
      where.reason = filters.reason;

    if (filters.startDate || filters.endDate) {
      where.departureDate = {};
      if (filters.startDate)
        where.departureDate.gte = new Date(filters.startDate);
      if (filters.endDate) where.departureDate.lte = new Date(filters.endDate);
    }

    if (filters.search) {
      const q = filters.search;
      where.OR = [
        { animal: { animalNumber: { contains: q, mode: 'insensitive' } } },
        { animal: { name: { contains: q, mode: 'insensitive' } } },
        { driverName: { contains: q, mode: 'insensitive' } },
        { vehicleNumber: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.farmTransfer.findMany({
        where,
        include: transferInclude,
        orderBy: { departureDate: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.farmTransfer.count({ where }),
    ]);

    return {
      data: rows.map(shapeTransfer),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
    };
  }

  async createFarmTransfer(userId: string, dto: CreateFarmTransferDto) {
    const { farmIds } = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      ['traceability:write'],
    );
    if (!farmIds.includes(dto.fromFarmId)) {
      throw new ForbiddenException(
        'You do not have permission to initiate transfers from this facility.',
      );
    }

    const animal = await this.prisma.animal.findUnique({
      where: { id: dto.animalId },
    });
    if (!animal)
      throw new NotFoundException('The requested animal could not be found.');

    // Business Rules validation for movement
    this.animalBusinessRulesService.validateMovementEligibility(
      animal,
      new Date(dto.departureDate),
    );

    // Source farm must match animal's current farm location
    if (dto.fromFarmId !== animal.farmId)
      throw new BadRequestException(
        'Source farm does not match animal current registered facility.',
      );

    // Destination farm must exist and be different from source farm
    if (dto.fromFarmId === dto.toFarmId)
      throw new BadRequestException(
        'Destination farm must be different from source farm.',
      );

    const destFarm = await this.prisma.farm.findUnique({
      where: { id: dto.toFarmId },
    });
    if (!destFarm || destFarm.status !== 'ACTIVE' || destFarm.deletedAt)
      throw new BadRequestException(
        'Destination farm facility does not exist or is inactive.',
      );

    // Check for active movements
    const active = await this.prisma.farmTransfer.findFirst({
      where: {
        animalId: dto.animalId,
        status: {
          in: [FarmTransferStatus.SCHEDULED, FarmTransferStatus.IN_TRANSIT],
        },
        deletedAt: null,
      },
    });
    if (active)
      throw new BadRequestException(
        `Animal already has an active movement (${active.status}).`,
      );

    if (!dto.healthClearanceId) {
      throw new BadRequestException(
        'A valid Veterinary Health Clearance Certificate is required to schedule a transfer.',
      );
    }

    const clearance = await this.prisma.healthClearance.findUnique({
      where: { id: dto.healthClearanceId },
    });

    if (
      !clearance ||
      clearance.animalId !== dto.animalId ||
      clearance.status !== 'APPROVED'
    ) {
      throw new BadRequestException(
        'The provided Veterinary Health Clearance Certificate is invalid, not approved, or does not belong to this animal.',
      );
    }

    const row = await this.prisma.farmTransfer.create({
      data: {
        animalId: dto.animalId,
        fromFarmId: dto.fromFarmId,
        toFarmId: dto.toFarmId,
        healthClearanceId: dto.healthClearanceId,
        recordedById: userId,
        departureDate: new Date(dto.departureDate),
        departureTime: dto.departureTime,
        expectedArrivalDate: new Date(dto.expectedArrivalDate),
        expectedArrivalTime: dto.expectedArrivalTime,
        reason: dto.reason,
        status: FarmTransferStatus.SCHEDULED,
        vehicleNumber: dto.vehicleNumber,
        driverName: dto.driverName,
        driverContact: dto.driverContact,
        notes: dto.notes,
      },
      include: transferInclude,
    });

    // Notify destination farm that a movement has been scheduled
    this.notificationsService
      .notifyFarmUsers(row.toFarmId, {
        title: 'Animal Transfer Request',
        message: `${animal.name || animal.animalNumber || 'Animal'} is being transferred to your farm from ${row.fromFarm.name}.\nScheduled: ${new Date(dto.departureDate).toLocaleDateString()}\nVeterinary Health Clearance: ${clearance.permitNo}`,
        notificationType: NotificationType.MOVEMENT,
        category: 'MOVEMENT',
        priority: NotificationPriority.NORMAL,
        referenceType: 'FarmTransfer',
        referenceId: row.id,
        actionUrl: `/traceability/farm-movements/${row.id}`,
        dedupKey: `transfer:scheduled:${row.id}`,
      })
      .catch(() => {});

    return shapeTransfer(row);
  }

  async markInTransit(userId: string, id: string) {
    const row = await this.prisma.farmTransfer.findUnique({
      where: { id },
      include: { animal: true, fromFarm: true, toFarm: true },
    });
    if (!row || row.deletedAt)
      throw new NotFoundException(
        'The farm transfer record could not be found.',
      );
    if (row.status !== FarmTransferStatus.SCHEDULED)
      throw new BadRequestException(
        'Only SCHEDULED movements can be marked as IN_TRANSIT.',
      );

    const { farmIds } = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      ['traceability:write'],
    );
    if (!farmIds.includes(row.fromFarmId)) {
      throw new ForbiddenException(
        'You do not have permission to mark transfers from this facility in transit.',
      );
    }

    const updated = await this.prisma.farmTransfer
      .update({
        where: { id },
        data: { status: FarmTransferStatus.IN_TRANSIT },
        include: transferInclude,
      })
      .then(shapeTransfer);

    // Notify destination farm that transfer is in transit
    this.notificationsService
      .notifyFarmUsers(row.toFarmId, {
        title: 'Movement In Transit',
        message: `Transfer for animal ${row.animal.animalNumber} from ${row.fromFarm.name} is now in transit`,
        notificationType: NotificationType.MOVEMENT,
        category: 'MOVEMENT',
        priority: NotificationPriority.NORMAL,
        referenceType: 'FarmTransfer',
        referenceId: id,
        actionUrl: `/traceability/farm-movements/${id}`,
        dedupKey: `transfer:intransit:${id}`,
      })
      .catch(() => {});

    return updated;
  }

  async confirmArrival(userId: string, id: string, dto: ConfirmArrivalDto) {
    const row = await this.prisma.farmTransfer.findUnique({
      where: { id },
      include: { animal: true, fromFarm: true, toFarm: true },
    });
    if (!row || row.deletedAt)
      throw new NotFoundException(
        'The farm transfer record could not be found.',
      );
    if (row.status !== FarmTransferStatus.IN_TRANSIT)
      throw new BadRequestException(
        'Only IN_TRANSIT movements can have arrival confirmed.',
      );

    const { farmIds } = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      ['movement:update'],
    );
    if (!farmIds.includes(row.toFarmId)) {
      throw new ForbiddenException(
        'You do not have permission to receive transfers at this facility.',
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const transfer = await tx.farmTransfer.update({
        where: { id },
        data: {
          status: FarmTransferStatus.COMPLETED,
          actualArrivalDate: new Date(dto.actualArrivalDate),
          actualArrivalTime: dto.actualArrivalTime,
        },
        include: transferInclude,
      });

      await tx.animal.update({
        where: { id: row.animalId },
        data: { farmId: row.toFarmId },
      });

      try {
        await tx.auditLog.create({
          data: {
            userId: userId || null,
            action: 'FARM_TRANSFER_COMPLETED',
            entityType: 'Animal',
            entityId: row.animalId,
            oldValues: {
              farmId: row.fromFarmId,
              movementStatus: row.status,
            },
            newValues: {
              farmId: row.toFarmId,
              movementStatus: FarmTransferStatus.COMPLETED,
              transferId: id,
            },
          },
        });
      } catch (error) {
        console.error(
          'Failed to create audit log for farm transfer completion:',
          error,
        );
      }

      return transfer;
    });

    this.notificationsService
      .notifyFarmUsers(row.toFarmId, {
        title: 'Movement Completed',
        message: `Animal ${row.animal.animalNumber} from ${row.fromFarm.name} arrived. Added to system.`,
        notificationType: NotificationType.MOVEMENT,
        category: 'MOVEMENT',
        priority: NotificationPriority.HIGH,
        referenceType: 'FarmTransfer',
        referenceId: id,
        actionUrl: `/traceability/farm-movements/${id}`,
        dedupKey: `transfer:completed:${id}`,
      })
      .catch(() => {});

    this.notificationsService
      .notifyFarmUsers(row.fromFarmId, {
        title: 'Animal Transferred',
        message: `Animal ${row.animal.animalNumber} arrived at ${row.toFarm.name}. Removed from farm.`,
        notificationType: NotificationType.MOVEMENT,
        category: 'MOVEMENT',
        priority: NotificationPriority.NORMAL,
        referenceType: 'FarmTransfer',
        referenceId: id,
        actionUrl: `/traceability/farm-movements/${id}`,
        dedupKey: `transfer:removed:${id}`,
      })
      .catch(() => {});

    return shapeTransfer(updated);
  }

  async completeTransfer(userId: string, id: string) {
    const row = await this.prisma.farmTransfer.findUnique({
      where: { id },
      include: { animal: true, fromFarm: true, toFarm: true },
    });
    if (!row || row.deletedAt)
      throw new NotFoundException(
        'The farm transfer record could not be found.',
      );
    if (!(
      row.status === FarmTransferStatus.ARRIVED ||
      row.status === FarmTransferStatus.IN_TRANSIT
    ))
      throw new BadRequestException(
        'Movement must be IN_TRANSIT or ARRIVED to be completed.',
      );

    const { farmIds } = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      ['movement:update'],
    );
    if (!farmIds.includes(row.toFarmId)) {
      throw new ForbiddenException(
        'You do not have permission to receive transfers at this facility.',
      );
    }

    // Update animal's farm to toFarmId and record audit log inside an atomic interactive transaction
    const updated = await this.prisma.$transaction(async (tx) => {
      const transfer = await tx.farmTransfer.update({
        where: { id },
        data: { status: FarmTransferStatus.COMPLETED },
        include: transferInclude,
      });

      await tx.animal.update({
        where: { id: row.animalId },
        data: { farmId: row.toFarmId },
      });

      try {
        await tx.auditLog.create({
          data: {
            userId: userId || null,
            action: 'FARM_TRANSFER_COMPLETED',
            entityType: 'Animal',
            entityId: row.animalId,
            oldValues: {
              farmId: row.fromFarmId,
              movementStatus: row.status,
            },
            newValues: {
              farmId: row.toFarmId,
              movementStatus: FarmTransferStatus.COMPLETED,
              transferId: id,
            },
          },
        });
      } catch {
        // Audit log fallback preserves operational success
      }

      return transfer;
    });

    // Notify destination farm that transfer has completed and animal has been received
    this.notificationsService
      .notifyFarmUsers(row.toFarmId, {
        title: 'Movement Completed',
        message: `Transfer of animal ${row.animal.animalNumber} from ${row.fromFarm.name} has been completed. Animal added to the system.`,
        notificationType: NotificationType.MOVEMENT,
        category: 'MOVEMENT',
        priority: NotificationPriority.HIGH,
        referenceType: 'FarmTransfer',
        referenceId: id,
        actionUrl: `/traceability/farm-movements/${id}`,
        dedupKey: `transfer:completed:${id}`,
      })
      .catch(() => {});

    // Notify origin farm that transfer has completed and animal has been removed
    this.notificationsService
      .notifyFarmUsers(row.fromFarmId, {
        title: 'Animal Transferred',
        message: `Animal ${row.animal.animalNumber} has been successfully transferred to ${row.toFarm.name}. Animal is removed from the farm.`,
        notificationType: NotificationType.MOVEMENT,
        category: 'MOVEMENT',
        priority: NotificationPriority.NORMAL,
        referenceType: 'FarmTransfer',
        referenceId: id,
        actionUrl: `/traceability/farm-movements/${id}`,
        dedupKey: `transfer:removed:${id}`,
      })
      .catch(() => {});

    return shapeTransfer(updated);
  }

  async cancelTransfer(userId: string, id: string, dto: CancelTransferDto) {
    const row = await this.prisma.farmTransfer.findUnique({
      where: { id },
      include: { animal: true, fromFarm: true, toFarm: true },
    });
    if (!row || row.deletedAt)
      throw new NotFoundException(
        'The farm transfer record could not be found.',
      );
    if (
      row.status === FarmTransferStatus.COMPLETED ||
      row.status === FarmTransferStatus.CANCELLED
    )
      throw new BadRequestException(
        'Completed or already cancelled movements cannot be cancelled.',
      );

    const { farmIds } = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      ['movement:delete'],
    );
    if (!farmIds.includes(row.fromFarmId)) {
      throw new ForbiddenException(
        'You do not have permission to cancel transfers from this facility.',
      );
    }

    const updated = await this.prisma.farmTransfer
      .update({
        where: { id },
        data: {
          status: FarmTransferStatus.CANCELLED,
          cancelReason: dto.cancelReason,
        },
        include: transferInclude,
      })
      .then(shapeTransfer);

    // Notify destination farm that transfer was cancelled
    this.notificationsService
      .notifyFarmUsers(row.toFarmId, {
        title: 'Movement Cancelled',
        message: `Transfer for animal ${row.animal.animalNumber} from ${row.fromFarm.name} was cancelled. Reason: ${dto.cancelReason || 'Not specified'}`,
        notificationType: NotificationType.MOVEMENT,
        category: 'MOVEMENT',
        priority: NotificationPriority.NORMAL,
        referenceType: 'FarmTransfer',
        referenceId: id,
        actionUrl: `/traceability/farm-movements/${id}`,
        dedupKey: `transfer:cancelled:${id}`,
      })
      .catch(() => {});

    return updated;
  }
}
