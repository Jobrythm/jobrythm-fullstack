import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';
import { normalizeApiError } from './errors';
import { resolveApiBaseUrl } from './hosts';
import { clearSession, getAccessToken, getRefreshPayload, isSessionExpiringSoon, scheduleProactiveRefresh, setSession } from './sessionManager';
import type { AuthSession, RefreshRequest } from './types';

type RetryConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  skipAuth?: boolean;
};

export const apiClient = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 10000,
});

let refreshPromise: Promise<AuthSession> | null = null;

const redirectToLogin = () => {
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

const refreshSession = async (): Promise<AuthSession> => {
  if (refreshPromise) {
    return refreshPromise;
  }

  const refreshPayload = getRefreshPayload();
  if (!refreshPayload) {
    throw new Error('No refresh session available');
  }

  refreshPromise = apiClient.post<{ session: AuthSession }>('/auth/refresh', refreshPayload as RefreshRequest, {
    skipAuth: true,
  } as AxiosRequestConfig & { skipAuth: true })
    .then((response) => response.data.session)
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
};

export const ensureFreshSession = async () => {
  if (!isSessionExpiringSoon()) {
    return;
  }

  const refreshed = await refreshSession();
  setSession(refreshed);
  scheduleProactiveRefresh(ensureFreshSession);
};

export const apiRequest = async <T>(config: AxiosRequestConfig): Promise<T> => {
  const { data } = await apiClient.request<T>(config);
  return data;
};

export const downloadBlob = async (config: AxiosRequestConfig): Promise<Blob> => {
  const response = await apiClient.request<Blob>({ ...config, responseType: 'blob' });
  return response.data;
};

apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const authConfig = config as RetryConfig;

  if (!authConfig.skipAuth) {
    await ensureFreshSession();
  }

  const token = getAccessToken();
  if (token && !authConfig.skipAuth) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryConfig | undefined;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !originalRequest.skipAuth) {
      originalRequest._retry = true;

      try {
        const refreshed = await refreshSession();
        setSession(refreshed);
        scheduleProactiveRefresh(ensureFreshSession);
        originalRequest.headers.Authorization = `Bearer ${refreshed.accessToken}`;
        return apiClient.request(originalRequest);
      } catch {
        clearSession();
        redirectToLogin();
      }
    }

    return Promise.reject(normalizeApiError(error));
  },
);

