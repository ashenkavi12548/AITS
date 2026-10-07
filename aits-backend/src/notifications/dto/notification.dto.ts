import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
export const NotificationPriority = {
  LOW: 'LOW',
  NORMAL: 'NORMAL',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const;

export type NotificationPriority =
  (typeof NotificationPriority)[keyof typeof NotificationPriority];

export const NotificationType = {
  VACCINATION: 'VACCINATION',
  HEALTH: 'HEALTH',
  FEEDING: 'FEEDING',
  DOCUMENT_EXPIRY: 'DOCUMENT_EXPIRY',
  SYNC: 'SYNC',
  BREEDING: 'BREEDING',
  MOVEMENT: 'MOVEMENT',
  SYSTEM: 'SYSTEM',
} as const;

export type NotificationType =
  (typeof NotificationType)[keyof typeof NotificationType];

export class NotificationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true || value === 1 || value === '1')
      return true;
    if (value === 'false' || value === false || value === 0 || value === '0')
      return false;
    return undefined;
  })
  @IsBoolean()
  unreadOnly?: boolean;

  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;
}

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  message!: string;

  @IsEnum(NotificationType)
  notificationType: NotificationType = NotificationType.SYSTEM;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @IsOptional()
  @IsString()
  referenceType?: string;

  @IsOptional()
  @IsString()
  referenceId?: string;

  @IsOptional()
  @IsString()
  actionUrl?: string;

  @IsOptional()
  @IsString()
  farmId?: string;

  @IsOptional()
  @IsString()
  dedupKey?: string;
}

export interface NotificationItemResponse {
  id: string;
  type: string;
  category: string;
  title: string;
  message: string;
  desc?: string; // backward compat with TopHeader
  priority: NotificationPriority;
  isRead: boolean;
  read: boolean; // backward compat with TopHeader
  readAt: string | null;
  entityType: string | null;
  entityId: string | null;
  actionUrl: string | null;
  farmId: string | null;
  createdAt: string;
  time?: string;
}

export interface PaginatedNotificationsResponse {
  items: NotificationItemResponse[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UnreadCountResponse {
  count: number;
}
