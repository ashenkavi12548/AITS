import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationsService } from "@/services/notifications.service";
import {
  NotificationQueryParams,
  PaginatedNotifications,
  AppNotification,
} from "@/types/notification";

export function useNotifications(params?: NotificationQueryParams) {
  return useQuery({
    queryKey: ["notifications", params],
    queryFn: () => notificationsService.getNotifications(params),
    staleTime: 15000,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: notificationsService.getUnreadCount,
    staleTime: 15000,
    refetchInterval: 30000, // Background polling every 30 seconds
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationsService.markAsRead(id),
    onSuccess: (updatedNotification: AppNotification) => {
      // Optimistically update notifications in cache
      queryClient.setQueriesData<PaginatedNotifications>(
        { queryKey: ["notifications"] },
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            unreadCount: Math.max(0, oldData.unreadCount - 1),
            items: oldData.items.map((item) =>
              item.id === updatedNotification.id
                ? {
                    ...item,
                    isRead: true,
                    read: true,
                    readAt: new Date().toISOString(),
                  }
                : item,
            ),
          };
        },
      );

      // Decrement unread-count cache
      queryClient.setQueryData<number>(
        ["notifications", "unread-count"],
        (oldCount) => (oldCount !== undefined ? Math.max(0, oldCount - 1) : 0),
      );

      // Invalidate queries for full freshness
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-count"],
      });
      queryClient.invalidateQueries({
        queryKey: ["dashboard", "notifications"],
      });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationsService.markAllAsRead(),
    onSuccess: () => {
      // Optimistically mark all cached items as read
      queryClient.setQueriesData<PaginatedNotifications>(
        { queryKey: ["notifications"] },
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            unreadCount: 0,
            items: oldData.items.map((item) => ({
              ...item,
              isRead: true,
              read: true,
              readAt: new Date().toISOString(),
            })),
          };
        },
      );

      // Set unread count directly to 0
      queryClient.setQueryData<number>(["notifications", "unread-count"], 0);

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-count"],
      });
      queryClient.invalidateQueries({
        queryKey: ["dashboard", "notifications"],
      });
    },
  });
}
