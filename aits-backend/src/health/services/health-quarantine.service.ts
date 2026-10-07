import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import {
  Prisma,
  QuarantineStatus,
  ClearanceStatus,
  AnimalStatus,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { FarmAccessService } from '../../auth/services/farm-access.service';
import { HealthStateService } from '../health-state.service';
import {
  CreateQuarantineDto,
  CreateClearanceDto,
  ReleaseQuarantineDto,
  RevokeClearanceDto,
  HealthQueryDto,
} from '../dto';
import { PaginatedResult } from '../health.types';
import { NotificationDispatchService } from '../../notifications/services/notification-dispatch.service';

@Injectable()
export class HealthQuarantineService {
  private readonly logger = new Logger(HealthQuarantineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly farmAccessService: FarmAccessService,
    private readonly healthStateService: HealthStateService,
    private readonly notificationDispatchService: NotificationDispatchService,
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

    if (animal.status === AnimalStatus.SOLD) {
      throw new BadRequestException(
        `Animal '${animal.animalNumber}' has been sold and is no longer available for farm processes.`,
      );
    }

    return animal;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // QUARANTINE
  // ═══════════════════════════════════════════════════════════════════════════

  async getQuarantineData(query: HealthQueryDto, userId: string) {
    const scope = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      ['health:read'],
    );
    const { farmId } = query;
    const targetFarmIds = farmId ? [farmId] : scope.farmIds;

    const [zones, records] = await Promise.all([
      this.prisma.quarantineZone.findMany({
        where: targetFarmIds ? { farmId: { in: targetFarmIds } } : {},
        include: {
          _count: {
            select: {
              quarantineRecords: {
                where: { status: QuarantineStatus.ACTIVE },
              },
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.quarantineRecord.findMany({
        where: {
          ...(targetFarmIds ? { farmId: { in: targetFarmIds } } : {}),
          ...(query.status ? { status: query.status as QuarantineStatus } : {}),
        },
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
          orderedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const formattedZones = zones.map((z) => ({
      id: z.id,
      zone: z.name,
      capacity: z.capacity,
      occupied: z._count.quarantineRecords,
      status: z._count.quarantineRecords >= z.capacity ? 'full' : z.status,
      disease: z.diseaseRisk || 'General Quarantine',
      color:
        z._count.quarantineRecords > 0 ? 'text-red-500' : 'text-emerald-500',
      bg:
        z._count.quarantineRecords > 0 ? 'bg-red-500/10' : 'bg-emerald-500/10',
      border:
        z._count.quarantineRecords > 0
          ? 'border-red-500/20'
          : 'border-emerald-500/20',
    }));

    const formattedRecords = records.map((r) => ({
      id: r.id,
      animalTag: r.animal.animalNumber,
      animalName: r.animal.name || 'Unnamed',
      breed: r.animal.breed,
      species: r.animal.species,
      imageUrl: r.animal.imageUrl,
      zone: r.zoneName,
      reason: r.reason,
      startDate: r.startDate.toISOString().split('T')[0],
      expectedRelease: r.expectedRelease.toISOString().split('T')[0],
      status: r.status === QuarantineStatus.ACTIVE ? 'active' : 'released',
      orderedBy: `${r.orderedBy.firstName} ${r.orderedBy.lastName}`,
      govtRef: r.govtRef || 'N/A',
      contactAnimals: r.contactAnimals,
      notes: r.notes || '',
      farmName: r.animal.farm.name,
    }));

    return {
      zones: formattedZones,
      records: formattedRecords,
    };
  }

  async createQuarantine(dto: CreateQuarantineDto, userId: string) {
    const scope = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      ['health:record'],
    );
    const animal = await this.findAuthorizedAnimal(dto.animalTag, scope);

    const startDate = new Date(dto.startDate);
    const expectedRelease = new Date(dto.expectedRelease);

    if (expectedRelease <= startDate) {
      throw new BadRequestException(
        'Expected release date must be after isolation start date.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Mark animal as quarantined
      await tx.animal.update({
        where: { id: animal.id },
        data: { status: AnimalStatus.QUARANTINED },
      });

      // 2. Create quarantine record
      const record = await tx.quarantineRecord.create({
        data: {
          farmId: animal.farmId,
          animalId: animal.id,
          zoneId: dto.zoneId,
          zoneName: dto.zoneName,
          reason: dto.reason,
          startDate,
          expectedRelease,
          govtRef: dto.govtRef,
          contactAnimals: dto.contactAnimals || [],
          notes: dto.notes,
          status: QuarantineStatus.ACTIVE,
          orderedById: userId,
        },
        include: { animal: true, orderedBy: true },
      });

      // 3. Audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'QUARANTINE_ORDER',
          entityType: 'QuarantineRecord',
          entityId: record.id,
          newValues: {
            animalNumber: animal.animalNumber,
            zone: dto.zoneName,
            reason: dto.reason,
          },
        },
      });

      this.notificationDispatchService
        .notifyFarmUsers(animal.farmId, {
          title: 'Animal Quarantined',
          message: `Animal ${animal.animalNumber} has been placed in quarantine zone ${dto.zoneName}. Reason: ${dto.reason}`,
          notificationType: 'HEALTH',
          priority: 'HIGH',
          referenceType: 'QuarantineRecord',
          referenceId: record.id,
          actionUrl: `/health/quarantine/${record.id}`,
        })
        .catch((err) =>
          this.logger.error('Failed to dispatch notification', err),
        );

      return record;
    });
  }

  async releaseQuarantine(id: string, userId: string) {
    const scope = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      ['health:read'],
    );
    const record = await this.prisma.quarantineRecord.findUnique({
      where: { id },
      include: { animal: true },
    });

    if (!record) {
      throw new NotFoundException('The quarantine record could not be found.');
    }

    if (!scope.farmIds.includes(record.farmId)) {
      throw new ForbiddenException(
        'Unauthorized to release this animal from quarantine',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Update quarantine record
      const updated = await tx.quarantineRecord.update({
        where: { id },
        data: {
          status: QuarantineStatus.RELEASED,
          actualRelease: new Date(),
        },
      });

      // 2. Restore animal status to ACTIVE
      await tx.animal.update({
        where: { id: record.animalId },
        data: { status: AnimalStatus.ACTIVE },
      });

      // 3. Audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'QUARANTINE_RELEASE',
          entityType: 'QuarantineRecord',
          entityId: id,
        },
      });

      this.notificationDispatchService
        .notifyFarmUsers(record.farmId, {
          title: 'Quarantine Released',
          message: `Animal ${record.animal.animalNumber} has been tentatively released from quarantine.`,
          notificationType: 'HEALTH',
          priority: 'NORMAL',
          referenceType: 'QuarantineRecord',
          referenceId: updated.id,
          actionUrl: `/health/quarantine/${updated.id}`,
        })
        .catch((err) =>
          this.logger.error('Failed to dispatch notification', err),
        );

      return updated;
    });
  }

  async extendQuarantine(
    id: string,
    newExpectedRelease: string,
    userId: string,
  ) {
    const scope = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      ['health:record'],
    );
    const record = await this.prisma.quarantineRecord.findUnique({
      where: { id },
    });

    if (!record) {
      throw new NotFoundException('Quarantine record not found');
    }

    if (!scope.farmIds.includes(record.farmId)) {
      throw new ForbiddenException('Unauthorized to extend quarantine');
    }

    const releaseDate = new Date(newExpectedRelease);
    if (releaseDate <= record.startDate) {
      throw new BadRequestException(
        'New release date must be after isolation start date.',
      );
    }

    return this.prisma.quarantineRecord.update({
      where: { id },
      data: { expectedRelease: releaseDate },
    });
  }

  async releaseQuarantineVerified(
    id: string,
    dto: ReleaseQuarantineDto,
    userId: string,
  ) {
    const scope = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      ['health:read'],
    );
    const record = await this.prisma.quarantineRecord.findUnique({
      where: { id },
      include: { animal: true },
    });

    if (!record)
      throw new NotFoundException('The quarantine record could not be found.');

    if (!scope.farmIds.includes(record.farmId)) {
      throw new ForbiddenException(
        'You do not have permission to release this animal from quarantine.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Release quarantine record
      const updated = await tx.quarantineRecord.update({
        where: { id },
        data: {
          status: QuarantineStatus.RELEASED,
          actualRelease: new Date(),
          releaseCriteriaMet: dto.releaseCriteriaMet ?? true,
          releasedById: userId,
          releaseReason: dto.releaseReason,
          supportingLabResultId: dto.supportingLabResultId,
          notes: dto.notes
            ? `${record.notes || ''}\nRelease Notes: ${dto.notes}`
            : record.notes,
        },
      });

      // 2. Check if other active quarantines exist for this animal
      const otherQuarantines = await tx.quarantineRecord.count({
        where: {
          animalId: record.animalId,
          status: QuarantineStatus.ACTIVE,
          id: { not: id },
        },
      });

      // 3. Lift associated active movement restriction
      await tx.movementRestriction.updateMany({
        where: { animalId: record.animalId, status: 'ACTIVE' },
        data: {
          status: 'LIFTED',
          liftedById: userId,
          liftedReason: `Quarantine released: ${dto.releaseReason}`,
          liftedAt: new Date(),
        },
      });

      if (otherQuarantines === 0) {
        await tx.animal.update({
          where: { id: record.animalId },
          data: { status: AnimalStatus.ACTIVE },
        });
      }

      await tx.auditLog.create({
        data: {
          userId,
          action: 'QUARANTINE_RELEASE_VERIFIED',
          entityType: 'QuarantineRecord',
          entityId: id,
          newValues: {
            animalNumber: record.animal.animalNumber,
            reason: dto.releaseReason,
            criteriaMet: dto.releaseCriteriaMet,
          },
        },
      });

      this.notificationDispatchService
        .notifyFarmUsers(record.farmId, {
          title: 'Quarantine Release Verified',
          message: `Animal ${record.animal.animalNumber} has been officially cleared from quarantine.`,
          notificationType: 'HEALTH',
          priority: 'NORMAL',
          referenceType: 'QuarantineRecord',
          referenceId: updated.id,
          actionUrl: `/health/quarantine/${updated.id}`,
        })
        .catch((err) =>
          this.logger.error('Failed to dispatch notification', err),
        );

      return updated;
    });
  }

  async deleteQuarantine(id: string, userId: string) {
    const scope = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      ['health:delete'],
    );
    const record = await this.prisma.quarantineRecord.findUnique({
      where: { id },
      include: { animal: true },
    });

    if (!record) {
      throw new NotFoundException('Quarantine record not found');
    }

    if (!scope.farmIds.includes(record.farmId)) {
      throw new ForbiddenException(
        'Unauthorized to delete this quarantine record',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const deleted = await tx.quarantineRecord.delete({
        where: { id },
      });

      if (record.status === QuarantineStatus.ACTIVE) {
        const otherQuarantines = await tx.quarantineRecord.count({
          where: {
            animalId: record.animalId,
            status: QuarantineStatus.ACTIVE,
          },
        });

        if (otherQuarantines === 0) {
          await tx.animal.update({
            where: { id: record.animalId },
            data: { status: AnimalStatus.ACTIVE },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          userId,
          action: 'QUARANTINE_DELETE',
          entityType: 'QuarantineRecord',
          entityId: id,
          newValues: {
            animalNumber: record.animal.animalNumber,
          },
        },
      });

      return deleted;
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HEALTH CLEARANCE CERTIFICATES
  // ═══════════════════════════════════════════════════════════════════════════

  async getClearances(
    query: HealthQueryDto,
    userId: string,
  ): Promise<PaginatedResult<unknown>> {
    const scope = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      ['health:read'],
    );
    const { page = 1, limit = 20, search, status, farmId, animalId } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.HealthClearanceWhereInput = {
      ...(farmId ? { farmId } : { farmId: { in: scope.farmIds } }),
      ...(animalId ? { animalId } : {}),
      ...(status ? { status: status as ClearanceStatus } : {}),
      ...(search
        ? {
            OR: [
              { permitNo: { contains: search, mode: 'insensitive' } },
              { destination: { contains: search, mode: 'insensitive' } },
              { purpose: { contains: search, mode: 'insensitive' } },
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
      this.prisma.healthClearance.count({ where }),
      this.prisma.healthClearance.findMany({
        where,
        include: {
          animal: {
            select: {
              id: true,
              animalNumber: true,
              name: true,
              breed: true,
              farm: { select: { id: true, name: true } },
            },
          },
          issuedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          approvedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { issuedDate: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const formatted = records.map((c) => ({
      id: c.id,
      permitNo: c.permitNo,
      animalTag: c.animal.animalNumber,
      animalName: c.animal.name || 'Unnamed',
      breed: c.animal.breed,
      purpose: c.purpose,
      destination: c.destination,
      issuedBy: `${c.issuedBy.firstName} ${c.issuedBy.lastName}`,
      issuedDate: c.issuedDate.toISOString().split('T')[0],
      validUntil: c.validUntil.toISOString().split('T')[0],
      approvedBy: c.approvedBy
        ? `${c.approvedBy.firstName} ${c.approvedBy.lastName}`
        : 'Pending Official Approval',
      status: c.status.toLowerCase(),
      conditions: c.conditions || 'General livestock transit regulations apply',
      notes: c.notes || '',
      farmName: c.animal.farm.name,
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

  async createClearance(dto: CreateClearanceDto, userId: string) {
    const scope = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      ['health:record'],
    );
    const animal = await this.findAuthorizedAnimal(dto.animalTag, scope);

    // Strict veterinary prerequisite assertion
    try {
      await this.healthStateService.assertClearanceEligibility(
        animal.id,
        dto.purpose,
      );
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Animal is ineligible for health clearance';
      throw new BadRequestException(msg);
    }

    // Generate unique sequential permit number: CLR-YEAR-XXXXX
    const year = new Date().getFullYear();
    const count = await this.prisma.healthClearance.count();
    const permitNo = `CLR-${year}-${(count + 1).toString().padStart(4, '0')}`;

    const validUntil = new Date(dto.validUntil);

    return this.prisma.$transaction(async (tx) => {
      const clearance = await tx.healthClearance.create({
        data: {
          farmId: animal.farmId,
          animalId: animal.id,
          permitNo,
          purpose: dto.purpose,
          destination: dto.destination,
          validUntil,
          conditions: dto.conditions,
          notes: dto.notes,
          issuedById: userId,
          status: ClearanceStatus.PENDING,
        },
        include: { animal: true, issuedBy: true },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'HEALTH_CLEARANCE_ISSUE',
          entityType: 'HealthClearance',
          entityId: clearance.id,
          newValues: {
            permitNo,
            animalNumber: animal.animalNumber,
            destination: dto.destination,
          },
        },
      });

      this.notificationDispatchService
        .notifyFarmUsers(animal.farmId, {
          title: 'Health Clearance Requested',
          message: `A health clearance permit (${permitNo}) was requested for animal ${animal.animalNumber} to ${dto.destination}.`,
          notificationType: 'HEALTH',
          priority: 'NORMAL',
          referenceType: 'HealthClearance',
          referenceId: clearance.id,
        })
        .catch((err) =>
          this.logger.error('Failed to dispatch notification', err),
        );

      return clearance;
    });
  }

  async approveClearance(id: string, userId: string) {
    const scope = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      ['health:read'],
    );
    const clearance = await this.prisma.healthClearance.findUnique({
      where: { id },
      include: { animal: true },
    });

    if (!clearance) {
      throw new NotFoundException('The clearance permit could not be found.');
    }

    if (!scope.farmIds.includes(clearance.farmId)) {
      throw new ForbiddenException(
        'Unauthorized to approve this clearance permit',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.healthClearance.update({
        where: { id },
        data: {
          status: ClearanceStatus.APPROVED,
          approvedById: userId,
          approvedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'HEALTH_CLEARANCE_APPROVE',
          entityType: 'HealthClearance',
          entityId: id,
        },
      });

      this.notificationDispatchService
        .notifyFarmUsers(clearance.farmId, {
          title: 'Health Clearance Approved',
          message: `Health clearance permit ${clearance.permitNo} for animal ${clearance.animal.animalNumber} has been approved.`,
          notificationType: 'HEALTH',
          priority: 'NORMAL',
          referenceType: 'HealthClearance',
          referenceId: updated.id,
        })
        .catch((err) =>
          this.logger.error('Failed to dispatch notification', err),
        );

      return updated;
    });
  }

  async revokeClearance(id: string, dto: RevokeClearanceDto, userId: string) {
    const scope = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      ['health:read'],
    );
    const clearance = await this.prisma.healthClearance.findUnique({
      where: { id },
      include: { animal: true },
    });

    if (!clearance)
      throw new NotFoundException(
        'The health clearance document could not be found.',
      );

    if (!scope.farmIds.includes(clearance.farmId)) {
      throw new ForbiddenException(
        'Unauthorized to revoke this clearance permit',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.healthClearance.update({
        where: { id },
        data: {
          status: ClearanceStatus.REJECTED,
          revokedById: userId,
          revokedAt: new Date(),
          revocationReason: dto.revocationReason,
          notes: dto.notes
            ? `${clearance.notes || ''}\nRevocation: ${dto.notes}`
            : clearance.notes,
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'CLEARANCE_REVOKED',
          entityType: 'HealthClearance',
          entityId: id,
          newValues: {
            permitNo: clearance.permitNo,
            animalTag: clearance.animal.animalNumber,
            reason: dto.revocationReason,
          },
        },
      });

      this.notificationDispatchService
        .notifyFarmUsers(clearance.farmId, {
          title: 'Health Clearance Revoked',
          message: `Health clearance permit ${clearance.permitNo} for animal ${clearance.animal.animalNumber} has been revoked.`,
          notificationType: 'HEALTH',
          priority: 'HIGH',
          referenceType: 'HealthClearance',
          referenceId: updated.id,
        })
        .catch((err) =>
          this.logger.error('Failed to dispatch notification', err),
        );

      return updated;
    });
  }
}
