import api from './api';
import type {
  AnimalItem,
  AnimalDetailResponse,
  AnimalIdentifierItem,
  QRCodeItem,
  HerdStatsResponse,
  AnimalHistoryItem,
  AnimalsListResponse,
  AnimalQrResponse,
  CreateAnimalInput,
  CreateAnimalResponse,
  UpdateAnimalStatusInput,
  CreateIdentifierInput,
  ReplaceQrInput,
  AnimalQueryParams,
} from '@/types/animals';

// Re-export all types for backwards compatibility
export type {
  AnimalItem,
  AnimalDetailResponse,
  AnimalIdentifierItem,
  QRCodeItem,
  HerdStatsResponse,
  AnimalHistoryItem,
  AnimalsListResponse,
  AnimalQrResponse,
  CreateAnimalInput,
  CreateAnimalResponse,
  UpdateAnimalStatusInput,
  CreateIdentifierInput,
  ReplaceQrInput,
  AnimalQueryParams,
};

export const animalsService = {
  /**
   * List animals with server-side search, filtering, and pagination
   */
  getAnimals: async (
    params?: AnimalQueryParams,
  ): Promise<AnimalsListResponse> => {
    const response = await api.get<AnimalsListResponse>('/api/v1/animals', {
      params,
    });
    return response.data;
  },

  /**
   * Get server-side live herd statistics
   */
  getHerdStats: async (farmId?: string): Promise<HerdStatsResponse> => {
    const response = await api.get<HerdStatsResponse>(
      '/api/v1/animals/stats',
      {
        params: farmId ? { farmId } : undefined,
      },
    );
    return response.data;
  },

  /**
   * Get single animal complete identity graph and relations
   */
  getAnimalById: async (id: string): Promise<AnimalDetailResponse> => {
    const response = await api.get<AnimalDetailResponse>(
      `/api/v1/animals/${id}`,
    );
    return response.data;
  },

  /**
   * Register a new animal with ear tag, RFID, and instant QR generation
   */
  createAnimal: async (
    data: CreateAnimalInput,
  ): Promise<CreateAnimalResponse> => {
    const response = await api.post<CreateAnimalResponse>(
      '/api/v1/animals',
      data,
    );
    return response.data;
  },

  /**
   * Update animal identity traits
   */
  updateAnimal: async (
    id: string,
    data: Partial<CreateAnimalInput>,
  ): Promise<{ success: boolean; message: string; animal: AnimalItem }> => {
    const response = await api.patch(`/api/v1/animals/${id}`, data);
    return response.data;
  },

  /**
   * Transition animal status with validated audit reason
   */
  updateAnimalStatus: async (
    id: string,
    data: UpdateAnimalStatusInput,
  ): Promise<{ success: boolean; message: string; animal: AnimalItem }> => {
    const response = await api.patch(`/api/v1/animals/${id}/status`, data);
    return response.data;
  },

  /**
   * List identifiers registered for animal
   */
  getIdentifiers: async (id: string): Promise<AnimalIdentifierItem[]> => {
    const response = await api.get<AnimalIdentifierItem[]>(
      `/api/v1/animals/${id}/identifiers`,
    );
    return response.data;
  },

  /**
   * Add new identifier (RFID, Ear Tag, National ID)
   */
  addIdentifier: async (
    id: string,
    data: CreateIdentifierInput,
  ): Promise<{
    success: boolean;
    message: string;
    identifier: AnimalIdentifierItem;
  }> => {
    const response = await api.post(
      `/api/v1/animals/${id}/identifiers`,
      data,
    );
    return response.data;
  },

  /**
   * Get active QR and complete QR history
   */
  getAnimalQr: async (id: string): Promise<AnimalQrResponse> => {
    const response = await api.get<AnimalQrResponse>(
      `/api/v1/animals/${id}/qr`,
    );
    return response.data;
  },

  /**
   * Atomically replace a lost/damaged QR code while preserving history
   */
  replaceQr: async (
    id: string,
    data: ReplaceQrInput,
  ): Promise<{ success: boolean; message: string; activeQr: QRCodeItem }> => {
    const response = await api.post(
      `/api/v1/animals/${id}/qr/replace`,
      data,
    );
    return response.data;
  },

  /**
   * Deactivate a QR code
   */
  deactivateQr: async (
    id: string,
    qrId: string,
    data: { reason: string; notes?: string },
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.patch(
      `/api/v1/animals/${id}/qr/${qrId}/deactivate`,
      data,
    );
    return response.data;
  },

  /**
   * Get animal audit history timeline
   */
  getAnimalHistory: async (id: string): Promise<AnimalHistoryItem[]> => {
    const response = await api.get<AnimalHistoryItem[]>(
      `/api/v1/animals/${id}/history`,
    );
    return response.data;
  },

  /**
   * Get export URL for downloading filtered herd CSV
   */
  getExportUrl: (params?: AnimalQueryParams): string => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.breed) query.append('breed', params.breed);
    if (params?.gender) query.append('gender', params.gender);
    if (params?.status) query.append('status', params.status);
    if (params?.species) query.append('species', params.species);
    if (params?.farmId) query.append('farmId', params.farmId);
    const qs = query.toString();
    return `${baseUrl}/api/v1/animals/export${qs ? `?${qs}` : ''}`;
  },

  /**
   * Upload animal photo to Cloudinary / cloud storage
   */
  uploadPhoto: async (
    file: File,
  ): Promise<{ success: boolean; imageUrl: string; publicId: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<{
      success: boolean;
      imageUrl: string;
      publicId: string;
    }>('/api/v1/animals/upload-photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Soft delete / archive animal
   */
  deleteAnimal: async (
    id: string,
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/api/v1/animals/${id}`);
    return response.data;
  },
};

export default animalsService;
