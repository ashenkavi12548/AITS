export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export type NotificationCategory =
  | 'HEALTH'
  | 'PRODUCTION'
  | 'BREEDING'
  | 'TRACEABILITY'
  | 'MOVEMENT'
  | 'VACCINATION'
  | 'SYSTEM'
  | 'ACCOUNT'
  | 'COMPLIANCE';

export interface AppNotification {
  id: string;
  type: string;
  category: string;
  title: string;
  message: string;
  desc?: string;
  priority: NotificationPriority;
  isRead: boolean;
  read?: boolean;
  readAt: string | null;
  entityType: string | null;
  entityId: string | null;
  actionUrl: string | null;
  farmId: string | null;
  createdAt: string;
  time?: string;
}

export interface PaginatedNotifications {
  items: AppNotification[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface NotificationQueryParams {
  page?: number;
  limit?: number;
  category?: string;
  unreadOnly?: boolean;
  priority?: NotificationPriority;
}

export interface UnreadCountResponse {
  count: number;
}
