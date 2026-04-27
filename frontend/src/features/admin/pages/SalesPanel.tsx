import {
  IconBulb,
  IconCheck,
  IconEdit,
  IconMailForward,
  IconPlus,
  IconRefresh,
  IconSend,
  IconTargetArrow,
  IconTemplate,
  IconTrash,
  IconUsers,
  IconAlertCircle,
  IconLink,
  IconLinkOff,
  IconVideo,
  IconPhoto,
  IconFileText,
  IconBrandGoogle,
  IconBrandMeta,
  IconBrandYoutube,
  IconSettings,
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { TableSkeleton } from '../../../components/TableSkeleton';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { ApiErrorAlert } from '../../../components/ApiErrorAlert';
import type { Lead, EmailTemplate, AdCampaign, AdCreative, AdPlatform } from '../../../types';
import {
  useSalesLeads,
  useCreateLead,
  useUpdateLead,
  useDeleteLead,
  useSalesEmailTemplates,
  useCreateEmailTemplate,
  useUpdateEmailTemplate,
  useDeleteEmailTemplate,
  useSalesCampaigns,
  useCreateCampaign,
  useSendCampaign,
} from '../hooks/useSales';
import {
  useAdsConnections,
  useAdsDisconnect,
  useAdsCampaigns,
  useCreateAdCampaign,
  useSyncAdCampaigns,
  useAdsCreatives,
  useCreateAdCreative,
  useDeleteAdCreative,
  useAdsSettings,
  useUpdateAdsSettings,
} from '../hooks/useAds';
import { adsGetAuthUrl } from '../../../api/ads';

// ── Constants ──────────────────────────────────────────────────────────────────

const LEAD_STATUSES: Lead['status'][] = ['lead', 'trial', 'customer', 'lost'];
const LEAD_SOURCES: Lead['source'][] = ['organic', 'referral', 'paid', 'direct', 'other'];

const leadStatusBadge: Record<Lead['status'], string> = {
  lead: 'bg-blue-lt',
  trial: 'bg-yellow-lt',
  customer: 'bg-green-lt',
  lost: 'bg-red-lt',
};

const adCampaignStatusBadge: Record<AdCampaign['status'], string> = {
  active: 'bg-green-lt',
  paused: 'bg-yellow-lt',
  completed: 'bg-secondary-lt',
};

const adPlatformLabel: Record<AdPlatform, string> = {
  google_ads: 'Google Ads',
  meta: 'Meta',
  youtube: 'YouTube',
};

const fmtCurrency = (cents: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);

// ── Schemas ────────────────────────────────────────────────────────────────────

const leadSchema = z.object({
  name: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  company: z.string().optional(),
  phone: z.string().optional(),
  source: z.enum(['organic', 'referral', 'paid', 'direct', 'other']),
  status: z.enum(['lead', 'trial', 'customer', 'lost']),
  notes: z.string().optional(),
  assignedToUserId: z.string().optional(),
});

const templateSchema = z.object({
  name: z.string().min(1, 'Required'),
  subject: z.string().min(1, 'Required'),
  bodyHtml: z.string().min(1, 'Required'),
  bodyText: z.string().optional(),
});

const campaignSchema = z.object({
  name: z.string().min(1, 'Required'),
  templateId: z.string().optional(),
  subject: z.string().min(1, 'Required'),
  recipientsRaw: z.string().min(1, 'At least one recipient is required'),
  bodyHtml: z.string().optional(),
});

const adCampaignSchema = z.object({
  platform: z.enum(['google_ads', 'meta', 'youtube']),
  name: z.string().min(1, 'Required'),
  budgetDollars: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const adCreativeSchema = z.object({
  platform: z.enum(['google_ads', 'meta', 'youtube']),
  type: z.enum(['image', 'video', 'text']),
  title: z.string().min(1, 'Required'),
  body: z.string().optional(),
  mediaUrl: z.string().optional(),
});

const adsSettingsSchema = z.object({
  googleClientId: z.string().optional(),
  googleClientSecret: z.string().optional(),
  googleDeveloperToken: z.string().optional(),
  metaAppId: z.string().optional(),
  metaAppSecret: z.string().optional(),
});

type LeadValues = z.infer<typeof leadSchema>;
type TemplateValues = z.infer<typeof templateSchema>;
type CampaignValues = z.infer<typeof campaignSchema>;
type AdCampaignValues = z.infer<typeof adCampaignSchema>;
type AdCreativeValues = z.infer<typeof adCreativeSchema>;
type AdsSettingsValues = z.infer<typeof adsSettingsSchema>;

// ── Lead modal ─────────────────────────────────────────────────────────────────

const LeadModal = ({ lead, onClose }: { lead?: Lead; onClose: () => void }) => {
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const isEdit = Boolean(lead);

  const form = useForm<LeadValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: lead?.name ?? '',
      email: lead?.email ?? '',
      company: lead?.company ?? '',
      phone: lead?.phone ?? '',
      source: lead?.source ?? 'organic',
      status: lead?.status ?? 'lead',
      notes: lead?.notes ?? '',
      assignedToUserId: lead?.assignedToUserId ?? '',
    },
  });

  const onSubmit = (values: LeadValues) => {
    if (isEdit && lead) {
      updateLead.mutate(
        { id: lead.id, payload: values },
        {
          onSuccess: () => { toast.success('Lead updated'); onClose(); },
          onError: (err: Error) => toast.error(err.message),
        },
      );
    } else {
      createLead.mutate(values, {
        onSuccess: () => { toast.success('Lead created'); onClose(); },
        onError: (err: Error) => toast.error(err.message),
      });
    }
  };

  const isPending = createLead.isPending || updateLead.isPending;

  return (
    <div className="modal modal-blur fade show d-block" role="dialog" aria-modal="true">
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{isEdit ? `Edit lead — ${lead!.name}` : 'Add lead'}</h5>
            <button className="btn-close" type="button" onClick={onClose} aria-label="Close" />
          </div>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="modal-body row g-3">
              <div className="col-md-6">
                <label className="form-label">Name</label>
                <input className="form-control" {...form.register('name')} />
                {form.formState.errors.name && <div className="invalid-feedback d-block">{form.formState.errors.name.message}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label">Email</label>
                <input type="email" className="form-control" {...form.register('email')} />
                {form.formState.errors.email && <div className="invalid-feedback d-block">{form.formState.errors.email.message}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label">Company <span className="text-secondary">(optional)</span></label>
                <input className="form-control" {...form.register('company')} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Phone <span className="text-secondary">(optional)</span></label>
                <input className="form-control" {...form.register('phone')} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Source</label>
                <select className="form-select" {...form.register('source')}>
                  {LEAD_SOURCES.map((s) => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Status</label>
                <select className="form-select" {...form.register('status')}>
                  {LEAD_STATUSES.map((s) => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="col-12">
                <label className="form-label">Notes <span className="text-secondary">(optional)</span></label>
                <textarea className="form-control" rows={3} {...form.register('notes')} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-link link-secondary me-auto" type="button" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" type="submit" disabled={isPending}>
                {isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Add lead'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// ── Email template modal ───────────────────────────────────────────────────────

const TemplateModal = ({ template, onClose }: { template?: EmailTemplate; onClose: () => void }) => {
  const createTemplate = useCreateEmailTemplate();
  const updateTemplate = useUpdateEmailTemplate();
  const isEdit = Boolean(template);

  const form = useForm<TemplateValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: template?.name ?? '',
      subject: template?.subject ?? '',
      bodyHtml: template?.bodyHtml ?? '',
      bodyText: template?.bodyText ?? '',
    },
  });

  const onSubmit = (values: TemplateValues) => {
    if (isEdit && template) {
      updateTemplate.mutate(
        { id: template.id, payload: values },
        {
          onSuccess: () => { toast.success('Template updated'); onClose(); },
          onError: (err: Error) => toast.error(err.message),
        },
      );
    } else {
      createTemplate.mutate(values, {
        onSuccess: () => { toast.success('Template created'); onClose(); },
        onError: (err: Error) => toast.error(err.message),
      });
    }
  };

  const isPending = createTemplate.isPending || updateTemplate.isPending;

  return (
    <div className="modal modal-blur fade show d-block" role="dialog" aria-modal="true">
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{isEdit ? `Edit template — ${template!.name}` : 'New template'}</h5>
            <button className="btn-close" type="button" onClick={onClose} aria-label="Close" />
          </div>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="modal-body row g-3">
              <div className="col-md-6">
                <label className="form-label">Template name</label>
                <input className="form-control" placeholder="e.g. Welcome email" {...form.register('name')} />
                {form.formState.errors.name && <div className="invalid-feedback d-block">{form.formState.errors.name.message}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label">Subject line</label>
                <input className="form-control" placeholder="e.g. Welcome to Jobrythm 👋" {...form.register('subject')} />
                {form.formState.errors.subject && <div className="invalid-feedback d-block">{form.formState.errors.subject.message}</div>}
              </div>
              <div className="col-12">
                <label className="form-label">HTML body</label>
                <textarea
                  className="form-control font-monospace"
                  rows={10}
                  placeholder="<p>Hi {{name}},</p><p>...</p>"
                  {...form.register('bodyHtml')}
                />
                {form.formState.errors.bodyHtml && <div className="invalid-feedback d-block">{form.formState.errors.bodyHtml.message}</div>}
              </div>
              <div className="col-12">
                <label className="form-label">Plain text body <span className="text-secondary">(optional fallback)</span></label>
                <textarea className="form-control" rows={4} {...form.register('bodyText')} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-link link-secondary me-auto" type="button" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" type="submit" disabled={isPending}>
                {isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Create template'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// ── Campaign compose modal ─────────────────────────────────────────────────────

const CampaignModal = ({
  templates,
  onClose,
}: {
  templates: EmailTemplate[];
  onClose: () => void;
}) => {
  const createCampaign = useCreateCampaign();
  const sendCampaign = useSendCampaign();

  const form = useForm<CampaignValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: { name: '', templateId: '', subject: '', recipientsRaw: '', bodyHtml: '' },
  });

  const selectedTemplateId = form.watch('templateId');
  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  useEffect(() => {
    if (selectedTemplate) {
      form.setValue('subject', selectedTemplate.subject);
      form.setValue('bodyHtml', selectedTemplate.bodyHtml);
    }
  }, [selectedTemplate, form]);

  const onSubmit = async (values: CampaignValues) => {
    const recipients = values.recipientsRaw
      .split(/[\n,;]+/)
      .map((e) => e.trim())
      .filter((e) => e.includes('@'));

    if (recipients.length === 0) {
      form.setError('recipientsRaw', { message: 'No valid email addresses found' });
      return;
    }

    createCampaign.mutate(
      {
        name: values.name,
        templateId: values.templateId || undefined,
        subject: values.subject,
        recipients,
      },
      {
        onSuccess: (campaign) => {
          sendCampaign.mutate(
            {
              id: campaign.id,
              payload: values.bodyHtml ? { bodyHtml: values.bodyHtml } : undefined,
            },
            {
              onSuccess: (result) => {
                toast.success(`Campaign sent to ${result.sent} recipient${result.sent !== 1 ? 's' : ''}${result.failed ? ` (${result.failed} failed)` : ''}`);
                onClose();
              },
              onError: (err: Error) => toast.error(err.message),
            },
          );
        },
        onError: (err: Error) => toast.error(err.message),
      },
    );
  };

  const isPending = createCampaign.isPending || sendCampaign.isPending;

  return (
    <div className="modal modal-blur fade show d-block" role="dialog" aria-modal="true">
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <IconSend size={18} className="me-2" />
              New campaign
            </h5>
            <button className="btn-close" type="button" onClick={onClose} aria-label="Close" />
          </div>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="modal-body row g-3">
              <div className="col-md-6">
                <label className="form-label">Campaign name</label>
                <input className="form-control" placeholder="e.g. May outreach" {...form.register('name')} />
                {form.formState.errors.name && <div className="invalid-feedback d-block">{form.formState.errors.name.message}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label">Template <span className="text-secondary">(optional)</span></label>
                <select className="form-select" {...form.register('templateId')}>
                  <option value="">— No template, write below —</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-12">
                <label className="form-label">Subject line</label>
                <input className="form-control" {...form.register('subject')} />
                {form.formState.errors.subject && <div className="invalid-feedback d-block">{form.formState.errors.subject.message}</div>}
              </div>
              <div className="col-12">
                <label className="form-label">Recipients</label>
                <textarea
                  className="form-control"
                  rows={4}
                  placeholder="One email per line, or comma-separated"
                  {...form.register('recipientsRaw')}
                />
                {form.formState.errors.recipientsRaw && <div className="invalid-feedback d-block">{form.formState.errors.recipientsRaw.message}</div>}
                <div className="form-hint">Separate addresses with newlines, commas, or semicolons.</div>
              </div>
              {!selectedTemplate && (
                <div className="col-12">
                  <label className="form-label">HTML body</label>
                  <textarea className="form-control font-monospace" rows={8} {...form.register('bodyHtml')} />
                </div>
              )}
              {selectedTemplate && (
                <div className="col-12">
                  <div className="alert alert-info py-2 mb-0 small">
                    <IconCheck size={14} className="me-1" />
                    Using body from template <strong>{selectedTemplate.name}</strong>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-link link-secondary me-auto" type="button" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" type="submit" disabled={isPending}>
                {isPending ? 'Sending…' : 'Send campaign'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// ── Ad campaign modal ──────────────────────────────────────────────────────────

const AdCampaignModal = ({
  connectedPlatforms,
  onClose,
}: {
  connectedPlatforms: AdPlatform[];
  onClose: () => void;
}) => {
  const createCampaign = useCreateAdCampaign();
  const form = useForm<AdCampaignValues>({
    resolver: zodResolver(adCampaignSchema),
    defaultValues: { platform: 'google_ads', name: '', budgetDollars: '', startDate: '', endDate: '' },
  });

  const onSubmit = (values: AdCampaignValues) => {
    createCampaign.mutate(
      {
        platform: values.platform,
        name: values.name,
        budgetCents: values.budgetDollars ? Math.round(parseFloat(values.budgetDollars) * 100) : 0,
        startDate: values.startDate || undefined,
        endDate: values.endDate || undefined,
      },
      {
        onSuccess: () => { toast.success('Campaign created'); onClose(); },
        onError: (err: Error) => toast.error(err.message),
      },
    );
  };

  return (
    <div className="modal modal-blur fade show d-block" role="dialog" aria-modal="true">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">New ad campaign</h5>
            <button className="btn-close" type="button" onClick={onClose} aria-label="Close" />
          </div>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="modal-body row g-3">
              <div className="col-md-6">
                <label className="form-label">Platform</label>
                <select className="form-select" {...form.register('platform')}>
                  {connectedPlatforms.map((p) => (
                    <option key={p} value={p}>{adPlatformLabel[p]}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Campaign name</label>
                <input className="form-control" {...form.register('name')} />
                {form.formState.errors.name && <div className="invalid-feedback d-block">{form.formState.errors.name.message}</div>}
              </div>
              <div className="col-md-4">
                <label className="form-label">Daily budget (USD)</label>
                <div className="input-group">
                  <span className="input-group-text">$</span>
                  <input type="number" min="0" step="0.01" className="form-control" placeholder="10.00" {...form.register('budgetDollars')} />
                </div>
              </div>
              <div className="col-md-4">
                <label className="form-label">Start date</label>
                <input type="date" className="form-control" {...form.register('startDate')} />
              </div>
              <div className="col-md-4">
                <label className="form-label">End date</label>
                <input type="date" className="form-control" {...form.register('endDate')} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-link link-secondary me-auto" type="button" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" type="submit" disabled={createCampaign.isPending}>
                {createCampaign.isPending ? 'Creating…' : 'Create campaign'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// ── Ad creative modal ──────────────────────────────────────────────────────────

const AdCreativeModal = ({ onClose }: { onClose: () => void }) => {
  const createCreative = useCreateAdCreative();
  const form = useForm<AdCreativeValues>({
    resolver: zodResolver(adCreativeSchema),
    defaultValues: { platform: 'google_ads', type: 'text', title: '', body: '', mediaUrl: '' },
  });

  const watchedType = form.watch('type');

  const onSubmit = (values: AdCreativeValues) => {
    createCreative.mutate(values, {
      onSuccess: () => { toast.success('Creative saved'); onClose(); },
      onError: (err: Error) => toast.error(err.message),
    });
  };

  return (
    <div className="modal modal-blur fade show d-block" role="dialog" aria-modal="true">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">New ad creative</h5>
            <button className="btn-close" type="button" onClick={onClose} aria-label="Close" />
          </div>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="modal-body row g-3">
              <div className="col-md-6">
                <label className="form-label">Platform</label>
                <select className="form-select" {...form.register('platform')}>
                  <option value="google_ads">Google Ads</option>
                  <option value="meta">Meta</option>
                  <option value="youtube">YouTube</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Type</label>
                <select className="form-select" {...form.register('type')}>
                  <option value="text">Text</option>
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
              </div>
              <div className="col-12">
                <label className="form-label">Title / Headline</label>
                <input className="form-control" {...form.register('title')} />
                {form.formState.errors.title && <div className="invalid-feedback d-block">{form.formState.errors.title.message}</div>}
              </div>
              <div className="col-12">
                <label className="form-label">Body copy <span className="text-secondary">(optional)</span></label>
                <textarea className="form-control" rows={3} {...form.register('body')} />
              </div>
              {(watchedType === 'image' || watchedType === 'video') && (
                <div className="col-12">
                  <label className="form-label">Media URL</label>
                  <input type="url" className="form-control" placeholder="https://…" {...form.register('mediaUrl')} />
                  {watchedType === 'video' && (
                    <div className="form-hint">For YouTube: the video will be uploaded to your connected YouTube channel.</div>
                  )}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-link link-secondary me-auto" type="button" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" type="submit" disabled={createCreative.isPending}>
                {createCreative.isPending ? 'Saving…' : 'Save creative'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// ── Ad platform settings modal ─────────────────────────────────────────────────

const AdSettingsModal = ({ onClose }: { onClose: () => void }) => {
  const { data: settings, isLoading } = useAdsSettings();
  const updateSettings = useUpdateAdsSettings();

  const form = useForm<AdsSettingsValues>({
    resolver: zodResolver(adsSettingsSchema),
    defaultValues: {
      googleClientId: '',
      googleClientSecret: '',
      googleDeveloperToken: '',
      metaAppId: '',
      metaAppSecret: '',
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        googleClientId: settings.googleClientId ?? '',
        googleClientSecret: '',
        googleDeveloperToken: '',
        metaAppId: settings.metaAppId ?? '',
        metaAppSecret: '',
      });
    }
  }, [settings, form]);

  const onSubmit = (values: AdsSettingsValues) => {
    updateSettings.mutate(values, {
      onSuccess: () => { toast.success('Ad platform settings saved'); onClose(); },
      onError: (err: Error) => toast.error(err.message),
    });
  };

  if (isLoading) return null;

  return (
    <div className="modal modal-blur fade show d-block" role="dialog" aria-modal="true">
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <IconSettings size={18} className="me-2" />
              Ad Platform Credentials
            </h5>
            <button className="btn-close" type="button" onClick={onClose} aria-label="Close" />
          </div>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="modal-body">
              <div className="alert alert-info small mb-4">
                <IconAlertCircle size={14} className="me-1" />
                These credentials are used to authenticate with Google Ads, Meta, and YouTube APIs.
                Leave secret fields blank to keep existing values.
              </div>
              <h6 className="fw-bold mb-3">Google Ads / YouTube</h6>
              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <label className="form-label">
                    OAuth Client ID
                    {settings?.googleClientIdSet && <span className="badge bg-green-lt ms-2">Set</span>}
                  </label>
                  <input className="form-control font-monospace" placeholder={settings?.googleClientIdSet ? '(existing)' : 'your-client-id.apps.googleusercontent.com'} {...form.register('googleClientId')} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">
                    OAuth Client Secret
                    {settings?.googleClientSecretSet && <span className="badge bg-green-lt ms-2">Set</span>}
                  </label>
                  <input type="password" className="form-control" placeholder={settings?.googleClientSecretSet ? 'leave blank to keep' : 'GOCSPX-…'} {...form.register('googleClientSecret')} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">
                    Google Ads Developer Token
                    {settings?.googleDeveloperTokenSet && <span className="badge bg-green-lt ms-2">Set</span>}
                  </label>
                  <input type="password" className="form-control" placeholder={settings?.googleDeveloperTokenSet ? 'leave blank to keep' : 'your developer token'} {...form.register('googleDeveloperToken')} />
                </div>
              </div>

              <h6 className="fw-bold mb-3">Meta (Facebook / Instagram)</h6>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">
                    App ID
                    {settings?.metaAppIdSet && <span className="badge bg-green-lt ms-2">Set</span>}
                  </label>
                  <input className="form-control font-monospace" placeholder={settings?.metaAppIdSet ? '(existing)' : '123456789012345'} {...form.register('metaAppId')} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">
                    App Secret
                    {settings?.metaAppSecretSet && <span className="badge bg-green-lt ms-2">Set</span>}
                  </label>
                  <input type="password" className="form-control" placeholder={settings?.metaAppSecretSet ? 'leave blank to keep' : 'your app secret'} {...form.register('metaAppSecret')} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-link link-secondary me-auto" type="button" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" type="submit" disabled={updateSettings.isPending}>
                {updateSettings.isPending ? 'Saving…' : 'Save credentials'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// ── Leads panel ────────────────────────────────────────────────────────────────

const LeadsPanel = () => {
  const { data: leads = [], isLoading, isError } = useSalesLeads();
  const deleteLead = useDeleteLead();
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<Lead | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Lead | null>(null);

  if (isLoading) return <TableSkeleton rows={5} columns={7} />;
  if (isError) return <ApiErrorAlert error="Failed to load leads." />;

  const counts: Record<Lead['status'], number> = { lead: 0, trial: 0, customer: 0, lost: 0 };
  leads.forEach((l) => { counts[l.status] = (counts[l.status] ?? 0) + 1; });

  const statCards = [
    { label: 'Total leads', value: leads.length, color: 'bg-blue' },
    { label: 'Leads', value: counts.lead, color: 'bg-azure' },
    { label: 'Trials', value: counts.trial, color: 'bg-yellow' },
    { label: 'Customers', value: counts.customer, color: 'bg-green' },
    { label: 'Lost', value: counts.lost, color: 'bg-red' },
  ];

  return (
    <>
      {showCreate && <LeadModal onClose={() => setShowCreate(false)} />}
      {editTarget && <LeadModal lead={editTarget} onClose={() => setEditTarget(null)} />}
      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete lead"
        body={`Delete ${deleteTarget?.name} (${deleteTarget?.email})?`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteLead.mutate(deleteTarget.id, {
            onSuccess: () => { toast.success('Lead deleted'); setDeleteTarget(null); },
            onError: (err: Error) => { toast.error(err.message); setDeleteTarget(null); },
          });
        }}
        onClose={() => setDeleteTarget(null)}
      />

      <div className="row g-3 mb-4">
        {statCards.map(({ label, value }) => (
          <div key={label} className="col-6 col-sm-4 col-lg-2">
            <div className="card card-sm h-100">
              <div className="card-body">
                <div className={`h2 mb-0 fw-bold`}>{value}</div>
                <div className="text-secondary small">{label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h3 className="card-title mb-0">
            <IconUsers size={16} className="me-2 text-primary" />
            Leads
          </h3>
          <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
            <IconPlus size={14} className="me-1" />
            Add lead
          </button>
        </div>
        <div className="table-responsive">
          <table className="table table-vcenter card-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Company</th>
                <th>Source</th>
                <th>Status</th>
                <th>Added</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-secondary py-4">No leads yet. Add your first lead to get started.</td></tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id}>
                    <td className="fw-semibold">{lead.name}</td>
                    <td className="text-secondary">{lead.email}</td>
                    <td>{lead.company ?? <span className="text-secondary">—</span>}</td>
                    <td><span className="text-capitalize text-secondary small">{lead.source}</span></td>
                    <td>
                      <span className={`badge ${leadStatusBadge[lead.status]} text-capitalize`}>{lead.status}</span>
                    </td>
                    <td className="text-secondary small">{new Date(lead.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="btn-list flex-nowrap">
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => setEditTarget(lead)} title="Edit">
                          <IconEdit size={14} />
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => setDeleteTarget(lead)} title="Delete">
                          <IconTrash size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

// ── Templates panel ────────────────────────────────────────────────────────────

const TemplatesPanel = () => {
  const { data: templates = [], isLoading, isError } = useSalesEmailTemplates();
  const deleteTemplate = useDeleteEmailTemplate();
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<EmailTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EmailTemplate | null>(null);

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ApiErrorAlert error="Failed to load templates." />;

  return (
    <>
      {showCreate && <TemplateModal onClose={() => setShowCreate(false)} />}
      {editTarget && <TemplateModal template={editTarget} onClose={() => setEditTarget(null)} />}
      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete template"
        body={`Delete template "${deleteTarget?.name}"?`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteTemplate.mutate(deleteTarget.id, {
            onSuccess: () => { toast.success('Template deleted'); setDeleteTarget(null); },
            onError: (err: Error) => { toast.error(err.message); setDeleteTarget(null); },
          });
        }}
        onClose={() => setDeleteTarget(null)}
      />

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">Email Templates</h4>
        <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
          <IconPlus size={14} className="me-1" />
          New template
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="card">
          <div className="card-body text-center text-secondary py-5">
            <IconTemplate size={32} className="mb-2 text-muted" />
            <p className="mb-0">No templates yet. Create your first reusable email template.</p>
          </div>
        </div>
      ) : (
        <div className="row g-3">
          {templates.map((t) => (
            <div key={t.id} className="col-md-6 col-lg-4">
              <div className="card h-100">
                <div className="card-body">
                  <div className="fw-bold mb-1">{t.name}</div>
                  <div className="text-secondary small mb-2">{t.subject}</div>
                  <div
                    className="text-muted small border rounded p-2"
                    style={{ maxHeight: 80, overflow: 'hidden', fontSize: '0.7rem' }}
                    dangerouslySetInnerHTML={{ __html: t.bodyHtml }}
                  />
                </div>
                <div className="card-footer d-flex gap-2">
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => setEditTarget(t)}>
                    <IconEdit size={13} className="me-1" />Edit
                  </button>
                  <button className="btn btn-sm btn-outline-danger ms-auto" onClick={() => setDeleteTarget(t)}>
                    <IconTrash size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

// ── Campaigns panel ────────────────────────────────────────────────────────────

const CampaignsPanel = () => {
  const { data: campaigns = [], isLoading, isError } = useSalesCampaigns();
  const { data: templates = [] } = useSalesEmailTemplates();
  const [showCompose, setShowCompose] = useState(false);

  if (isLoading) return <TableSkeleton rows={4} columns={5} />;
  if (isError) return <ApiErrorAlert error="Failed to load campaigns." />;

  return (
    <>
      {showCompose && <CampaignModal templates={templates} onClose={() => setShowCompose(false)} />}

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">Email Campaigns</h4>
        <button className="btn btn-primary btn-sm" onClick={() => setShowCompose(true)}>
          <IconSend size={14} className="me-1" />
          New campaign
        </button>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table className="table table-vcenter card-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Subject</th>
                <th>Recipients</th>
                <th>Status</th>
                <th>Sent</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.length === 0 ? (
                <tr><td colSpan={5} className="text-center text-secondary py-4">No campaigns yet. Send your first campaign above.</td></tr>
              ) : (
                campaigns.map((c) => (
                  <tr key={c.id}>
                    <td className="fw-semibold">{c.name}</td>
                    <td className="text-secondary">{c.subject}</td>
                    <td>{c.recipientCount}</td>
                    <td>
                      <span className={`badge ${c.status === 'sent' ? 'bg-green-lt' : 'bg-secondary-lt'} text-capitalize`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="text-secondary small">
                      {c.sentAt ? new Date(c.sentAt).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

// ── Ads panel ──────────────────────────────────────────────────────────────────

const AdsPanel = () => {
  const { data: connectionsData, isLoading: loadingConnections } = useAdsConnections();
  const { data: campaigns = [], isLoading: loadingCampaigns } = useAdsCampaigns();
  const { data: creatives = [], isLoading: loadingCreatives } = useAdsCreatives();
  const disconnect = useAdsDisconnect();
  const syncCampaigns = useSyncAdCampaigns();
  const deleteCreative = useDeleteAdCreative();

  const [showAdsCampaignModal, setShowAdsCampaignModal] = useState(false);
  const [showCreativeModal, setShowCreativeModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [deleteCreativeTarget, setDeleteCreativeTarget] = useState<AdCreative | null>(null);

  const [adsSubTab, setAdsSubTab] = useState<'campaigns' | 'creatives'>('campaigns');

  const connectedPlatforms = (connectionsData?.platforms ?? [])
    .filter((p) => p.connected)
    .map((p) => p.platform);

  const platformIcon = (platform: AdPlatform) => {
    if (platform === 'google_ads') return <IconBrandGoogle size={20} />;
    if (platform === 'meta') return <IconBrandMeta size={20} />;
    return <IconBrandYoutube size={20} />;
  };

  const platformColor = (platform: AdPlatform) => {
    if (platform === 'google_ads') return 'bg-red';
    if (platform === 'meta') return 'bg-blue';
    return 'bg-red';
  };

  return (
    <>
      {showAdsCampaignModal && (
        <AdCampaignModal
          connectedPlatforms={connectedPlatforms.length > 0 ? connectedPlatforms : ['google_ads', 'meta', 'youtube']}
          onClose={() => setShowAdsCampaignModal(false)}
        />
      )}
      {showCreativeModal && <AdCreativeModal onClose={() => setShowCreativeModal(false)} />}
      {showSettingsModal && <AdSettingsModal onClose={() => setShowSettingsModal(false)} />}
      <ConfirmModal
        open={Boolean(deleteCreativeTarget)}
        title="Delete creative"
        body={`Delete creative "${deleteCreativeTarget?.title}"?`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (!deleteCreativeTarget) return;
          deleteCreative.mutate(deleteCreativeTarget.id, {
            onSuccess: () => { toast.success('Creative deleted'); setDeleteCreativeTarget(null); },
            onError: (err: Error) => { toast.error(err.message); setDeleteCreativeTarget(null); },
          });
        }}
        onClose={() => setDeleteCreativeTarget(null)}
      />

      {/* Platform connection cards */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">Ad Platforms</h4>
        <button className="btn btn-sm btn-outline-secondary" onClick={() => setShowSettingsModal(true)}>
          <IconSettings size={14} className="me-1" />
          Configure credentials
        </button>
      </div>

      {loadingConnections ? (
        <LoadingSpinner />
      ) : (
        <div className="row g-3 mb-4">
          {(connectionsData?.platforms ?? []).map((p) => (
            <div key={p.platform} className="col-md-4">
              <div className={`card ${p.connected ? 'border-success' : ''}`}>
                <div className="card-body">
                  <div className="d-flex align-items-center gap-3">
                    <span className={`${platformColor(p.platform)} text-white avatar`}>
                      {platformIcon(p.platform)}
                    </span>
                    <div className="flex-grow-1">
                      <div className="fw-bold">{adPlatformLabel[p.platform]}</div>
                      {p.connected ? (
                        <div className="text-success small">
                          <IconCheck size={12} className="me-1" />
                          {p.connection?.accountName ?? 'Connected'}
                        </div>
                      ) : (
                        <div className="text-secondary small">Not connected</div>
                      )}
                      {!p.credentialsConfigured && !p.connected && (
                        <div className="text-warning small">
                          <IconAlertCircle size={12} className="me-1" />
                          Credentials not configured
                        </div>
                      )}
                    </div>
                    {p.connected ? (
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() =>
                          disconnect.mutate(p.platform, {
                            onSuccess: () => toast.success(`Disconnected ${adPlatformLabel[p.platform]}`),
                            onError: (err: Error) => toast.error(err.message),
                          })
                        }
                        disabled={disconnect.isPending}
                        title="Disconnect"
                      >
                        <IconLinkOff size={14} />
                      </button>
                    ) : (
                      <a
                        href={p.credentialsConfigured ? adsGetAuthUrl(p.platform === 'google_ads' ? 'google' : p.platform === 'meta' ? 'meta' : 'youtube') : '#'}
                        className={`btn btn-sm btn-primary ${!p.credentialsConfigured ? 'disabled' : ''}`}
                        title={p.credentialsConfigured ? 'Connect' : 'Configure credentials first'}
                      >
                        <IconLink size={14} className="me-1" />
                        Connect
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sub-tabs */}
      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button
            className={`nav-link ${adsSubTab === 'campaigns' ? 'active' : ''}`}
            onClick={() => setAdsSubTab('campaigns')}
          >
            <IconTargetArrow size={14} className="me-1" />
            Campaigns
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${adsSubTab === 'creatives' ? 'active' : ''}`}
            onClick={() => setAdsSubTab('creatives')}
          >
            <IconPhoto size={14} className="me-1" />
            Creatives
          </button>
        </li>
      </ul>

      {adsSubTab === 'campaigns' && (
        <>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span className="text-secondary small">{campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''}</span>
            <div className="btn-list">
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => syncCampaigns.mutate(undefined, {
                  onSuccess: (r) => toast.success(`Synced ${r.synced} campaigns${r.errors.length ? ` (${r.errors.length} errors)` : ''}`),
                  onError: (err: Error) => toast.error(err.message),
                })}
                disabled={syncCampaigns.isPending}
              >
                <IconRefresh size={14} className={`me-1 ${syncCampaigns.isPending ? 'spin' : ''}`} />
                Sync stats
              </button>
              <button className="btn btn-sm btn-primary" onClick={() => setShowAdsCampaignModal(true)}>
                <IconPlus size={14} className="me-1" />
                New campaign
              </button>
            </div>
          </div>

          {loadingCampaigns ? (
            <TableSkeleton rows={3} columns={7} />
          ) : (
            <div className="card">
              <div className="table-responsive">
                <table className="table table-vcenter card-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Platform</th>
                      <th>Status</th>
                      <th>Daily budget</th>
                      <th>Impressions</th>
                      <th>Clicks</th>
                      <th>Spend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.length === 0 ? (
                      <tr><td colSpan={7} className="text-center text-secondary py-4">No ad campaigns yet.</td></tr>
                    ) : (
                      campaigns.map((c) => (
                        <tr key={c.id}>
                          <td className="fw-semibold">{c.name}</td>
                          <td><span className="text-secondary small">{adPlatformLabel[c.platform]}</span></td>
                          <td>
                            <span className={`badge ${adCampaignStatusBadge[c.status]} text-capitalize`}>{c.status}</span>
                          </td>
                          <td>{fmtCurrency(c.budgetCents)}</td>
                          <td>{c.impressions.toLocaleString()}</td>
                          <td>{c.clicks.toLocaleString()}</td>
                          <td>{fmtCurrency(c.spendCents)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {adsSubTab === 'creatives' && (
        <>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span className="text-secondary small">{creatives.length} creative{creatives.length !== 1 ? 's' : ''}</span>
            <button className="btn btn-sm btn-primary" onClick={() => setShowCreativeModal(true)}>
              <IconPlus size={14} className="me-1" />
              New creative
            </button>
          </div>

          {loadingCreatives ? (
            <LoadingSpinner />
          ) : creatives.length === 0 ? (
            <div className="card">
              <div className="card-body text-center text-secondary py-5">
                <IconBulb size={32} className="mb-2 text-muted" />
                <p className="mb-0">No creatives yet. Add your first ad creative.</p>
              </div>
            </div>
          ) : (
            <div className="row g-3">
              {creatives.map((c) => (
                <div key={c.id} className="col-md-4 col-lg-3">
                  <div className="card h-100">
                    <div className="card-body">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        {c.type === 'video' && <IconVideo size={16} className="text-primary" />}
                        {c.type === 'image' && <IconPhoto size={16} className="text-success" />}
                        {c.type === 'text' && <IconFileText size={16} className="text-secondary" />}
                        <span className="badge bg-secondary-lt text-capitalize">{c.type}</span>
                        <span className="badge bg-blue-lt ms-auto text-capitalize" style={{ fontSize: '0.65rem' }}>{adPlatformLabel[c.platform]}</span>
                      </div>
                      <div className="fw-semibold mb-1">{c.title}</div>
                      {c.body && <div className="text-secondary small">{c.body}</div>}
                      {c.mediaUrl && (
                        <a href={c.mediaUrl} target="_blank" rel="noopener noreferrer" className="small text-truncate d-block mt-1">
                          {c.mediaUrl}
                        </a>
                      )}
                    </div>
                    <div className="card-footer">
                      <button
                        className="btn btn-sm btn-outline-danger w-100"
                        onClick={() => setDeleteCreativeTarget(c)}
                      >
                        <IconTrash size={13} className="me-1" />Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
};

// ── Main SalesPanel ────────────────────────────────────────────────────────────

export const SalesPanel = () => {
  const [tab, setTab] = useState<'leads' | 'templates' | 'campaigns' | 'ads'>('leads');

  return (
    <>
      <div className="card mb-4">
        <div className="card-header">
          <ul className="nav nav-tabs card-header-tabs">
            <li className="nav-item">
              <button className={`nav-link ${tab === 'leads' ? 'active' : ''}`} onClick={() => setTab('leads')}>
                <IconUsers size={15} className="me-1" />
                Leads
              </button>
            </li>
            <li className="nav-item">
              <button className={`nav-link ${tab === 'templates' ? 'active' : ''}`} onClick={() => setTab('templates')}>
                <IconTemplate size={15} className="me-1" />
                Templates
              </button>
            </li>
            <li className="nav-item">
              <button className={`nav-link ${tab === 'campaigns' ? 'active' : ''}`} onClick={() => setTab('campaigns')}>
                <IconMailForward size={15} className="me-1" />
                Campaigns
              </button>
            </li>
            <li className="nav-item">
              <button className={`nav-link ${tab === 'ads' ? 'active' : ''}`} onClick={() => setTab('ads')}>
                <IconTargetArrow size={15} className="me-1" />
                Advertising
              </button>
            </li>
          </ul>
        </div>
      </div>

      {tab === 'leads' && <LeadsPanel />}
      {tab === 'templates' && <TemplatesPanel />}
      {tab === 'campaigns' && <CampaignsPanel />}
      {tab === 'ads' && <AdsPanel />}
    </>
  );
};
