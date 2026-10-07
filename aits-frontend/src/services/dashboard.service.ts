import { api } from './api';
import {
  DashboardSummary,
  MilkProductionDataPoint,
  PeriodType,
  AnimalStatusItem,
  UpcomingEvent,
  CreateScheduleEventInput,
  AnimalAttentionResponse,
  UserProfile,
} from '@/types/dashboard';

export interface QuickAddAnimalInput {
  animalNumber: string;
  name?: string;
  breed?: string;
  gender?: 'MALE' | 'FEMALE';
  imageUrl?: string;
}

export interface QuickAddAnimalResponse {
  success: boolean;
  message: string;
  animal: {
    id: string;
    animalNumber: string;
    name?: string | null;
    breed?: string | null;
    gender: string;
    status: string;
    qrCode?: {
      qrValue?: string;
      qrImageUrl?: string;
    };
  };
}

export interface SearchResultItem {
  type: string;
  title: string;
  desc: string;
  href: string;
}

export interface DashboardNotificationItem {
  id: string;
  title: string;
  desc: string;
  time: string;
  type: 'ALERT' | 'REMINDER' | 'SUCCESS';
  read: boolean;
}

export const dashboardService = {
  getSummary: async (period?: string): Promise<DashboardSummary> => {
    const response = await api.get<DashboardSummary>('/api/v1/dashboard/summary', {
      params: period ? { period } : undefined,
    });
    return response.data;
  },

  getMilkTrends: async (period: PeriodType = 'daily'): Promise<MilkProductionDataPoint[]> => {
    const response = await api.get<MilkProductionDataPoint[]>('/api/v1/dashboard/milk-trends', {
      params: { period },
    });
    return response.data;
  },

  getAnimalStatusDistribution: async (): Promise<AnimalStatusItem[]> => {
    const response = await api.get<AnimalStatusItem[]>('/api/v1/dashboard/animal-status');
    return response.data;
  },

  getUpcomingEvents: async (): Promise<UpcomingEvent[]> => {
    const response = await api.get<UpcomingEvent[]>('/api/v1/dashboard/upcoming-events');
    return response.data;
  },

  getAnimalsRequiringAttention: async (): Promise<AnimalAttentionResponse> => {
    const response = await api.get<AnimalAttentionResponse>('/api/v1/dashboard/animals-attention');
    return response.data;
  },

  getNotifications: async (): Promise<DashboardNotificationItem[]> => {
    const response = await api.get<DashboardNotificationItem[]>('/api/v1/dashboard/notifications');
    return response.data;
  },

  markAllNotificationsRead: async () => {
    const response = await api.post('/api/v1/dashboard/notifications/read-all');
    return response.data;
  },

  quickAddAnimal: async (data: QuickAddAnimalInput) => {
    const response = await api.post('/api/v1/dashboard/quick-add-animal', data);
    return response.data;
  },

  resolveAttentionAlert: async (id: string) => {
    const response = await api.post(`/api/v1/dashboard/resolve-attention/${id}`);
    return response.data;
  },

  searchRecords: async (query: string): Promise<SearchResultItem[]> => {
    const response = await api.get<SearchResultItem[]>('/api/v1/dashboard/search', {
      params: { q: query },
    });
    return response.data;
  },

  getCurrentUser: async (): Promise<UserProfile | null> => {
    try {
      const response = await api.get<UserProfile>('/api/v1/dashboard/me');
      return response.data;
    } catch {
      return null;
    }
  },

  createScheduleEvent: async (data: CreateScheduleEventInput) => {
    const response = await api.post('/api/v1/dashboard/schedules', data);
    return response.data;
  },

  completeScheduleEvent: async (id: string) => {
    const response = await api.patch(`/api/v1/dashboard/schedules/${id}/complete`);
    return response.data;
  },
};
