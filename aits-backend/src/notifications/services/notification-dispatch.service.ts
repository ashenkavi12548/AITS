import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { NotificationStreamService } from './notification-stream.service';
import {
  CreateNotificationDto,
  NotificationItemResponse,
  NotificationPriority,
  NotificationType,
} from '../dto/notification.dto';
import { FarmUserStatus } from '@prisma/client';

export interface PrismaNotificationRecord {
  id: string;
  userId: string;
  title: string;
  message: string;
  notificationType: NotificationType;
  category: string | null;
  priority: NotificationPriority;
  referenceType: string | null;
  referenceId: string | null;
  actionUrl: string | null;
  farmId: string | null;
  dedupKey: string | null;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
}

export function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  if (diffSecs < 60) return 'Just now';
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function mapNotificationRecord(
  n: PrismaNotificationRecord,
): NotificationItemResponse {
  return {
    id: n.id,
    type: n.notificationType,
    category: n.category || n.notificationType,
    title: n.title,
    message: n.message,
    desc: n.message,
    priority: n.priority,
    isRead: n.isRead,
    read: n.isRead,
    readAt: n.readAt ? n.readAt.toISOString() : null,
    entityType: n.referenceType,
    entityId: n.referenceId,
    actionUrl: n.actionUrl,
    farmId: n.farmId,
    createdAt: n.createdAt.toISOString(),
    time: formatRelativeTime(n.createdAt),
  };
}

@Injectable()
export class NotificationDispatchService {
  private readonly logger = new Logger(NotificationDispatchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly streamService: NotificationStreamService,
  ) {}

  /**
   * Create notification with deduplication prevention and real-time SSE broadcast
   */
  async createNotification(
    dto: CreateNotificationDto,
  ): Promise<NotificationItemResponse> {
    // Deduplication check: prevent duplicate notifications for same event within 24h
    if (dto.dedupKey) {
      const existing = await this.prisma.notification.findFirst({
        where: {
          userId: dto.userId,
          dedupKey: dto.dedupKey,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      });

      if (existing) {
        this.logger.debug(
          `Deduplicated notification [${dto.dedupKey}] for user ${dto.userId}`,
        );
        return mapNotificationRecord(existing);
      }
    }

    const created = await this.prisma.notification.create({
      data: {
        userId: dto.userId,
        title: dto.title,
        message: dto.message,
        notificationType: dto.notificationType,
        category: dto.category || dto.notificationType,
        priority: dto.priority || 'NORMAL',
        referenceType: dto.referenceType,
        referenceId: dto.referenceId,
        actionUrl: dto.actionUrl,
        farmId: dto.farmId,
        dedupKey: dto.dedupKey,
      },
    });

    const mapped = mapNotificationRecord(created);

    // Push notification in real-time via SSE stream
    this.streamService.emitNotification(dto.userId, mapped);

    return mapped;
  }

  /**
   * Farm Scoping: Send notifications to all authorized users of a specific farm
   */
  async notifyFarmUsers(
    farmId: string,
    payload: Omit<CreateNotificationDto, 'userId'>,
  ): Promise<number> {
    try {
      const farm = await this.prisma.farm.findUnique({
        where: { id: farmId, deletedAt: null },
        select: {
          ownerId: true,
          users: {
            where: { status: FarmUserStatus.ACTIVE },
            select: { userId: true },
          },
        },
      });

      if (!farm) {
        this.logger.warn(
          `Cannot notify farm users: Farm ${farmId} does not exist or is deleted.`,
        );
        return 0;
      }

      const recipientIds = new Set<string>();
      if (farm.ownerId) {
        recipientIds.add(farm.ownerId);
      }
      farm.users.forEach((u) => recipientIds.add(u.userId));

      const creations = Array.from(recipientIds).map((userId) =>
        this.createNotification({
          ...payload,
          farmId,
          userId,
          dedupKey: payload.dedupKey
            ? `${payload.dedupKey}:${userId}`
            : undefined,
        }),
      );

      const results = await Promise.allSettled(creations);
      const successfulCount = results.filter(
        (r) => r.status === 'fulfilled',
      ).length;
      return successfulCount;
    } catch (error) {
      this.logger.error(
        `Failed to notify farm users for farm ${farmId}:`,
        error,
      );
      return 0;
    }
  }
}
