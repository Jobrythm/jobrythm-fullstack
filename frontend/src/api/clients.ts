import { apiClient } from './client';
import type { Client, ClientPayload } from '../types';
import type { ApiListResponse, ClientsQuery } from './types';

export const getClients = async (query?: ClientsQuery): Promise<ApiListResponse<Client>> => {
  const { data } = await apiClient.get<ApiListResponse<Client>>('/clients', { params: query });
  return data;
};

export const getClient = async (id: string): Promise<Client> => {
  const { data } = await apiClient.get<Client>(`/clients/${id}`);
  return data;
};

export const createClient = async (payload: ClientPayload): Promise<Client> => {
  const { data } = await apiClient.post<Client>('/clients', payload);
  return data;
};

export const updateClient = async (id: string, payload: Partial<ClientPayload>): Promise<Client> => {
  const { data } = await apiClient.put<Client>(`/clients/${id}`, payload);
  return data;
};

export const deleteClient = async (id: string): Promise<void> => {
  await apiClient.delete(`/clients/${id}`);
};

