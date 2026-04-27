import { apiClient } from './client';
import type { Lead, EmailTemplate, EmailCampaign } from '../types';

// ── Leads ──────────────────────────────────────────────────────────────────────

export interface LeadPayload {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  source?: Lead['source'];
  status?: Lead['status'];
  notes?: string;
  assignedToUserId?: string;
}

export const salesGetLeads = async (): Promise<Lead[]> => {
  const { data } = await apiClient.get<Lead[]>('/admin/sales/leads');
  return data;
};

export const salesCreateLead = async (payload: LeadPayload): Promise<Lead> => {
  const { data } = await apiClient.post<Lead>('/admin/sales/leads', payload);
  return data;
};

export const salesUpdateLead = async (id: string, payload: Partial<LeadPayload>): Promise<Lead> => {
  const { data } = await apiClient.put<Lead>(`/admin/sales/leads/${id}`, payload);
  return data;
};

export const salesDeleteLead = async (id: string): Promise<void> => {
  await apiClient.delete(`/admin/sales/leads/${id}`);
};

// ── Email templates ────────────────────────────────────────────────────────────

export interface EmailTemplatePayload {
  name: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
}

export const salesGetEmailTemplates = async (): Promise<EmailTemplate[]> => {
  const { data } = await apiClient.get<EmailTemplate[]>('/admin/sales/email-templates');
  return data;
};

export const salesCreateEmailTemplate = async (payload: EmailTemplatePayload): Promise<EmailTemplate> => {
  const { data } = await apiClient.post<EmailTemplate>('/admin/sales/email-templates', payload);
  return data;
};

export const salesUpdateEmailTemplate = async (
  id: string,
  payload: Partial<EmailTemplatePayload>,
): Promise<EmailTemplate> => {
  const { data } = await apiClient.put<EmailTemplate>(`/admin/sales/email-templates/${id}`, payload);
  return data;
};

export const salesDeleteEmailTemplate = async (id: string): Promise<void> => {
  await apiClient.delete(`/admin/sales/email-templates/${id}`);
};

// ── Email campaigns ────────────────────────────────────────────────────────────

export interface CampaignPayload {
  name: string;
  templateId?: string;
  subject: string;
  recipients: string[];
}

export interface SendCampaignPayload {
  bodyHtml?: string;
  bodyText?: string;
}

export const salesGetCampaigns = async (): Promise<EmailCampaign[]> => {
  const { data } = await apiClient.get<EmailCampaign[]>('/admin/sales/campaigns');
  return data;
};

export const salesCreateCampaign = async (payload: CampaignPayload): Promise<EmailCampaign> => {
  const { data } = await apiClient.post<EmailCampaign>('/admin/sales/campaigns', payload);
  return data;
};

export const salesSendCampaign = async (
  id: string,
  payload?: SendCampaignPayload,
): Promise<EmailCampaign & { sent: number; failed: number }> => {
  const { data } = await apiClient.post<EmailCampaign & { sent: number; failed: number }>(
    `/admin/sales/campaigns/${id}/send`,
    payload ?? {},
  );
  return data;
};
