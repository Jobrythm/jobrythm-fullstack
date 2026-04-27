import { apiClient } from './client';

export interface TimeEntry {
  id: string;
  userId: string;
  jobId?: string;
  teamMemberId?: string;
  startTime: string;
  endTime?: string;
  description?: string;
  durationMinutes?: number;
  isBillable: boolean;
  hourlyRateCents?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TimeEntryPayload {
  jobId?: string;
  teamMemberId?: string;
  startTime: string;
  endTime?: string;
  description?: string;
  durationMinutes?: number;
  isBillable?: boolean;
  hourlyRateCents?: number;
}

export const getTimeEntries = async (jobId?: string): Promise<TimeEntry[]> => {
  const { data } = await apiClient.get<TimeEntry[]>('/time-entries', {
    params: jobId ? { jobId } : undefined,
  });
  return data;
};

export const createTimeEntry = async (payload: TimeEntryPayload): Promise<TimeEntry> => {
  const { data } = await apiClient.post<TimeEntry>('/time-entries', payload);
  return data;
};

export const updateTimeEntry = async (id: string, payload: Partial<TimeEntryPayload>): Promise<TimeEntry> => {
  const { data } = await apiClient.put<TimeEntry>(`/time-entries/${id}`, payload);
  return data;
};

export const deleteTimeEntry = async (id: string): Promise<void> => {
  await apiClient.delete(`/time-entries/${id}`);
};

export const clockIn = async (jobId?: string): Promise<TimeEntry> => {
  const { data } = await apiClient.post<TimeEntry>('/time-entries/clock-in', { jobId });
  return data;
};

export const clockOut = async (): Promise<TimeEntry> => {
  const { data } = await apiClient.post<TimeEntry>('/time-entries/clock-out');
  return data;
};
