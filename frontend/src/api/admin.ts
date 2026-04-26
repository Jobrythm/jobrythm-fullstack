import { apiClient } from './client';
import type { AdminUser, AdminUserPlan } from '../types';

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
