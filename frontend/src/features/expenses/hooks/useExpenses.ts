import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createExpense,
  deleteExpense,
  getExpenseSummary,
  getExpenses,
  updateExpense,
  type ExpensePayload,
} from '../../../api/expenses';

export const expenseKeys = {
  all: ['expenses'] as const,
  list: (params?: object) => ['expenses', 'list', params] as const,
  summary: () => ['expenses', 'summary'] as const,
};

export const useExpenses = (params?: { jobId?: string; category?: string; startDate?: string; endDate?: string }) =>
  useQuery({
    queryKey: expenseKeys.list(params),
    queryFn: () => getExpenses(params),
  });

export const useExpenseSummary = () =>
  useQuery({
    queryKey: expenseKeys.summary(),
    queryFn: getExpenseSummary,
  });

export const useCreateExpense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ExpensePayload) => createExpense(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: expenseKeys.all }),
  });
};

export const useUpdateExpense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ExpensePayload> }) =>
      updateExpense(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: expenseKeys.all }),
  });
};

export const useDeleteExpense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteExpense(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: expenseKeys.all }),
  });
};
