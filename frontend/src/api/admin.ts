import { apiClient } from './client';
import type { AdminUser, AdminUserPlan, AdminStats, AppSettings } from '../types';

export interface CreateUserPayload {
  email: string;
  password: string;
  fullName: string;
  companyName?: string;
  plan: AdminUserPlan;
}

export interface UpdateUserPayload {
  fullName?: string;
  companyName?: string;
  plan?: AdminUserPlan;
}

export interface UpdateSettingsPayload {
  // Stripe
  stripeApiKey?: string;
  stripePublishableKey?: string;
  stripeWebhookSecret?: string;
  stripePortalConfigurationId?: string;
  stripeStarterMonthlyPriceId?: string;
  stripeStarterAnnualPriceId?: string;
  stripeProfessionalMonthlyPriceId?: string;
  stripeProfessionalAnnualPriceId?: string;
  stripeBusinessMonthlyPriceId?: string;
  stripeBusinessAnnualPriceId?: string;
  // General
  appUrl?: string;
  // Email
  smtpHost?: string;
  smtpPort?: string;
  smtpUser?: string;
  smtpPassword?: string;
  smtpFromEmail?: string;
  smtpFromName?: string;
  // AI / Gemini
  geminiApiKey?: string;
  geminiModel?: string;
}

export interface AiDebugLogEntry {
  id: string;
  timestamp: string;
  endpoint: string;
  status: 'success' | 'error' | 'unconfigured';
  durationMs: number;
  userId?: string;
  userEmail?: string;
  model?: string;
  request?: {
    systemPrompt?: string;
    userPrompt?: string;
    body?: unknown;
    params?: Record<string, string>;
  };
  rawResponse?: string;
  parsedResponse?: unknown;
  error?: {
    message: string;
    name?: string;
    stack?: string;
    detail?: unknown;
  };
  notes?: string[];
}

export const adminGetUsers = async (): Promise<AdminUser[]> => {
  const { data } = await apiClient.get<AdminUser[]>('/admin/users');
  return data;
};

export const adminCreateUser = async (payload: CreateUserPayload): Promise<AdminUser> => {
  const { data } = await apiClient.post<AdminUser>('/admin/users', payload);
  return data;
};

export const adminUpdateUser = async (id: string, payload: UpdateUserPayload): Promise<AdminUser> => {
  const { data } = await apiClient.put<AdminUser>(`/admin/users/${id}`, payload);
  return data;
};

export const adminDeleteUser = async (id: string): Promise<void> => {
  await apiClient.delete(`/admin/users/${id}`);
};

export const adminGetSettings = async (): Promise<AppSettings> => {
  const { data } = await apiClient.get<AppSettings>('/admin/settings');
  return data;
};

export const adminUpdateSettings = async (payload: UpdateSettingsPayload): Promise<AppSettings> => {
  const { data } = await apiClient.put<AppSettings>('/admin/settings', payload);
  return data;
};

export const adminGetStats = async (): Promise<AdminStats> => {
  const { data } = await apiClient.get<AdminStats>('/admin/stats');
  return data;
};

export const adminTestEmail = async (to?: string): Promise<{ message: string }> => {
  const { data } = await apiClient.post<{ message: string }>('/admin/settings/test-email', { to });
  return data;
};

export const adminGetAiLogs = async (): Promise<AiDebugLogEntry[]> => {
  const { data } = await apiClient.get<{ logs: AiDebugLogEntry[] }>('/admin/settings/ai-logs');
  return data.logs;
};

export const adminClearAiLogs = async (): Promise<void> => {
  await apiClient.delete('/admin/settings/ai-logs');
};
