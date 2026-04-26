import { apiClient } from './client';
import type { User } from '../types';
import type { UpdateUserProfileRequest } from './types';

export const getCurrentUser = async (): Promise<User> => {
  const { data } = await apiClient.get<User>('/users/me');
  return data;
};

export const updateCurrentUser = async (payload: UpdateUserProfileRequest): Promise<User> => {
  const { data } = await apiClient.put<User>('/users/me', payload);
  return data;
};

export const uploadCurrentUserLogo = async (file: File): Promise<User> => {
  const form = new FormData();
  form.append('file', file);
  const { data } = await apiClient.post<User>('/users/me/logo', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};
