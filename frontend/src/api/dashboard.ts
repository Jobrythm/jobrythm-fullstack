import { apiClient } from './client';
import type { BillingStatus, DashboardStats } from '../types';
import type { BillingRedirectResponse, DashboardResponse } from './types';

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const { data } = await apiClient.get<DashboardResponse | DashboardStats>('/dashboard');
  const maybeStats = data as Partial<DashboardStats>;
  if (typeof maybeStats.activeJobs === 'number' && typeof maybeStats.quotesThisMonth === 'number') {
    return {
      activeJobs: maybeStats.activeJobs,
      quotesThisMonth: maybeStats.quotesThisMonth,
      revenueThisMonth: maybeStats.revenueThisMonth ?? 0,
      outstandingInvoices: maybeStats.outstandingInvoices ?? 0,
      recentJobs: maybeStats.recentJobs ?? [],
      recentActivity: maybeStats.recentActivity ?? [],
    };
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

export const getBillingStatus = async (): Promise<BillingStatus> => {
  const { data } = await apiClient.get<BillingStatus>('/billing/status');
  return data;
};

export const createCheckoutSession = async (planTier: 'pro' | 'team' = 'pro'): Promise<BillingRedirectResponse> => {
  const { data } = await apiClient.post<BillingRedirectResponse>('/billing/checkout', { planTier });
  return data;
};

export const createBillingPortalSession = async (): Promise<BillingRedirectResponse> => {
  const { data } = await apiClient.post<BillingRedirectResponse>('/billing/portal');
  return data;
};

