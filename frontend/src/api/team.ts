import { apiClient } from './client';

export interface TeamMember {
  id: string;
  ownerId: string;
  name: string;
  email?: string;
  phone?: string;
  role: 'owner' | 'manager' | 'technician';
  notes?: string;
  isActive: boolean;
  linkedUserId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMemberPayload {
  name: string;
  email?: string;
  phone?: string;
  role?: TeamMember['role'];
  notes?: string;
  isActive?: boolean;
}

export const getTeamMembers = async (): Promise<TeamMember[]> => {
  const { data } = await apiClient.get<TeamMember[]>('/team');
  return data;
};

export const getTeamMember = async (id: string): Promise<TeamMember> => {
  const { data } = await apiClient.get<TeamMember>(`/team/${id}`);
  return data;
};

export const createTeamMember = async (payload: TeamMemberPayload): Promise<TeamMember> => {
  const { data } = await apiClient.post<TeamMember>('/team', payload);
  return data;
};

export const updateTeamMember = async (id: string, payload: Partial<TeamMemberPayload>): Promise<TeamMember> => {
  const { data } = await apiClient.put<TeamMember>(`/team/${id}`, payload);
  return data;
};

export const deleteTeamMember = async (id: string): Promise<void> => {
  await apiClient.delete(`/team/${id}`);
};
