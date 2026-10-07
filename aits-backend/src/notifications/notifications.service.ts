import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  NotificationQueryDto,
  CreateNotificationDto,
  NotificationItemResponse,
  PaginatedNotificationsResponse,
  UnreadCountResponse,
  NotificationType,
} from './dto/notification.dto';
import { Prisma } from '@prisma/client';
import {
  NotificationDispatchService,
  PrismaNotificationRecord,
  mapNotificationRecord,
} from './services/notification-dispatch.service';

export type PrismaNotification = PrismaNotificationRecord;

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dispatchService: NotificationDispatchService,
  ) {}

  /**
   * Helper to map Prisma Notification to standardized frontend response
   */
  private mapNotification(
    n: PrismaNotificationRecord,
  ): NotificationItemResponse {
    return mapNotificationRecord(n);
  }

  /**
   * Get paginated notifications for an authenticated user with filtering
   */
  async getNotifications(
    userId: string,
    query: NotificationQueryDto,
  ): Promise<PaginatedNotificationsResponse> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = {
      userId,
    };

    if (query.unreadOnly) {
      where.isRead = false;
    }

    if (query.priority) {
      where.priority = query.priority;
    }

    if (query.category && query.category.toUpperCase() !== 'ALL') {
      const catUpper = query.category.toUpperCase().trim();
      where.OR = [
        { category: { equals: catUpper, mode: 'insensitive' } },
        {
          notificationType: Object.values(NotificationType).includes(
            catUpper as NotificationType,
          )
            ? (catUpper as NotificationType)
            : undefined,
        },
      ];
    }

    const [items, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return {
      items: items.map((item) => this.mapNotification(item)),
      total,
      unreadCount,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Efficient count of unread notifications for bell badge
   */
  async getUnreadCount(userId: string): Promise<UnreadCountResponse> {
    const count = await this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
    return { count };
  }

  /**
   * Get single notification with IDOR authorization check
   */
  async getNotificationById(
    id: string,
    userId: string,
  ): Promise<NotificationItemResponse> {
    const item = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException(
        `The requested notification could not be found.`,
      );
    }

    if (item.userId !== userId) {
      throw new ForbiddenException(
        'You are not authorized to view this notification.',
      );
    }

    return this.mapNotification(item);
  }

  /**
   * Mark single notification as read with IDOR authorization check
   */
  async markAsRead(
    id: string,
    userId: string,
  ): Promise<NotificationItemResponse> {
    const item = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException(
        `The requested notification could not be found.`,
      );
    }

    if (item.userId !== userId) {
      throw new ForbiddenException(
        'You are not authorized to modify this notification.',
      );
    }

    if (item.isRead) {
      return this.mapNotification(item);
    }

    const updated = await this.prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return this.mapNotification(updated);
  }

  /**
   * Mark all unread notifications as read for current user
   */
  async markAllAsRead(
    userId: string,
  ): Promise<{ success: boolean; count: number; message: string }> {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return {
      success: true,
      count: result.count,
      message: `${result.count} notification(s) marked as read.`,
    };
  }

  /**
   * Create notification (delegated to NotificationDispatchService)
   */
  async createNotification(
    dto: CreateNotificationDto,
  ): Promise<NotificationItemResponse> {
    return this.dispatchService.createNotification(dto);
  }

  /**
   * Farm Scoping: Send notifications to all authorized users of a specific farm (delegated)
   */
  async notifyFarmUsers(
    farmId: string,
    payload: Omit<CreateNotificationDto, 'userId'>,
  ): Promise<number> {
    return this.dispatchService.notifyFarmUsers(farmId, payload);
  }
}
