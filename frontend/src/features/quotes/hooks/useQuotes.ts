import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { downloadQuotePdf, getQuote, getQuotes, sendQuote, updateQuote } from '../../../api/quotes';
import type { QuotePayload } from '../../../types';
import type { QuotesQuery } from '../../../api/types';

export const quotesQueryKey = ['quotes'] as const;

export const useQuotes = (filters?: QuotesQuery) => {
  return useQuery({
    queryKey: [...quotesQueryKey, filters],
    queryFn: () => getQuotes(filters),
  });
};

export const useQuote = (id?: string) => {
  return useQuery({
    queryKey: [...quotesQueryKey, id],
    queryFn: () => getQuote(id as string),
    enabled: Boolean(id),
  });
};

export const useUpdateQuote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<QuotePayload> }) => updateQuote(id, payload),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: quotesQueryKey });
      void queryClient.invalidateQueries({ queryKey: [...quotesQueryKey, variables.id] });
    },
  });
};

export const useSendQuote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sendQuote(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: quotesQueryKey });
    },
  });
};

export const useDownloadQuotePdf = () => {
  return useMutation({
    mutationFn: (id: string) => downloadQuotePdf(id),
  });
};

