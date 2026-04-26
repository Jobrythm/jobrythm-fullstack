import { apiClient } from './client';
import type { DashboardStats } from '../types';
import type { BillingRedirectResponse, DashboardResponse } from './types';

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const { data } = await apiClient.get<DashboardResponse | DashboardStats>('/dashboard');
  const maybeStats = data as Partial<DashboardStats>;
  if (typeof maybeStats.activeJobs === 'number' && typeof maybeStats.quotesThisMonth === 'number') {
    return maybeStats as DashboardStats;
  }
  if ('data' in (data as DashboardResponse) || 'widgets' in (data as DashboardResponse)) {
    const wrapped = data as DashboardResponse;
    return {
      activeJobs: wrapped.data?.activeJobs ?? wrapped.widgets?.activeJobs ?? 0,
      quotesThisMonth: wrapped.data?.quotesThisMonth ?? wrapped.widgets?.quotesThisMonth ?? 0,
      revenueThisMonth: wrapped.data?.revenueThisMonth ?? wrapped.widgets?.revenueThisMonth ?? 0,
      outstandingInvoices: wrapped.data?.outstandingInvoices ?? wrapped.widgets?.outstandingInvoices ?? 0,
      recentJobs: wrapped.data?.recentJobs ?? wrapped.widgets?.recentJobs ?? [],
      recentActivity: wrapped.data?.recentActivity ?? wrapped.widgets?.recentActivity ?? [],
    };
  }
  return {
    activeJobs: 0,
    quotesThisMonth: 0,
    revenueThisMonth: 0,
    outstandingInvoices: 0,
    recentJobs: [],
    recentActivity: [],
  };
};

export const createCheckoutSession = async (): Promise<BillingRedirectResponse> => {
  const { data } = await apiClient.post<BillingRedirectResponse>('/billing/checkout');
  return data;
};

export const createBillingPortalSession = async (): Promise<BillingRedirectResponse> => {
  const { data } = await apiClient.post<BillingRedirectResponse>('/billing/portal');
  return data;
};

