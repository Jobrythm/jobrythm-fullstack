import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  companyMembersApi,
  type CreateMemberPayload,
  type UpdateMemberPayload,
} from '../../../api/companyMembers';

const QUERY_KEY = ['company-members'];

export function useCompanyMembers() {
  return useQuery({ queryKey: QUERY_KEY, queryFn: companyMembersApi.list });
}

export function useCreateCompanyMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMemberPayload) => companyMembersApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useUpdateCompanyMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMemberPayload }) =>
      companyMembersApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useDeleteCompanyMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => companyMembersApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useResetMemberPassword() {
  return useMutation({
    mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) =>
      companyMembersApi.resetPassword(id, newPassword),
  });
}
