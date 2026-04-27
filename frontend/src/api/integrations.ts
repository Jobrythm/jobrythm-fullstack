import { apiClient } from './client';

export interface IntegrationStatus {
  connected: boolean;
  realmId?: string | null;
  tenantId?: string | null;
  lastSyncAt?: string | null;
}

export interface IntegrationsStatusResponse {
  quickbooks: IntegrationStatus;
  xero: IntegrationStatus;
}

export async function getIntegrationsStatus(): Promise<IntegrationsStatusResponse> {
  const { data } = await apiClient.get<IntegrationsStatusResponse>('/integrations/status');
  return data;
}

export async function getQBConnectUrl(): Promise<{ url: string }> {
  const { data } = await apiClient.get<{ url: string }>('/integrations/quickbooks/connect');
  return data;
}

export async function disconnectQB(): Promise<void> {
  await apiClient.delete('/integrations/quickbooks/disconnect');
}

export async function syncQBClients(): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>('/integrations/quickbooks/sync-clients');
  return data;
}

export async function syncQBInvoices(): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>('/integrations/quickbooks/sync-invoices');
  return data;
}

export async function getXeroConnectUrl(): Promise<{ url: string }> {
  const { data } = await apiClient.get<{ url: string }>('/integrations/xero/connect');
  return data;
}

export async function disconnectXero(): Promise<void> {
  await apiClient.delete('/integrations/xero/disconnect');
}

export async function syncXeroClients(): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>('/integrations/xero/sync-clients');
  return data;
}

export async function syncXeroInvoices(): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>('/integrations/xero/sync-invoices');
  return data;
}
