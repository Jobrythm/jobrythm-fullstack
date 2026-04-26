import { apiClient } from './client';
import type { LineItem, LineItemPayload } from '../types';

export const createLineItem = async (jobId: string, payload: LineItemPayload): Promise<LineItem> => {
  const { data } = await apiClient.post<LineItem>(`/jobs/${jobId}/line-items`, payload);
  return data;
};

export const updateLineItem = async (id: string, payload: Partial<LineItemPayload>): Promise<LineItem> => {
  const { data } = await apiClient.put<LineItem>(`/line-items/${id}`, payload);
  return data;
};

export const deleteLineItem = async (id: string): Promise<void> => {
  await apiClient.delete(`/line-items/${id}`);
};

