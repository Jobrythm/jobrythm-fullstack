import axios from 'axios';
import { resolveApiBaseUrl } from './hosts';

// Unauthenticated client for public portal endpoints
export const publicClient = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 10000,
});

export interface PublicLineItem {
  id: string;
  description: string;
  category: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  totalPrice: number;
}

export interface PublicContractor {
  companyName?: string;
  companyAddress?: string;
  logoUrl?: string;
}

export interface PublicQuote {
  id: string;
  quoteNumber: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  validUntil: string;
  notes?: string;
  terms?: string;
  totalNet: number;
  vatRate: number;
  vatAmount: number;
  totalGross: number;
  createdAt: string;
  job: { title: string; client: { name: string } | null; lineItems: PublicLineItem[] };
  contractor: PublicContractor;
}

export interface PublicInvoice {
  id: string;
  invoiceNumber: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  dueDate: string;
  notes?: string;
  terms?: string;
  totalNet: number;
  vatRate: number;
  vatAmount: number;
  totalGross: number;
  paidAt?: string;
  createdAt: string;
  job: { title: string; client: { name: string } | null; lineItems: PublicLineItem[] };
  contractor: PublicContractor;
}

export const getPublicQuote = async (token: string): Promise<PublicQuote> => {
  const { data } = await publicClient.get<PublicQuote>(`/public/quotes/${token}`);
  return data;
};

export const approvePublicQuote = async (token: string): Promise<{ message: string; status: string }> => {
  const { data } = await publicClient.post(`/public/quotes/${token}/approve`);
  return data;
};

export const rejectPublicQuote = async (token: string): Promise<{ message: string; status: string }> => {
  const { data } = await publicClient.post(`/public/quotes/${token}/reject`);
  return data;
};

export const getPublicConfig = async (): Promise<{ stripePublishableKey: string | null }> => {
  const { data } = await publicClient.get<{ stripePublishableKey: string | null }>('/public/config');
  return data;
};

export const getPublicInvoice = async (token: string): Promise<PublicInvoice> => {
  const { data } = await publicClient.get<PublicInvoice>(`/public/invoices/${token}`);
  return data;
};

export const createInvoicePaymentIntent = async (token: string): Promise<{ clientSecret: string }> => {
  const { data } = await publicClient.post<{ clientSecret: string }>(`/public/invoices/${token}/pay`);
  return data;
};
