import { apiClient } from './client';

export interface OverviewReport {
  labels: string[];
  revenue: number[];
  jobsCompleted: number[];
  expenses: number[];
  hoursWorked: number[];
}

export interface JobsByStatus {
  status: string;
  count: number;
}

export interface TopClient {
  clientId: string;
  clientName: string;
  totalRevenue: number;
  invoiceCount: number;
}

export interface ExpenseByCategory {
  category: string;
  total: number;
}

export const fetchOverview = (months = 6) =>
  apiClient.get<OverviewReport>(`/reports/overview?months=${months}`).then((r) => r.data);

export const fetchJobsByStatus = () =>
  apiClient.get<JobsByStatus[]>('/reports/jobs-by-status').then((r) => r.data);

export const fetchTopClients = (limit = 10) =>
  apiClient.get<TopClient[]>(`/reports/top-clients?limit=${limit}`).then((r) => r.data);

export const fetchExpensesByCategory = () =>
  apiClient.get<ExpenseByCategory[]>('/reports/expenses-by-category').then((r) => r.data);
