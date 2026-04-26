import { apiClient } from './client';
import { downloadBlob } from './client';
import type { Quote, QuotePayload } from '../types';
import type { ApiListResponse, QuotesQuery, SendDocumentResponse } from './types';

export const getQuotes = async (filters?: QuotesQuery): Promise<ApiListResponse<Quote>> => {
  const { data } = await apiClient.get<ApiListResponse<Quote>>('/quotes', { params: filters });
  return data;
};

export const getQuote = async (id: string): Promise<Quote> => {
  const { data } = await apiClient.get<Quote>(`/quotes/${id}`);
  return data;
};

export const createQuote = async (jobId: string, payload: QuotePayload): Promise<Quote> => {
  const { data } = await apiClient.post<Quote>(`/jobs/${jobId}/quotes`, payload);
  return data;
};

export const updateQuote = async (id: string, payload: Partial<QuotePayload>): Promise<Quote> => {
  const { data } = await apiClient.put<Quote>(`/quotes/${id}`, payload);
  return data;
};

export const downloadQuotePdf = async (id: string): Promise<Blob> => {
  return downloadBlob({ url: `/quotes/${id}/pdf`, method: 'GET' });
};

export const sendQuote = async (id: string): Promise<SendDocumentResponse> => {
  const { data } = await apiClient.post<SendDocumentResponse>(`/quotes/${id}/send`);
  return data;
};

