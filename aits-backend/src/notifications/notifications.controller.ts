import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Sse,
  MessageEvent,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { NotificationStreamService } from './services/notification-stream.service';
import {
  NotificationQueryDto,
  PaginatedNotificationsResponse,
  UnreadCountResponse,
  NotificationItemResponse,
} from './dto/notification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller(['api/v1/notifications', 'api/notifications'])
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly streamService: NotificationStreamService,
  ) {}

  @Sse('stream')
  @ApiOperation({
    summary:
      'Stream real-time notifications for authenticated user via Server-Sent Events',
  })
  @Permissions('notification:read')
  streamNotifications(
    @CurrentUser('id') userId: string,
  ): Observable<MessageEvent> {
    return this.streamService.subscribeToUserStream(userId);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notifications count for bell badge' })
  @Permissions('notification:read')
  async getUnreadCount(
    @CurrentUser('id') userId: string,
  ): Promise<UnreadCountResponse> {
    return this.notificationsService.getUnreadCount(userId);
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read for current user' })
  @Permissions('notification:update')
  async markAllAsReadPatch(@CurrentUser('id') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read (POST alias)' })
  @Permissions('notification:update')
  async markAllAsReadPost(@CurrentUser('id') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get paginated notifications with filters' })
  @Permissions('notification:read')
  async getNotifications(
    @CurrentUser('id') userId: string,
    @Query() query: NotificationQueryDto,
  ): Promise<PaginatedNotificationsResponse> {
    return this.notificationsService.getNotifications(userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single notification details' })
  @Permissions('notification:read')
  async getNotificationById(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ): Promise<NotificationItemResponse> {
    return this.notificationsService.getNotificationById(id, userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark single notification as read' })
  @Permissions('notification:update')
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ): Promise<NotificationItemResponse> {
    return this.notificationsService.markAsRead(id, userId);
  }
}
