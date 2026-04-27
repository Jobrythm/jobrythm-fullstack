import { apiClient } from './client';

export type RecurringFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';

export interface RecurringJobTemplate {
  id: string;
  userId: string;
  clientId?: string;
  client?: { id: string; name: string };
  title: string;
  description?: string;
  frequency: RecurringFrequency;
  startDate: string;
  endDate?: string;
  nextRunAt?: string;
  isActive: boolean;
  jobsSpawned: number;
  createdAt: string;
}

export interface CreateRecurringJobPayload {
  clientId?: string;
  title: string;
  description?: string;
  frequency: RecurringFrequency;
  startDate: string;
  endDate?: string;
}

export const recurringJobsApi = {
  list: () =>
    apiClient.get<RecurringJobTemplate[]>('/recurring-jobs').then((r: { data: RecurringJobTemplate[] }) => r.data),
  create: (data: CreateRecurringJobPayload) =>
    apiClient.post<RecurringJobTemplate>('/recurring-jobs', data).then((r: { data: RecurringJobTemplate }) => r.data),
  update: (id: string, data: Partial<CreateRecurringJobPayload> & { isActive?: boolean }) =>
    apiClient.put<RecurringJobTemplate>(`/recurring-jobs/${id}`, data).then((r: { data: RecurringJobTemplate }) => r.data),
  delete: (id: string) =>
    apiClient.delete(`/recurring-jobs/${id}`).then((r: { data: unknown }) => r.data),
};
