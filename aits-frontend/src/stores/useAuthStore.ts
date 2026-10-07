'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AxiosError } from 'axios';
import { AuthUser, LoginCredentials, RegisterInput } from '@/types/auth';
import { authService } from '@/services/auth.service';
import { api } from '@/services/api';

interface ApiErrorResponse {
  message?: string | string[];
}

function getErrorMessage(err: unknown, defaultMessage: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const axiosErr = err as AxiosError<ApiErrorResponse>;
    const msg = axiosErr.response?.data?.message;
    if (msg) {
      return Array.isArray(msg) ? msg.join(', ') : msg;
    }
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return defaultMessage;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  activeFarmId: string | null;

  // Computed / Helpers
  hasPermissionOnFarm: (permission: string, farmId?: string) => boolean;

  // Actions
  initAuth: () => Promise<void>;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (data: RegisterInput) => Promise<boolean>;

  logout: () => Promise<void>;
  updateUser: (updatedData: Partial<AuthUser>) => void;
  updateProfilePicture: (url: string | null) => void;
  setActiveFarmId: (farmId: string) => void;
  clearError: () => void;
  handleUnauthorized: () => void;
}

let initAuthPromise: Promise<void> | null = null;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,
      error: null,
      activeFarmId: null,

      hasPermissionOnFarm: (permission: string, farmId?: string) => {
        const state = get();
        if (!state.user || !state.isAuthenticated) return false;
        
        // System Admins have universal access
        if (state.user.roles?.includes('ADMIN') || state.user.roles?.includes('SUPER_ADMIN')) {
          return true;
        }

        const targetFarmId = farmId || state.activeFarmId || state.user.primaryFarmId;
        
        if (targetFarmId) {
          // If the user is the OWNER of this farm, they inherently possess all permissions
          if (state.user.farmRoles?.[targetFarmId] === 'OWNER') {
            return true;
          }

          // If there's a target farm, check farm-specific permissions
          if (state.user.farmPermissions?.[targetFarmId]) {
            if (state.user.farmPermissions[targetFarmId].includes(permission)) {
              return true;
            }
          }
          
          // If a farm is targeted and we haven't returned true yet, they don't have permission ON THAT FARM.
          // Do not fall back to global permissions for farm-scoped actions unless they're an admin.
          return false;
        }

        // If no farm is targeted (e.g. global dashboard view), fallback to global permissions
        return state.user.permissions?.includes(permission) ?? false;
      },

      setActiveFarmId: (farmId: string) => {
        set({ activeFarmId: farmId });
      },

      initAuth: async () => {
        if (typeof window === 'undefined') return;

        const hasToken = Boolean(
          localStorage.getItem('aits_access_token') ||
          localStorage.getItem('aits_refresh_token'),
        );

        // If persisted user and tokens exist, ensure initialized is true immediately
        if (get().isAuthenticated && get().user && hasToken) {
          set({ isInitialized: true });
        } else if (!hasToken && !get().isAuthenticated) {
          set({ isInitialized: true, isAuthenticated: false, user: null });
          return;
        }

        if (initAuthPromise) {
          return initAuthPromise;
        }

        initAuthPromise = (async () => {
          try {
            // Set Bearer token header if present
            const token = localStorage.getItem('aits_access_token');
            if (token && !api.defaults.headers.common.Authorization) {
              api.defaults.headers.common.Authorization = `Bearer ${token}`;
            }

            const freshUser = await authService.getMe();

            set({
              user: freshUser,
              isAuthenticated: true,
              isInitialized: true,
              activeFarmId: get().activeFarmId || freshUser.primaryFarmId || null,
              isLoading: false,
              error: null,
            });
          } catch (err: unknown) {
            const is401 =
              err &&
              typeof err === 'object' &&
              'response' in err &&
              (err as { response?: { status?: number } }).response?.status === 401;

            if (is401) {
              localStorage.removeItem('aits_access_token');
              localStorage.removeItem('aits_refresh_token');
              localStorage.removeItem('aits_auth_storage');
              delete api.defaults.headers.common.Authorization;

              set({
                user: null,
                isAuthenticated: false,
                isInitialized: true,
                isLoading: false,
              });
            } else {
              // Network or transient server error: Preserve existing session so user is never booted offline
              set({
                isInitialized: true,
                isLoading: false,
              });
            }
          } finally {
            initAuthPromise = null;
          }
        })();

        return initAuthPromise;
      },

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.login(credentials);

          if (typeof window !== 'undefined') {
            if (response.accessToken) {
              localStorage.setItem('aits_access_token', response.accessToken);
              api.defaults.headers.common.Authorization = `Bearer ${response.accessToken}`;
            }
            if (response.refreshToken) {
              localStorage.setItem('aits_refresh_token', response.refreshToken);
            }
          }

          set({
            user: response.user,
            isAuthenticated: true,
            isInitialized: true,
            isLoading: false,
            error: null,
          });
          return true;
        } catch (err: unknown) {
          const message = getErrorMessage(
            err,
            'Authentication failed. Please check your credentials.',
          );
          set({
            isLoading: false,
            error: message,
          });
          return false;
        }
      },

      register: async (data: RegisterInput) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.register(data);

          if (typeof window !== 'undefined') {
            if (response.accessToken) {
              localStorage.setItem('aits_access_token', response.accessToken);
              api.defaults.headers.common.Authorization = `Bearer ${response.accessToken}`;
            }
            if (response.refreshToken) {
              localStorage.setItem('aits_refresh_token', response.refreshToken);
            }
          }

          set({
            user: response.user,
            isAuthenticated: true,
            isInitialized: true,
            isLoading: false,
            error: null,
          });
          return true;
        } catch (err: unknown) {
          const message = getErrorMessage(
            err,
            'Registration failed. Please check your information.',
          );
          set({
            isLoading: false,
            error: message,
          });
          return false;
        }
      },



      logout: async () => {
        set({ isLoading: true });
        try {
          await authService.logout();
        } catch {
          // Ignore network errors during logout
        } finally {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('aits_access_token');
            localStorage.removeItem('aits_refresh_token');
            localStorage.removeItem('aits_auth_storage');
            delete api.defaults.headers.common.Authorization;
          }

          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            isInitialized: true,
          });

          if (typeof window !== 'undefined') {
            // eslint-disable-next-line @next/next/no-location-assign-relative-destination
            window.location.href = `${window.location.origin}/login`;
          }
        }
      },

      updateUser: (updatedData: Partial<AuthUser>) => {
        const currentUser = get().user;
        if (!currentUser) return;
        const merged = { ...currentUser, ...updatedData };
        set({ user: merged });
      },

      updateProfilePicture: (url: string | null) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, profileImageUrl: url } });
        }
      },

      clearError: () => set({ error: null }),

      handleUnauthorized: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('aits_access_token');
          localStorage.removeItem('aits_refresh_token');
          localStorage.removeItem('aits_auth_storage');
          delete api.defaults.headers.common.Authorization;
        }
        set({
          user: null,
          isAuthenticated: false,
          isInitialized: true,
          isLoading: false,
        });
      },
    }),
    {
      name: 'aits_auth_storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
