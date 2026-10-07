import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";

export type CalendarEventType =
  | "VACCINATION"
  | "TREATMENT"
  | "CALVING"
  | "VET_VISIT"
  | "QUARANTINE"
  | "CUSTOM";

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay: boolean;
  type: CalendarEventType;
  color: string;
  animalId?: string;
  animalNumber?: string;
  farmId?: string;
  description?: string;
  source:
    | "CUSTOM"
    | "VACCINATION"
    | "TREATMENT"
    | "PREGNANCY"
    | "VETERINARY_VISIT"
    | "QUARANTINE"
    | "OTHER";
  sourceId: string;
}

export function useCalendarEvents(
  startDate: string,
  endDate: string,
  filter?: string,
) {
  return useQuery({
    queryKey: ["calendar", "events", startDate, endDate, filter],
    queryFn: async (): Promise<CalendarEvent[]> => {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (filter) params.append("filter", filter);

      const response = await api.get(
        `/api/v1/dashboard/calendar?${params.toString()}`,
      );
      return response.data;
    },
    enabled: !!startDate && !!endDate,
  });
}

export interface CreateCalendarEventPayload {
  title: string;
  eventType: "CUSTOM" | "VACCINATION" | "TREATMENT" | "CALVING" | "VET_VISIT";
  scheduledDate: string;
  description?: string;
  notes?: string;
  startTime?: string;
  endTime?: string;
  isAllDay?: boolean;
  color?: string;
  animalTag?: string;
  farmId?: string;
}

export interface UpdateCalendarEventPayload {
  title?: string;
  description?: string;
  notes?: string;
  scheduledDate?: string;
  startTime?: string;
  endTime?: string;
  isAllDay?: boolean;
  color?: string;
  animalTag?: string;
}

export function useCreateCalendarEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateCalendarEventPayload) => {
      const res = await api.post("/api/v1/dashboard/schedules", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar", "events"] });
    },
  });
}

export function useUpdateCalendarEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: UpdateCalendarEventPayload & { id: string }) => {
      const res = await api.patch(
        `/api/v1/dashboard/calendar-events/${id}`,
        payload,
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar", "events"] });
    },
  });
}

export function useDeleteCalendarEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/api/v1/dashboard/calendar-events/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar", "events"] });
    },
  });
}

export function useCompleteCalendarEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/api/v1/dashboard/schedules/${id}/complete`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar", "events"] });
    },
  });
}
