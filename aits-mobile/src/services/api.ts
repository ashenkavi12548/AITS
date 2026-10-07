import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { storage as SecureStore } from "@/utils/storage";
import { Platform } from "react-native";

const FRIENDLY_403_MSG =
  "Access denied. You don't have permission to perform this action.";

import Constants from "expo-constants";

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  if (__DEV__) {
    const debuggerHost = Constants.expoConfig?.hostUri;
    const localhost = debuggerHost?.split(":")[0];

    if (localhost) {
      return `http://${localhost}:5001`;
    }
  }

  // Fallbacks if not in DEV or hostUri missing
  if (Platform.OS === "android") {
    return "http://10.0.2.2:5001";
  }

  return "http://localhost:5001";
};

export const API_BASE_URL = getBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let unauthorizedHandler: (() => void) | null = null;
export const setUnauthorizedHandler = (handler: () => void) => {
  unauthorizedHandler = handler;
};

let isRefreshing = false;
let failedQueue: {
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}[] = [];

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

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await SecureStore.getItemAsync("aits_access_token");
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      // Ignore secure store errors gracefully
    }
    return config;
  },
  (error: unknown) => {
    console.error("[API Request Error]", error);
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    console.error(`[API Response Error] ${error.message}`, {
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      method: error.config?.method,
      status: error.response?.status,
    });

    if (error.response && error.response.status === 403) {
      if (error.response.data && typeof error.response.data === "object") {
        (error.response.data as { message?: string }).message =
          FRIENDLY_403_MSG;
      }
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
      url.includes("/auth/verify-otp") ||
      url.includes("/auth/logout");

    if (isAuthUrl || originalRequest._retry) {
      if (originalRequest._retry || url.includes("/auth/refresh")) {
        await SecureStore.deleteItemAsync("aits_access_token");
        await SecureStore.deleteItemAsync("aits_refresh_token");
        if (unauthorizedHandler) unauthorizedHandler();
      }
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(async () => {
          const freshToken =
            await SecureStore.getItemAsync("aits_access_token");
          if (freshToken) {
            originalRequest.headers.Authorization = `Bearer ${freshToken}`;
          }
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const storedRefreshToken =
        await SecureStore.getItemAsync("aits_refresh_token");

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

      if (newAccessToken) {
        await SecureStore.setItemAsync("aits_access_token", newAccessToken);
        api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      }
      if (newRefreshToken) {
        await SecureStore.setItemAsync("aits_refresh_token", newRefreshToken);
      }

      processQueue(null);
      return api(originalRequest);
    } catch (refreshErr) {
      processQueue(refreshErr as AxiosError);

      await SecureStore.deleteItemAsync("aits_access_token");
      await SecureStore.deleteItemAsync("aits_refresh_token");
      if (unauthorizedHandler) unauthorizedHandler();

      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  },
);
