import { apiClient } from './client';

export interface ChecklistItem {
  id: string;
  jobId: string;
  companyId: string;
  title: string;
  isCompleted: boolean;
  sortOrder: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistItemPayload {
  jobId: string;
  title: string;
  sortOrder?: number;
  notes?: string;
}

export const getChecklistItems = async (jobId: string): Promise<ChecklistItem[]> => {
  const { data } = await apiClient.get<ChecklistItem[]>('/checklists', { params: { jobId } });
  return data;
};

export const createChecklistItem = async (payload: ChecklistItemPayload): Promise<ChecklistItem> => {
  const { data } = await apiClient.post<ChecklistItem>('/checklists', payload);
  return data;
};

export const updateChecklistItem = async (
  id: string,
  payload: Partial<{ title: string; isCompleted: boolean; sortOrder: number; notes: string }>
): Promise<ChecklistItem> => {
  const { data } = await apiClient.put<ChecklistItem>(`/checklists/${id}`, payload);
  return data;
};

export const deleteChecklistItem = async (id: string): Promise<void> => {
  await apiClient.delete(`/checklists/${id}`);
};

export const reorderChecklistItems = async (items: { id: string; sortOrder: number }[]): Promise<void> => {
  await apiClient.post('/checklists/reorder', { items });
};
