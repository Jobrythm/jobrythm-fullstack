import { apiClient } from './client';

export interface CompanyMember {
  id: string;
  email: string;
  name: string;
  companyRole: 'member' | 'business_admin';
  createdAt: string;
}

export interface CreateMemberPayload {
  name: string;
  email: string;
  password: string;
  companyRole?: 'member' | 'business_admin';
}

export interface UpdateMemberPayload {
  name?: string;
  email?: string;
  companyRole?: 'member' | 'business_admin';
}

export const companyMembersApi = {
  list: () => apiClient.get<CompanyMember[]>('/company/members').then((r: { data: CompanyMember[] }) => r.data),
  create: (data: CreateMemberPayload) =>
    apiClient.post<CompanyMember>('/company/members', data).then((r: { data: CompanyMember }) => r.data),
  update: (id: string, data: UpdateMemberPayload) =>
    apiClient.put<CompanyMember>(`/company/members/${id}`, data).then((r: { data: CompanyMember }) => r.data),
  delete: (id: string) => apiClient.delete(`/company/members/${id}`).then((r: { data: unknown }) => r.data),
  resetPassword: (id: string, newPassword: string) =>
    apiClient.post(`/company/members/${id}/reset-password`, { newPassword }).then((r: { data: unknown }) => r.data),
};
