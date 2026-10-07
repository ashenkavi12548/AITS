import { api } from './api';

export interface FarmFacility {
  id: string;
  ownerId: string;
  name: string;
  registrationNumber: string;
  address: string;
  province: string;
  district: string;
  city: string;
  farmType: string;
  contactNumber: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING';
  createdAt: string;
  owner?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
  };
  _count?: {
    users: number;
    animals: number;
    milkProduction: number;
  };
}

export interface FarmEmployee {
  id: string;
  farmId: string;
  userId: string;
  farmRole: 'OWNER' | 'MANAGER' | 'VETERINARIAN' | 'WORKER' | 'AUDITOR';
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  joinedAt: string;
  managedStaffIds?: string[];
  user: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    phone?: string | null;
    profileImageUrl?: string | null;
    status: string;
    isEmailVerified: boolean;
    lastLoginAt?: string | null;
    createdAt: string;
    permissions: string[];
  };
}

export interface CreateEmployeeInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  role?: 'OWNER' | 'MANAGER' | 'VETERINARIAN' | 'WORKER' | 'AUDITOR';
  permissions?: string[];
  assignedStaff?: string[];
  profileImageUrl?: string;
}

export interface UpdateEmployeeInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: 'OWNER' | 'MANAGER' | 'VETERINARIAN' | 'WORKER' | 'AUDITOR';
  status?: 'ACTIVE' | 'INACTIVE';
  permissions?: string[];
  assignedStaff?: string[];
  profileImageUrl?: string;
}

export interface CreateFarmInput {
  name: string;
  registrationNumber?: string;
  farmType: string;
  address: string;
  province: string;
  district: string;
  city: string;
  contactNumber: string;
  latitude?: number;
  longitude?: number;
}

export type Farm = FarmFacility;

export const farmsService = {
  getMyFarm: async (): Promise<FarmFacility> => {
    const response = await api.get<FarmFacility>('/api/v1/farms/my-farm');
    return response.data;
  },

  createFarm: async (data: CreateFarmInput): Promise<FarmFacility> => {
    const response = await api.post<FarmFacility>('/api/v1/farms', data);
    return response.data;
  },

  getFarms: async (): Promise<FarmFacility[]> => {
    try {
      const response = await api.get<FarmFacility[] | { data: FarmFacility[] }>('/api/v1/farms');
      if (Array.isArray(response.data)) {
        return response.data;
      }
      if (response.data && Array.isArray((response.data as { data: FarmFacility[] }).data)) {
        return (response.data as { data: FarmFacility[] }).data;
      }
      return [];
    } catch {
      // Fallback to my-farm if /api/v1/farms is role-restricted
      const my = await farmsService.getMyFarm();
      return my ? [my] : [];
    }
  },

  searchAllFarms: async (query?: string): Promise<FarmFacility[]> => {
    try {
      const response = await api.get<FarmFacility[]>('/api/v1/farms/search', {
        params: { q: query },
      });
      return response.data;
    } catch {
      return [];
    }
  },

  getEmployees: async (farmId: string): Promise<FarmEmployee[]> => {
    const response = await api.get<
      FarmEmployee[] | { data: FarmEmployee[]; meta?: Record<string, unknown> }
    >(`/api/v1/farms/${farmId}/employees`);
    if (Array.isArray(response.data)) {
      return response.data;
    }
    if (
      response.data &&
      Array.isArray((response.data as { data: FarmEmployee[] }).data)
    ) {
      return (response.data as { data: FarmEmployee[] }).data;
    }
    return [];
  },

  createEmployee: async (
    farmId: string,
    data: CreateEmployeeInput,
  ): Promise<FarmEmployee> => {
    const response = await api.post<FarmEmployee>(
      `/api/v1/farms/${farmId}/employees`,
      data,
    );
    return response.data;
  },

  updateEmployee: async (
    farmId: string,
    employeeId: string,
    data: UpdateEmployeeInput,
  ): Promise<FarmEmployee> => {
    const response = await api.put<FarmEmployee>(
      `/api/v1/farms/${farmId}/employees/${employeeId}`,
      data,
    );
    return response.data;
  },

  resetEmployeePassword: async (
    farmId: string,
    employeeId: string,
    newPassword: string,
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.post<{ success: boolean; message: string }>(
      `/api/v1/farms/${farmId}/employees/${employeeId}/reset-password`,
      { newPassword },
    );
    return response.data;
  },

  removeEmployee: async (
    farmId: string,
    employeeId: string,
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete<{ success: boolean; message: string }>(
      `/api/v1/farms/${farmId}/employees/${employeeId}`,
    );
    return response.data;
  },

  updateFarm: async (
    farmId: string,
    data: Partial<{
      name: string;
      farmType: string;
      address: string;
      province: string;
      district: string;
      city: string;
      contactNumber: string;
      latitude?: number;
      longitude?: number;
    }>,
  ): Promise<FarmFacility> => {
    const response = await api.patch<FarmFacility>(
      `/api/v1/farms/${farmId}`,
      data,
    );
    return response.data;
  },

  uploadStaffPhoto: async (
    file: File,
  ): Promise<{ success: boolean; imageUrl: string; publicId: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<{
      success: boolean;
      imageUrl: string;
      publicId: string;
    }>('/api/v1/farms/upload-photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
