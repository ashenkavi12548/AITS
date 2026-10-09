import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { storage as SecureStore } from '@/utils/storage';
import { AxiosError } from 'axios';
import { AuthUser, LoginCredentials } from '@/types/auth';
import { authService } from '@/services/auth.service';
import api, { setUnauthorizedHandler } from '@/services/api';

const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await SecureStore.getItemAsync(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await SecureStore.deleteItemAsync(name);
  },
};

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
  _hasHydrated: boolean;
  error: string | null;
  activeFarmId: string | null;

  hasPermissionOnFarm: (permission: string, farmId?: string) => boolean;

  initAuth: () => Promise<void>;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  setActiveFarmId: (farmId: string) => void;
  clearError: () => void;
  handleUnauthorized: () => void;
}

/**
 * Returns a promise that resolves once Zustand's persist middleware has
 * finished rehydrating state from SecureStore.  This prevents initAuth()
 * from running before in-memory state matches what was stored on disk.
 */
let hydrateResolve: (() => void) | null = null;
const hydrationPromise = new Promise<void>((resolve) => {
  hydrateResolve = resolve;
});

let initAuthPromise: Promise<void> | null = null;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,
      _hasHydrated: false,
      error: null,
      activeFarmId: null,

      hasPermissionOnFarm: (permission: string, farmId?: string) => {
        const state = get();
        if (!state.user || !state.isAuthenticated) return false;

        const targetFarmId = farmId || state.activeFarmId || state.user.primaryFarmId;
        
        if (targetFarmId) {
          if (state.user.farmRoles?.[targetFarmId] === 'OWNER') {
            return true;
          }
          if (state.user.farmPermissions?.[targetFarmId]) {
            if (state.user.farmPermissions[targetFarmId].includes(permission)) {
              return true;
            }
          }
        }
        return state.user.permissions?.includes(permission) ?? false;
      },

      setActiveFarmId: (farmId: string) => {
        set({ activeFarmId: farmId });
      },

      initAuth: async () => {
        // Wait for Zustand persist to finish rehydrating from SecureStore
        // so that get().isAuthenticated and get().user reflect stored state.
        if (!get()._hasHydrated) {
          await hydrationPromise;
        }

        const hasToken = Boolean(await SecureStore.getItemAsync('aits_access_token'));

        if (get().isAuthenticated && get().user && hasToken) {
          set({ isInitialized: true });
          return;
        } else if (!hasToken && !get().isAuthenticated) {
          set({ isInitialized: true, isAuthenticated: false, user: null });
          return;
        }

        if (initAuthPromise) {
          return initAuthPromise;
        }

        initAuthPromise = (async () => {
          try {
            const token = await SecureStore.getItemAsync('aits_access_token');
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
          } catch (error_unk: unknown) {
      const err = error_unk as { response?: { data?: { message?: string | string[] } }; message?: string };
            const is401 =
              err &&
              typeof err === 'object' &&
              'response' in err &&
              (err as { response?: { status?: number } }).response?.status === 401;

            if (is401) {
              await SecureStore.deleteItemAsync('aits_access_token');
              await SecureStore.deleteItemAsync('aits_refresh_token');
              delete api.defaults.headers.common.Authorization;

              set({
                user: null,
                isAuthenticated: false,
                isInitialized: true,
                isLoading: false,
              });
            } else {
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

          if (response.accessToken) {
            await SecureStore.setItemAsync('aits_access_token', response.accessToken);
            api.defaults.headers.common.Authorization = `Bearer ${response.accessToken}`;
          }
          if (response.refreshToken) {
            await SecureStore.setItemAsync('aits_refresh_token', response.refreshToken);
          }

          set({
            user: response.user,
            isAuthenticated: true,
            isInitialized: true,
            isLoading: false,
            error: null,
          });
          return true;
        } catch (error_unk: unknown) {
      const err = error_unk as { response?: { data?: { message?: string | string[] } }; message?: string };
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

      logout: async () => {
        set({ isLoading: true, error: null });
        try {
          await authService.logout();
        } catch {
          // ignore
        } finally {
          await SecureStore.deleteItemAsync('aits_access_token');
          await SecureStore.deleteItemAsync('aits_refresh_token');
          delete api.defaults.headers.common.Authorization;
          set({
            user: null,
            isAuthenticated: false,
            activeFarmId: null,
            isLoading: false,
          });
        }
      },

      clearError: () => set({ error: null }),
      handleUnauthorized: () => {
        set({
          user: null,
          isAuthenticated: false,
          activeFarmId: null,
        });
      },
    }),
    {
      name: 'aits_auth_storage',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        activeFarmId: state.activeFarmId,
      }),
      onRehydrateStorage: () => {
        return () => {
          // Called after Zustand has finished restoring state from SecureStore.
          useAuthStore.setState({ _hasHydrated: true });
          hydrateResolve?.();
        };
      },
    },
  ),
);

// Register the unauthorized handler with the API service to break the require cycle
setUnauthorizedHandler(() => {
  useAuthStore.getState().handleUnauthorized();
});
