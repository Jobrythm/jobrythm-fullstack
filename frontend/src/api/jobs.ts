import { apiClient } from './client';
import type { Job, JobPayload } from '../types';
import type { ApiListResponse, JobsQuery, UpdateJobStatusRequest } from './types';

export const getJobs = async (filters?: JobsQuery): Promise<ApiListResponse<Job>> => {
  const { data } = await apiClient.get<ApiListResponse<Job>>('/jobs', { params: filters });
  return data;
};

export const getJob = async (id: string): Promise<Job> => {
  const { data } = await apiClient.get<Job>(`/jobs/${id}`);
  return data;
};

export const createJob = async (payload: JobPayload): Promise<Job> => {
  const { data } = await apiClient.post<Job>('/jobs', payload);
  return data;
};

export const updateJob = async (id: string, payload: Partial<JobPayload>): Promise<Job> => {
  const { data } = await apiClient.put<Job>(`/jobs/${id}`, payload);
  return data;
};

export const updateJobStatus = async (id: string, payload: UpdateJobStatusRequest): Promise<Job> => {
  const { data } = await apiClient.patch<Job>(`/jobs/${id}/status`, payload);
  return data;
};

export const deleteJob = async (id: string): Promise<void> => {
  await apiClient.delete(`/jobs/${id}`);
};

