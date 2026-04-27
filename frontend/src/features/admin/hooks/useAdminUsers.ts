import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  adminCreateUser,
  adminDeleteUser,
  adminGetSettings,
  adminGetStats,
  adminGetUsers,
  adminUpdateSettings,
  adminUpdateUser,
} from '../../../api/admin';
import type { CreateUserPayload, UpdateSettingsPayload, UpdateUserPayload } from '../../../api/admin';

export const adminUsersQueryKey    = ['admin', 'users']    as const;
export const adminSettingsQueryKey = ['admin', 'settings'] as const;
export const adminStatsQueryKey    = ['admin', 'stats']    as const;

export const useAdminUsers = () => {
  return useQuery({
    queryKey: adminUsersQueryKey,
    queryFn: adminGetUsers,
  });
};

export const useAdminCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateUserPayload) => adminCreateUser(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminUsersQueryKey });
    },
  });
};

export const useAdminUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserPayload }) =>
      adminUpdateUser(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminUsersQueryKey });
    },
  });
};

export const useAdminDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminDeleteUser(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminUsersQueryKey });
    },
  });
};

export const useAdminSettings = () => {
  return useQuery({
    queryKey: adminSettingsQueryKey,
    queryFn: adminGetSettings,
  });
};

export const useUpdateAdminSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateSettingsPayload) => adminUpdateSettings(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminSettingsQueryKey });
    },
  });
};

export const useAdminStats = () => {
  return useQuery({
    queryKey: adminStatsQueryKey,
    queryFn: adminGetStats,
  });
};
