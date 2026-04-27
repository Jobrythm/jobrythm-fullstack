import { apiClient } from './client';

export interface Expense {
  id: string;
  companyId: string;
  jobId?: string;
  description: string;
  amountCents: number;
  category: string;
  date: string;
  isBillable: boolean;
  notes?: string;
  receiptFileName?: string;
  createdAt: string;
  updatedAt: string;
  job?: { id: string; title: string };
}

export interface ExpensePayload {
  jobId?: string;
  description: string;
  amountCents: number;
  category: string;
  date: string;
  isBillable?: boolean;
  notes?: string;
}

export interface ExpenseSummary {
  byCategory: { category: string; total: string; count: string }[];
  billableTotal: string;
  nonBillableTotal: string;
  grandTotal: string;
}

export const getExpenses = async (params?: {
  jobId?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
}): Promise<Expense[]> => {
  const { data } = await apiClient.get<Expense[]>('/expenses', { params });
  return data;
};

export const getExpenseSummary = async (): Promise<ExpenseSummary> => {
  const { data } = await apiClient.get<ExpenseSummary>('/expenses/summary');
  return data;
};

export const createExpense = async (payload: ExpensePayload): Promise<Expense> => {
  const { data } = await apiClient.post<Expense>('/expenses', payload);
  return data;
};

export const updateExpense = async (id: string, payload: Partial<ExpensePayload>): Promise<Expense> => {
  const { data } = await apiClient.put<Expense>(`/expenses/${id}`, payload);
  return data;
};

export const deleteExpense = async (id: string): Promise<void> => {
  await apiClient.delete(`/expenses/${id}`);
};
