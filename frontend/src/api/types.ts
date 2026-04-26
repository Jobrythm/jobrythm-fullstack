import type {
  Client,
  ClientPayload,
  DashboardStats,
  Invoice,
  InvoicePayload,
  Job,
  JobPayload,
  LineItem,
  LineItemPayload,
  Quote,
  QuotePayload,
  User,
} from '../types';

export type Nullable<T> = T | null;

export type ApiListResponse<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};

export type ApiListQuery = {
  page?: number;
  pageSize?: number;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  userId: string;
  email: string;
  fullName: string;
};

export type AuthResponse = {
  user: User;
  session: AuthSession;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  name: string;
  companyName?: string;
  email: string;
  password: string;
};

export type RefreshRequest = {
  userId: string;
  refreshToken: string;
};

export type LogoutRequest = {
  refreshToken: string;
};

export type PaginationQuery = {
  page?: number;
  pageSize?: number;
};

export type SearchQuery = PaginationQuery & {
  search?: string;
};

export type ClientsQuery = SearchQuery;

export type JobsQuery = SearchQuery & {
  status?: Job['status'];
  clientId?: string;
};

export type QuotesQuery = PaginationQuery & {
  jobId?: string;
  status?: Quote['status'];
};

export type InvoicesQuery = PaginationQuery & {
  jobId?: string;
  status?: Invoice['status'];
};

export type UpdateJobStatusRequest = {
  status: Job['status'];
};

export type MarkInvoicePaidRequest = {
  paid: boolean;
};

export type SendDocumentResponse = {
  success: boolean;
  message?: string;
};

export type BillingRedirectResponse = {
  url: string;
};

export type UpdateUserProfileRequest = {
  name?: Nullable<string>;
  companyName?: Nullable<string>;
  email?: Nullable<string>;
  address?: Nullable<string>;
  defaultVatRate?: Nullable<number>;
  defaultPaymentTerms?: Nullable<string>;
  defaultQuoteValidityDays?: Nullable<number>;
  currentPassword?: Nullable<string>;
  newPassword?: Nullable<string>;
};

export type LogoutResponse = {
  success: boolean;
};

export type PartialDashboardData = {
  activeJobs?: number;
  quotesThisMonth?: number;
  revenueThisMonth?: number;
  outstandingInvoices?: number;
  recentJobs?: Job[];
  recentActivity?: DashboardStats['recentActivity'];
};

export type DashboardResponse = {
  data?: PartialDashboardData;
  widgets?: PartialDashboardData;
};

export type { Client, ClientPayload, DashboardStats, Invoice, InvoicePayload, Job, JobPayload, LineItem, LineItemPayload, Quote, QuotePayload, User };
