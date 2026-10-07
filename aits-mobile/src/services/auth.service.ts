import api from './api';
import { storage as SecureStore } from '@/utils/storage';
import {
  AuthResponse,
  AuthUser,
  ChangePasswordInput,
  LoginCredentials,
  RegisterInput,
  UpdateProfileInput,
} from '@/types/auth';

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/api/v1/auth/login', credentials);
    return response.data;
  },

  register: async (data: RegisterInput): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/api/v1/auth/register', data);
    return response.data;
  },

  verifyOtp: async (
    data: { email: string; otp: string },
  ): Promise<AuthResponse & { message: string }> => {
    const response = await api.post<AuthResponse & { message: string }>(
      '/api/v1/auth/verify-otp',
      data,
    );
    return response.data;
  },

  verifyEmail: async (
    token: string,
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.post<{ success: boolean; message: string }>(
      '/api/v1/auth/verify-email',
      { token },
    );
    return response.data;
  },

  resendVerification: async (
    email: string,
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.post<{ success: boolean; message: string }>(
      '/api/v1/auth/resend-verification',
      { email },
    );
    return response.data;
  },

  refreshToken: async (refreshToken?: string): Promise<AuthResponse> => {
    const token =
      refreshToken || (await SecureStore.getItemAsync('aits_refresh_token')) || undefined;
    const response = await api.post<AuthResponse>('/api/v1/auth/refresh', {
      refreshToken: token,
    });
    return response.data;
  },

  getMe: async (): Promise<AuthUser> => {
    const response = await api.get<AuthUser>('/api/v1/auth/me');
    return response.data;
  },

  changePassword: async (
    data: ChangePasswordInput,
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.post<{ success: boolean; message: string }>(
      '/api/v1/auth/change-password',
      data,
    );
    return response.data;
  },

  updateProfile: async (
    data: UpdateProfileInput,
  ): Promise<{ success: boolean; message: string; user: AuthUser }> => {
    const response = await api.put<{
      success: boolean;
      message: string;
      user: AuthUser;
    }>('/api/v1/auth/profile', data);
    return response.data;
  },

  uploadProfilePicture: async (file: File) => {
    const { userService } = await import('./user.service');
    return userService.uploadProfilePicture(file);
  },

  removeProfilePicture: async () => {
    const { userService } = await import('./user.service');
    return userService.removeProfilePicture();
  },

  logout: async (): Promise<{ success: boolean }> => {
    try {
      const response = await api.post<{ success: boolean }>('/api/v1/auth/logout');
      return response.data;
    } catch {
      return { success: true };
    }
  },

  logoutAll: async (): Promise<{ success: boolean }> => {
    try {
      const response = await api.post<{ success: boolean }>('/api/v1/auth/logout-all');
      return response.data;
    } catch {
      return { success: true };
    }
  },
};
