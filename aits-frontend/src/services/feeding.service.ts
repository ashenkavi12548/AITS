import { api } from "./api";

export interface FeedType {
  id: string;
  name: string;
  description?: string | null;
  unit: string;
}

export interface FeedingRecord {
  id: string;
  animalId: string;
  feedTypeId: string;
  quantity: number;
  unit: string;
  fedAt: string;
  notes?: string | null;
  feedType: FeedType;
  recordedBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  animal?: {
    id: string;
    name: string;
    animalNumber: string;
  };
}

export interface CreateFeedingRecordDto {
  animalId: string;
  feedTypeId: string;
  quantity: number;
  unit: string;
  fedAt?: string;
  notes?: string;
}

export interface UpdateFeedingRecordDto {
  feedTypeId?: string;
  quantity?: number;
  unit?: string;
  fedAt?: string;
  notes?: string;
}

export const feedingService = {
  getFeedTypes: async () => {
    const response = await api.get<FeedType[]>("/api/v1/feeding/feed-types");
    return response.data;
  },

  getAllFeedingRecords: async () => {
    const response = await api.get<FeedingRecord[]>("/api/v1/feeding/records");
    return response.data;
  },

  getFeedingRecordsForAnimal: async (animalId: string) => {
    const response = await api.get<FeedingRecord[]>(
      `/api/v1/feeding/records/${animalId}`
    );
    return response.data;
  },

  createFeedingRecord: async (data: CreateFeedingRecordDto) => {
    const response = await api.post<FeedingRecord>(
      "/api/v1/feeding/records",
      data
    );
    return response.data;
  },

  updateFeedingRecord: async (id: string, data: UpdateFeedingRecordDto) => {
    const response = await api.patch<FeedingRecord>(
      `/api/v1/feeding/records/${id}`,
      data
    );
    return response.data;
  },

  deleteFeedingRecord: async (id: string) => {
    const response = await api.delete<{ success: boolean }>(
      `/api/v1/feeding/records/${id}`
    );
    return response.data;
  },
};
