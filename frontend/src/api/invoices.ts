import { apiClient } from './client';
import { downloadBlob } from './client';
import type { Invoice, InvoicePayload } from '../types';
import type { ApiListResponse, InvoicesQuery, MarkInvoicePaidRequest, SendDocumentResponse } from './types';

export const getInvoices = async (filters?: InvoicesQuery): Promise<ApiListResponse<Invoice>> => {
  const { data } = await apiClient.get<ApiListResponse<Invoice>>('/invoices', { params: filters });
  return data;
};

export const getInvoice = async (id: string): Promise<Invoice> => {
  const { data } = await apiClient.get<Invoice>(`/invoices/${id}`);
  return data;
};

export const createInvoice = async (jobId: string, payload: InvoicePayload): Promise<Invoice> => {
  const { data } = await apiClient.post<Invoice>(`/jobs/${jobId}/invoices`, payload);
  return data;
};

export const updateInvoice = async (id: string, payload: Partial<InvoicePayload>): Promise<Invoice> => {
  const { data } = await apiClient.put<Invoice>(`/invoices/${id}`, payload);
  return data;
};

export const markInvoicePaid = async (id: string, payload: MarkInvoicePaidRequest): Promise<Invoice> => {
  const { data } = await apiClient.patch<Invoice>(`/invoices/${id}/paid`, payload);
  return data;
};

export const downloadInvoicePdf = async (id: string): Promise<Blob> => {
  return downloadBlob({ url: `/invoices/${id}/pdf`, method: 'GET' });
};

export const sendInvoice = async (id: string): Promise<SendDocumentResponse> => {
  const { data } = await apiClient.post<SendDocumentResponse>(`/invoices/${id}/send`);
  return data;
};

