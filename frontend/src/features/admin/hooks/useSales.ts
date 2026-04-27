import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  salesGetLeads,
  salesCreateLead,
  salesUpdateLead,
  salesDeleteLead,
  salesGetEmailTemplates,
  salesCreateEmailTemplate,
  salesUpdateEmailTemplate,
  salesDeleteEmailTemplate,
  salesGetCampaigns,
  salesCreateCampaign,
  salesSendCampaign,
} from '../../../api/sales';
import type { LeadPayload, EmailTemplatePayload, CampaignPayload, SendCampaignPayload } from '../../../api/sales';

export const salesLeadsQueryKey    = ['admin', 'sales', 'leads']    as const;
export const salesTemplatesQueryKey = ['admin', 'sales', 'templates'] as const;
export const salesCampaignsQueryKey = ['admin', 'sales', 'campaigns'] as const;

// ── Leads ──────────────────────────────────────────────────────────────────────

export const useSalesLeads = () =>
  useQuery({ queryKey: salesLeadsQueryKey, queryFn: salesGetLeads });

export const useCreateLead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: LeadPayload) => salesCreateLead(payload),
    onSuccess: () => void qc.invalidateQueries({ queryKey: salesLeadsQueryKey }),
  });
};

export const useUpdateLead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<LeadPayload> }) =>
      salesUpdateLead(id, payload),
    onSuccess: () => void qc.invalidateQueries({ queryKey: salesLeadsQueryKey }),
  });
};

export const useDeleteLead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => salesDeleteLead(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: salesLeadsQueryKey }),
  });
};

// ── Email templates ────────────────────────────────────────────────────────────

export const useSalesEmailTemplates = () =>
  useQuery({ queryKey: salesTemplatesQueryKey, queryFn: salesGetEmailTemplates });

export const useCreateEmailTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: EmailTemplatePayload) => salesCreateEmailTemplate(payload),
    onSuccess: () => void qc.invalidateQueries({ queryKey: salesTemplatesQueryKey }),
  });
};

export const useUpdateEmailTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<EmailTemplatePayload> }) =>
      salesUpdateEmailTemplate(id, payload),
    onSuccess: () => void qc.invalidateQueries({ queryKey: salesTemplatesQueryKey }),
  });
};

export const useDeleteEmailTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => salesDeleteEmailTemplate(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: salesTemplatesQueryKey }),
  });
};

// ── Email campaigns ────────────────────────────────────────────────────────────

export const useSalesCampaigns = () =>
  useQuery({ queryKey: salesCampaignsQueryKey, queryFn: salesGetCampaigns });

export const useCreateCampaign = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CampaignPayload) => salesCreateCampaign(payload),
    onSuccess: () => void qc.invalidateQueries({ queryKey: salesCampaignsQueryKey }),
  });
};

export const useSendCampaign = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload?: SendCampaignPayload }) =>
      salesSendCampaign(id, payload),
    onSuccess: () => void qc.invalidateQueries({ queryKey: salesCampaignsQueryKey }),
  });
};
