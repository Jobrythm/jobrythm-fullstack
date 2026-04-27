import { apiClient } from './client';
import type { AdminUser, AdminUserPlan, AppSettings } from '../types';

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
  stripeApiKey?: string;
  stripeWebhookSecret?: string;
  stripeStarterMonthlyPriceId?: string;
  stripeStarterAnnualPriceId?: string;
  stripeProfessionalMonthlyPriceId?: string;
  stripeProfessionalAnnualPriceId?: string;
  stripeBusinessMonthlyPriceId?: string;
  stripeBusinessAnnualPriceId?: string;
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
