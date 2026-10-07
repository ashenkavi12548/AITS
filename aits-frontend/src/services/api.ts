import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/stores/useAuthStore";
import toast from "react-hot-toast";

export interface ApiErrorDetails {
  field: string;
  message: string;
}

export interface ApiErrorResponse {
  message?: string | string[];
  error?: string;
  code?: string;
  details?: ApiErrorDetails[];
}

export interface AitsApiError extends AxiosError<ApiErrorResponse> {
  aitsCode?: string;
  aitsDetails?: ApiErrorDetails[];
}

const FRIENDLY_403_MSG =
  "Access denied. You don't have permission to perform this action.";

// Deduplicate the friendly 403 message if components also try to show it
const originalToastError = toast.error;
toast.error = ((
  message: Parameters<typeof originalToastError>[0],
  options?: Parameters<typeof originalToastError>[1],
) => {
  if (message === FRIENDLY_403_MSG) {
    return originalToastError(message, { ...options, id: "global-403" });
  }
  return originalToastError(message, options);
}) as typeof toast.error;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://unique-education-production-a86b.up.railway.app";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

// Request Interceptor: Attach Bearer token from localStorage if present
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("aits_access_token");
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error: unknown) => Promise.reject(error),
);

// Response Interceptor: Handle 401 with automatic token refresh queue
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response) {
      const data = error.response.data as ApiErrorResponse | null;
      const status = error.response.status;
      const code = data?.code || "";
      let friendlyMessage =
        "Something went wrong while processing your request. Please try again.";

      const aitsError = error as AitsApiError;
      aitsError.aitsCode = code;
      aitsError.aitsDetails = data?.details;

      if (process.env.NODE_ENV !== "production") {
        console.warn(
          `[API Response Error]\n` +
            `METHOD: ${error.config?.method?.toUpperCase()}\n` +
            `URL: ${error.config?.url}\n` +
            `STATUS: ${status}\n` +
            `MESSAGE: ${data?.message ? JSON.stringify(data.message) : "Unknown"}\n` +
            `CODE: ${code}`,
        );
      }

      if (status === 400 && code === "VALIDATION_ERROR") {
        friendlyMessage =
          "Unable to proceed. Please correct the highlighted fields.";
      } else if (code === "ANIMAL_SOLD") {
        friendlyMessage =
          "This animal has already been sold, so this action cannot be recorded.";
      } else if (code === "ANIMAL_QUARANTINED") {
        friendlyMessage =
          "This animal is currently under quarantine, so this action cannot be recorded.";
      } else if (code === "MILK_PRODUCTION_INVALID_GENDER") {
        friendlyMessage =
          "Milk production can only be recorded for female animals.";
      } else if (code === "TREATMENT_DIAGNOSIS_REQUIRED") {
        friendlyMessage =
          "Please select an animal with an eligible diagnosis before creating a treatment.";
      } else if (code === "TREATMENT_WITHDRAWAL_ACTIVE") {
        friendlyMessage =
          "Action blocked because this animal is currently within its treatment withdrawal period.";
      } else if (code === "VACCINATION_DUPLICATE") {
        friendlyMessage =
          "This vaccination has already been recorded for this animal today.";
      } else if (code === "FARM_ACCESS_DENIED") {
        friendlyMessage =
          "This animal is not available in your authorized farm.";
      } else if (status === 404 || code === "RESOURCE_NOT_FOUND") {
        friendlyMessage =
          "The requested record could not be found. It may have been removed.";
      } else if (status === 403 || code === "PERMISSION_DENIED") {
        friendlyMessage = "You do not have permission to perform this action.";
      } else if (status === 401) {
        // Suppress 401 unread-count errors if they happen in background
        if (error.config?.url?.includes("unread-count")) {
          friendlyMessage = "";
        } else {
          friendlyMessage = "Your session has expired. Please log in again.";
        }
      } else if (status >= 500) {
        friendlyMessage =
          "Something went wrong while processing your request. Please try again.";
      } else if (data?.message && typeof data.message === "string") {
        friendlyMessage = data.message;
      }

      if (friendlyMessage) {
        // Attach the friendly message to the error so components can use it
        error.message = friendlyMessage;

        // Don't show toast for 401s here, it's handled by auth logic
        if (status !== 401) {
          toast.error(friendlyMessage);
        }
      }
    } else if (error.request) {
      error.message =
        "Unable to connect to the server. Please check your connection and try again.";
      toast.error(error.message);
    }

    const originalRequest = error.config as
      | CustomAxiosRequestConfig
      | undefined;

    if (!error.response || error.response.status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    const url = originalRequest.url || "";
    const isAuthUrl =
      url.includes("/auth/login") ||
      url.includes("/auth/register") ||
      url.includes("/auth/refresh") ||
      url.includes("/auth/logout");

    // Do not attempt refresh on auth endpoints or if request was already retried
    if (isAuthUrl || originalRequest._retry) {
      if (typeof window !== "undefined") {
        const isAuthCheck = url.includes("/auth/me");
        const isPublicPage =
          window.location.pathname === "/" ||
          window.location.pathname === "/login" ||
          window.location.pathname === "/register" ||
          window.location.pathname === "/verify-email";

        // Clear stored tokens on definitive authentication failure
        if (originalRequest._retry || url.includes("/auth/refresh")) {
          localStorage.removeItem("aits_access_token");
          localStorage.removeItem("aits_refresh_token");
          localStorage.removeItem("aits_auth_storage");
          useAuthStore.getState().handleUnauthorized();

          if (!isAuthCheck && !isPublicPage) {
            const currentPath =
              window.location.pathname + window.location.search;
            const redirectUrl = `/login?redirect=${encodeURIComponent(currentPath)}`;
            // eslint-disable-next-line @next/next/no-location-assign-relative-destination
            window.location.href = redirectUrl;
          }
        }
      }
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(() => {
          if (typeof window !== "undefined") {
            const freshToken = localStorage.getItem("aits_access_token");
            if (freshToken) {
              originalRequest.headers.Authorization = `Bearer ${freshToken}`;
            }
          }
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const storedRefreshToken =
        typeof window !== "undefined"
          ? localStorage.getItem("aits_refresh_token")
          : null;

      const refreshResponse = await axios.post<{
        accessToken?: string;
        refreshToken?: string;
      }>(
        `${API_BASE_URL}/api/v1/auth/refresh`,
        { refreshToken: storedRefreshToken || undefined },
        {
          withCredentials: true,
          headers: storedRefreshToken
            ? { Authorization: `Bearer ${storedRefreshToken}` }
            : {},
        },
      );

      const newAccessToken = refreshResponse.data?.accessToken;
      const newRefreshToken = refreshResponse.data?.refreshToken;

      if (typeof window !== "undefined") {
        if (newAccessToken) {
          localStorage.setItem("aits_access_token", newAccessToken);
          api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        if (newRefreshToken) {
          localStorage.setItem("aits_refresh_token", newRefreshToken);
        }
      }

      processQueue(null);
      return api(originalRequest);
    } catch (refreshErr) {
      processQueue(refreshErr as AxiosError);

      if (typeof window !== "undefined") {
        localStorage.removeItem("aits_access_token");
        localStorage.removeItem("aits_refresh_token");
        localStorage.removeItem("aits_auth_storage");
        useAuthStore.getState().handleUnauthorized();

        const isPublicPage =
          window.location.pathname === "/" ||
          window.location.pathname === "/login" ||
          window.location.pathname === "/register" ||
          window.location.pathname === "/verify-email";

        if (!isPublicPage) {
          const currentPath = window.location.pathname + window.location.search;
          const redirectUrl = `/login?redirect=${encodeURIComponent(currentPath)}`;
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination
          window.location.href = redirectUrl;
        }
      }

      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
