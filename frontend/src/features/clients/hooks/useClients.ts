import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient, deleteClient, getClient, getClients, updateClient } from '../../../api/clients';
import type { ClientPayload } from '../../../types';
import type { ClientsQuery } from '../../../api/types';

export const clientsQueryKey = ['clients'] as const;

export const useClients = (query?: ClientsQuery) => {
  return useQuery({
    queryKey: [...clientsQueryKey, query],
    queryFn: () => getClients(query),
  });
};

export const useClient = (id?: string) => {
  return useQuery({
    queryKey: [...clientsQueryKey, id],
    queryFn: () => getClient(id as string),
    enabled: Boolean(id),
  });
};

export const useCreateClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ClientPayload) => createClient(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clientsQueryKey });
    },
  });
};

export const useUpdateClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ClientPayload> }) => updateClient(id, payload),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: clientsQueryKey });
      void queryClient.invalidateQueries({ queryKey: [...clientsQueryKey, variables.id] });
    },
  });
};

export const useDeleteClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteClient(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clientsQueryKey });
    },
  });
};

