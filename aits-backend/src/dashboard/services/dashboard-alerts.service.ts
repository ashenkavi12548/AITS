import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { DashboardHelpersService } from './dashboard-helpers.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { PaginatedNotificationsResponse } from '../../notifications/dto/notification.dto';
import { AnimalStatus } from '@prisma/client';

@Injectable()
export class DashboardAlertsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly helpers: DashboardHelpersService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getNotifications(userId?: string) {
    if (!userId) {
      return [];
    }
    const res: PaginatedNotificationsResponse =
      await this.notificationsService.getNotifications(userId, {
        page: 1,
        limit: 10,
      });
    return res.items;
  }

  async markAllNotificationsRead(userId?: string) {
    if (!userId) {
      return {
        success: true,
        count: 0,
        message: 'All notifications marked as read',
      };
    }
    return this.notificationsService.markAllAsRead(userId);
  }

  async getAnimalsRequiringAttention(userId?: string) {
    const { farmIds } = await this.helpers.resolveAuthorizedFarms(userId);
    const animalFilter = this.helpers.buildAnimalFilter(farmIds, {});

    const attentionAnimals = await this.prisma.animal.findMany({
      where: {
        ...animalFilter,
        OR: [
          { status: AnimalStatus.QUARANTINED },
          { healthRecords: { some: { healthStatus: 'SICK' } } },
        ],
      },
      take: 10,
      include: {
        farm: { select: { name: true } },
        healthRecords: {
          orderBy: { recordDate: 'desc' },
          take: 1,
        },
      },
    });

    const items = attentionAnimals.map((a) => {
      const latestHr = a.healthRecords[0];
      const isQuarantine = a.status === AnimalStatus.QUARANTINED;
      return {
        id: a.id,
        animalNumber: a.animalNumber,
        name: a.name || undefined,
        breed: a.breed || undefined,
        species: a.species || undefined,
        imageUrl: a.imageUrl || undefined,
        farmName: a.farm?.name || 'Primary Herd',
        reason: isQuarantine
          ? 'Isolated in Quarantine Zone'
          : latestHr?.diagnosis || 'Clinical Observations Flagged',
        severity: isQuarantine ? ('CRITICAL' as const) : ('WARNING' as const),
        detectedAt: (latestHr?.recordDate || a.updatedAt).toISOString(),
        suggestedAction: isQuarantine
          ? 'Perform daily temperature check & isolation protocol'
          : 'Schedule veterinary diagnostic checkup',
      };
    });

    return {
      totalAttentionRequired: items.length,
      items,
    };
  }

  async resolveAttentionAlert(id: string, userId?: string) {
    const { farmIds } = await this.helpers.resolveAuthorizedFarms(userId);
    const farmFilter = { farmId: { in: farmIds } };

    try {
      await this.prisma.animal.updateMany({
        where: { id, status: AnimalStatus.QUARANTINED, ...farmFilter },
        data: { status: AnimalStatus.ACTIVE },
      });
    } catch {
      // Non-fatal resolve fallback
    }

    return {
      success: true,
      message: `Attention alert for record ${id} marked as resolved.`,
      resolvedAt: new Date().toISOString(),
    };
  }
}
