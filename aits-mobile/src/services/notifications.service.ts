import api from './api';
import {
  AppNotification,
  PaginatedNotifications,
  NotificationQueryParams,
  UnreadCountResponse,
} from '@/types/notification';

export const notificationsService = {
  getNotifications: async (
    params?: NotificationQueryParams,
  ): Promise<PaginatedNotifications> => {
    const response = await api.get<PaginatedNotifications>(
      '/api/v1/notifications',
      {
        params,
      },
    );
    return response.data;
  },

  getUnreadCount: async (): Promise<number> => {
    try {
      const response = await api.get<UnreadCountResponse>(
        '/api/v1/notifications/unread-count',
      );
      return response.data?.count ?? 0;
    } catch {
      return 0;
    }
  },

  getNotificationById: async (id: string): Promise<AppNotification> => {
    const response = await api.get<AppNotification>(
      `/api/v1/notifications/${id}`,
    );
    return response.data;
  },

  markAsRead: async (id: string): Promise<AppNotification> => {
    const response = await api.patch<AppNotification>(
      `/api/v1/notifications/${id}/read`,
    );
    return response.data;
  },

  markAllAsRead: async (): Promise<{ success: boolean; count: number }> => {
    const response = await api.patch<{ success: boolean; count: number }>(
      '/api/v1/notifications/read-all',
    );
    return response.data;
  },
};
