import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { downloadInvoicePdf, getInvoice, getInvoices, markInvoicePaid, sendInvoice, updateInvoice } from '../../../api/invoices';
import type { InvoicePayload } from '../../../types';
import type { InvoicesQuery } from '../../../api/types';

export const invoicesQueryKey = ['invoices'] as const;

export const useInvoices = (filters?: InvoicesQuery) => {
  return useQuery({
    queryKey: [...invoicesQueryKey, filters],
    queryFn: () => getInvoices(filters),
  });
};

export const useInvoice = (id?: string) => {
  return useQuery({
    queryKey: [...invoicesQueryKey, id],
    queryFn: () => getInvoice(id as string),
    enabled: Boolean(id),
  });
};

export const useUpdateInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<InvoicePayload> }) => updateInvoice(id, payload),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: invoicesQueryKey });
      void queryClient.invalidateQueries({ queryKey: [...invoicesQueryKey, variables.id] });
    },
  });
};

export const useMarkInvoicePaid = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markInvoicePaid(id, { paid: true }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: invoicesQueryKey });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useSendInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sendInvoice(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: invoicesQueryKey });
    },
  });
};

export const useDownloadInvoicePdf = () => {
  return useMutation({
    mutationFn: (id: string) => downloadInvoicePdf(id),
  });
};

