import { apiClient } from './client';
import { clearSession, scheduleProactiveRefresh, setSession } from './sessionManager';
import type { AuthResponse, LoginRequest, LogoutRequest, RegisterRequest, User } from './types';
import { ensureFreshSession } from './client';

export const login = async (payload: LoginRequest): Promise<AuthResponse> => {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', payload);
  setSession(data.session);
  scheduleProactiveRefresh(ensureFreshSession);
  return data;
};

export const register = async (payload: RegisterRequest): Promise<AuthResponse> => {
  const { data } = await apiClient.post<AuthResponse>('/auth/register', payload);
  setSession(data.session);
  scheduleProactiveRefresh(ensureFreshSession);
  return data;
};

export const refresh = async (payload: { userId: string; refreshToken: string }): Promise<AuthResponse> => {
  const { data } = await apiClient.post<AuthResponse>('/auth/refresh', payload, { skipAuth: true } as never);
  setSession(data.session);
  scheduleProactiveRefresh(ensureFreshSession);
  return data;
};

export const logout = async (payload: LogoutRequest): Promise<void> => {
  try {
    await apiClient.post('/auth/logout', payload);
  } finally {
    clearSession();
  }
};

export const getMe = async (): Promise<User> => {
  const { data } = await apiClient.get<User>('/users/me');
  return data;
};

