export interface User {
  id: string;
  email: string;
  name: string;
  companyName?: string;
  logoUrl?: string;
  plan: 'starter' | 'pro' | 'team' | 'admin';
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  createdAt: string;
}

export type JobStatus = 'draft' | 'quoted' | 'active' | 'completed' | 'invoiced';

export type LineItemCategory = 'labour' | 'materials' | 'equipment' | 'subcontractor' | 'other';

export interface LineItem {
  id: string;
  jobId: string;
  description: string;
  category: LineItemCategory;
  quantity: number;
  unit: string;
  unitCost: number;
  unitPrice: number;
  totalCost: number;
  totalPrice: number;
}

export interface Job {
  id: string;
  title: string;
  description?: string;
  clientId: string;
  client?: Client;
  status: JobStatus;
  startDate?: string;
  endDate?: string;
  lineItems: LineItem[];
  totalCost: number;
  totalRevenue: number;
  marginPercent: number;
  createdAt: string;
  updatedAt: string;
}

export interface Quote {
  id: string;
  jobId: string;
  job?: Job;
  quoteNumber: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  validUntil: string;
  notes?: string;
  terms?: string;
  totalNet: number;
  vatRate: number;
  vatAmount: number;
  totalGross: number;
  sentAt?: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  jobId: string;
  job?: Job;
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
  sentAt?: string;
  createdAt: string;
}

export interface ActivityItem {
  id: string;
  type: 'job_created' | 'quote_sent' | 'invoice_paid' | 'job_completed';
  description: string;
  createdAt: string;
}

export interface DashboardStats {
  activeJobs: number;
  quotesThisMonth: number;
  revenueThisMonth: number;
  outstandingInvoices: number;
  recentJobs: Job[];
  recentActivity: ActivityItem[];
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  companyName?: string;
  email: string;
  password: string;
}

export interface JobFilters {
  status?: JobStatus | 'all';
  search?: string;
}

export interface QuoteFilters {
  status?: Quote['status'] | 'all';
}

export interface InvoiceFilters {
  status?: Invoice['status'] | 'all';
}

export interface JobPayload {
  title: string;
  description?: string;
  clientId: string;
  status?: JobStatus;
  startDate?: string;
  endDate?: string;
}

export interface LineItemPayload {
  description: string;
  category: LineItemCategory;
  quantity: number;
  unit: string;
  unitCost: number;
  unitPrice: number;
}

export interface ClientPayload {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface QuotePayload {
  status?: Quote['status'];
  validUntil: string;
  notes?: string;
  terms?: string;
  vatRate: number;
}

export interface InvoicePayload {
  status?: Invoice['status'];
  dueDate: string;
  notes?: string;
  terms?: string;
  vatRate: number;
}

