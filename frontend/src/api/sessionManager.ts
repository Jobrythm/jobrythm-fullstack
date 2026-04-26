import { useAuthStore } from '../store/authStore';
import type { AuthSession } from './types';

const REFRESH_BUFFER_MS = 30_000;

let refreshTimeoutId: number | null = null;

const clearRefreshTimer = () => {
  if (refreshTimeoutId !== null) {
    window.clearTimeout(refreshTimeoutId);
    refreshTimeoutId = null;
  }
};

export const setSession = (session: AuthSession) => {
  useAuthStore.getState().setSession(session);
};

export const clearSession = () => {
  clearRefreshTimer();
  useAuthStore.getState().clearAuth();
};

export const getSession = (): AuthSession | null => useAuthStore.getState().session;

export const getAccessToken = (): string | null => useAuthStore.getState().session?.accessToken ?? null;

export const getRefreshPayload = () => {
  const session = getSession();
  if (!session) return null;

  return {
    userId: session.userId,
    refreshToken: session.refreshToken,
  };
};

export const isSessionExpiringSoon = () => {
  const expiresAt = getSession()?.expiresAt;
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() - Date.now() <= REFRESH_BUFFER_MS;
};

export const scheduleProactiveRefresh = (callback: () => Promise<void>) => {
  clearRefreshTimer();

  const expiresAt = getSession()?.expiresAt;
  if (!expiresAt) return;

  const timeoutMs = Math.max(new Date(expiresAt).getTime() - Date.now() - REFRESH_BUFFER_MS, 0);
  refreshTimeoutId = window.setTimeout(() => {
    void callback();
  }, timeoutMs);
};
