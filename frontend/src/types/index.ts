export interface User {
  id: string;
  email: string;
  name: string;
  companyName?: string;
  companyAddress?: string;
  logoUrl?: string;
  defaultVatRate?: number;
  defaultPaymentTerms?: string;
  defaultQuoteValidityDays?: number;
  plan: 'starter' | 'professional' | 'business' | 'admin';
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionEndsAt?: string;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  companyName: string | null;
  plan: 'starter' | 'professional' | 'business' | 'admin';
  createdAt: string;
}

export type AdminUserPlan = AdminUser['plan'];

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
  quote?: Quote | null;
  invoice?: Invoice | null;
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

export interface AdminStats {
  totalCustomers: number;
  newCustomersLast30d: number;
  planBreakdown: Record<string, number>;
  totalJobs: number;
  activeJobs: number;
  quotesLast30d: number;
  totalPaidInvoices: number;
  totalRevenueCents: number;
  revenueLast30dCents: number;
}

export interface AppSettings {
  stripeApiKey: string;
  stripeApiKeySet: boolean;
  stripePublishableKey: string;
  stripeWebhookSecret: string;
  stripeWebhookSecretSet: boolean;
  stripePortalConfigurationId: string;
  stripeStarterMonthlyPriceId: string;
  stripeStarterAnnualPriceId: string;
  stripeProfessionalMonthlyPriceId: string;
  stripeProfessionalAnnualPriceId: string;
  stripeBusinessMonthlyPriceId: string;
  stripeBusinessAnnualPriceId: string;
  appUrl: string;
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPassword: string;
  smtpPasswordSet: boolean;
  smtpFromEmail: string;
  smtpFromName: string;
  emailConfigured: boolean;
  githubModelsToken: string;
  githubModelsTokenSet: boolean;
  githubModelsModel: string;
  aiConfigured: boolean;
}

export interface BillingStatus {
  configured: boolean;
  starterMonthly: boolean;
  starterAnnual: boolean;
  professionalMonthly: boolean;
  professionalAnnual: boolean;
  businessMonthly: boolean;
  businessAnnual: boolean;
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

// ── Sales Platform ─────────────────────────────────────────────────────────────

export type LeadStatus = 'lead' | 'trial' | 'customer' | 'lost';
export type LeadSource = 'organic' | 'referral' | 'paid' | 'direct' | 'other';

export interface Lead {
  id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  source: LeadSource;
  status: LeadStatus;
  notes?: string;
  assignedToUserId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  createdAt: string;
  updatedAt: string;
}

export type CampaignStatus = 'draft' | 'sent';

export interface EmailCampaign {
  id: string;
  name: string;
  templateId?: string | null;
  subject: string;
  recipients: string[];
  status: CampaignStatus;
  sentAt?: string | null;
  recipientCount: number;
  createdAt: string;
  updatedAt: string;
}

// ── Advertising Platform ───────────────────────────────────────────────────────

export type AdPlatform = 'google_ads' | 'meta' | 'youtube';
export type AdCampaignStatus = 'active' | 'paused' | 'completed';
export type AdCreativeType = 'image' | 'video' | 'text';

export interface AdPlatformConnectionInfo {
  id: string;
  platform: AdPlatform;
  accountId?: string | null;
  accountName?: string | null;
  tokenExpiresAt?: string | null;
  createdAt: string;
}

export interface AdPlatformStatus {
  platform: AdPlatform;
  connected: boolean;
  credentialsConfigured: boolean;
  connection: AdPlatformConnectionInfo | null;
}

export interface AdConnectionsResponse {
  platforms: AdPlatformStatus[];
}

export interface AdCampaign {
  id: string;
  platform: AdPlatform;
  platformCampaignId?: string;
  name: string;
  status: AdCampaignStatus;
  budgetCents: number;
  startDate?: string;
  endDate?: string;
  impressions: number;
  clicks: number;
  spendCents: number;
  lastSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdCreative {
  id: string;
  platform: AdPlatform;
  type: AdCreativeType;
  title: string;
  body?: string;
  mediaUrl?: string;
  platformCreativeId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdPlatformSettings {
  googleClientId: string;
  googleClientIdSet: boolean;
  googleClientSecretSet: boolean;
  googleDeveloperTokenSet: boolean;
  metaAppId: string;
  metaAppIdSet: boolean;
  metaAppSecretSet: boolean;
}


