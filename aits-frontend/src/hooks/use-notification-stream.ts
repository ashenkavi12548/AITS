"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { useAuthStore } from "@/stores/useAuthStore";
import { AppNotification, PaginatedNotifications } from "@/types/notification";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://unique-education-production-a86b.up.railway.app";

export function useNotificationStream() {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuthStore();
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user || typeof window === "undefined") {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      return;
    }

    const token = localStorage.getItem("aits_access_token");
    if (!token) return;

    const streamUrl = `${API_BASE_URL}/api/v1/notifications/stream?token=${encodeURIComponent(
      token,
    )}`;

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(streamUrl);
      eventSourceRef.current = eventSource;

      eventSource.addEventListener("notification", (event: MessageEvent) => {
        try {
          const notification: AppNotification = JSON.parse(event.data);
          if (!notification || !notification.id) return;

          // 1. Increment live unread count in React Query cache
          queryClient.setQueryData<number>(
            ["notifications", "unread-count"],
            (oldCount) => (oldCount !== undefined ? oldCount + 1 : 1),
          );

          // 2. Prepend to active notification lists in cache
          queryClient.setQueriesData<PaginatedNotifications>(
            { queryKey: ["notifications"] },
            (oldData) => {
              if (!oldData) return oldData;
              // Avoid duplicates if already present
              if (oldData.items.some((item) => item.id === notification.id)) {
                return oldData;
              }
              return {
                ...oldData,
                total: oldData.total + 1,
                unreadCount: oldData.unreadCount + 1,
                items: [notification, ...oldData.items],
              };
            },
          );

          // 3. Invalidate queries for complete data sync
          queryClient.invalidateQueries({
            queryKey: ["notifications", "unread-count"],
          });
          queryClient.invalidateQueries({
            queryKey: ["dashboard", "notifications"],
          });

          // 4. Trigger alert toast notification
          toast(
            `${notification.title}: ${notification.message}`,
            {
              icon: "🔔",
              duration: 4500,
              style: {
                borderRadius: "12px",
                fontSize: "12px",
                fontWeight: 600,
              },
            },
          );
        } catch {
          // Gracefully ignore parse issues
        }
      });

      eventSource.onerror = () => {
        // SSE auto-reconnects natively; close cleanly if readyState is closed
        if (eventSource && eventSource.readyState === EventSource.CLOSED) {
          eventSource.close();
        }
      };
    } catch {
      // EventSource initialization fallback
    }

    return () => {
      if (eventSource) {
        eventSource.close();
        eventSourceRef.current = null;
      }
    };
  }, [isAuthenticated, user, queryClient]);
}
