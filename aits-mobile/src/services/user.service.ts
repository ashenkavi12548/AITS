import api from './api';
import { AuthUser } from '@/types/auth';

/**
 * Interface representing the response after uploading/updating profile picture
 */
export interface ProfilePictureResponse {
  success: boolean;
  message: string;
  profileImageUrl: string | null;
  user?: AuthUser;
  isMockFallback?: boolean;
}

/**
 * Helper function to convert a File object to a Base64 Data URL string
 * for local client-side preview in check-before-update dialogs.
 */
export const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as data URL'));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

/**
 * Helper function to load an image from URL/dataURL and obtain its natural dimensions
 */
export const getImageDimensions = (
  src: string,
): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      reject(new Error('Unable to read image dimensions'));
    };
    img.src = src;
  });
};

/**
 * User Service (Clean Architecture API Layer)
 * Manages user profile updates, profile picture uploads, and avatar removals.
 */
export const userService = {
  /**
   * Upload profile picture image file to backend API.
   * Uses multipart/form-data.
   */
  uploadProfilePicture: async (file: File): Promise<ProfilePictureResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<ProfilePictureResponse>(
      '/api/auth/profile-picture',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );

    return response.data;
  },

  /**
   * Remove current profile picture image.
   */
  removeProfilePicture: async (): Promise<ProfilePictureResponse> => {
    const response = await api.delete<ProfilePictureResponse>(
      '/api/auth/profile-picture',
    );
    return response.data;
  },
};
