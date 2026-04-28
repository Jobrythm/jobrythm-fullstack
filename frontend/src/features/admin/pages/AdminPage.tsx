import { zodResolver } from '@hookform/resolvers/zod';
import {
  IconCheck,
  IconChartBar,
  IconCurrencyDollar,
  IconEye,
  IconEyeOff,
  IconFileInvoice,
  IconMail,
  IconPlus,
  IconSettings,
  IconShieldLock,
  IconBriefcase,
  IconTrendingUp,
  IconTrash,
  IconUser,
  IconUsers,
  IconEdit,
  IconAlertCircle,
  IconTargetArrow,
  IconSparkles,
  IconExternalLink,
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { z } from 'zod';
import { ApiErrorAlert } from '../../../components/ApiErrorAlert';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { TableSkeleton } from '../../../components/TableSkeleton';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { useAuth } from '../../../hooks/useAuth';
import type { AdminUser, AdminUserPlan } from '../../../types';
import type { AiDebugLogEntry } from '../../../api/admin';
import {
  useAdminCreateUser,
  useAdminDeleteUser,
  useAdminSettings,
  useAdminStats,
  useAdminUpdateUser,
  useAdminUsers,
  useTestEmail,
  useUpdateAdminSettings,
  useAdminAiLogs,
  useClearAdminAiLogs,
} from '../hooks/useAdminUsers';
import { SalesPanel } from './SalesPanel';
import { resolveApiBaseUrl } from '../../../api/hosts';

const PLANS: AdminUserPlan[] = ['starter', 'professional', 'business', 'admin'];

const planBadgeClass: Record<AdminUserPlan, string> = {
  starter: 'bg-secondary-lt',
  professional: 'bg-blue-lt',
  business: 'bg-indigo-lt',
  admin: 'bg-red-lt',
};

const createSchema = z.object({
  fullName: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Minimum 8 characters'),
  companyName: z.string().optional(),
  plan: z.enum(['starter', 'professional', 'business', 'admin']),
});

const editSchema = z.object({
  fullName: z.string().min(1, 'Required'),
  companyName: z.string().optional(),
  plan: z.enum(['starter', 'professional', 'business', 'admin']),
});

const stripeSettingsSchema = z.object({
  stripeApiKey: z.string().optional(),
  stripePublishableKey: z.string().optional(),
  stripeWebhookSecret: z.string().optional(),
  stripePortalConfigurationId: z.string().optional(),
  stripeStarterMonthlyPriceId: z.string().optional(),
  stripeStarterAnnualPriceId: z.string().optional(),
  stripeProfessionalMonthlyPriceId: z.string().optional(),
  stripeProfessionalAnnualPriceId: z.string().optional(),
  stripeBusinessMonthlyPriceId: z.string().optional(),
  stripeBusinessAnnualPriceId: z.string().optional(),
  appUrl: z.string().optional(),
});

const emailSettingsSchema = z.object({
  smtpHost: z.string().optional(),
  smtpPort: z.string().optional(),
  smtpUser: z.string().optional(),
  smtpPassword: z.string().optional(),
  smtpFromEmail: z.string().optional(),
  smtpFromName: z.string().optional(),
  testEmailTo: z.string().optional(),
});

const aiSettingsSchema = z.object({
  geminiApiKey: z.string().optional(),
  geminiModel: z.string().optional(),
});

type CreateValues = z.infer<typeof createSchema>;
type EditValues = z.infer<typeof editSchema>;
type StripeSettingsValues = z.infer<typeof stripeSettingsSchema>;
type EmailSettingsValues = z.infer<typeof emailSettingsSchema>;
type AiSettingsValues = z.infer<typeof aiSettingsSchema>;

// ── Create user modal ──────────────────────────────────────────────────────────
const CreateUserModal = ({ onClose }: { onClose: () => void }) => {
  const createUser = useAdminCreateUser();
  const form = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { plan: 'starter' },
  });

  const onSubmit = (values: CreateValues) => {
    createUser.mutate(values, {
      onSuccess: () => {
        toast.success('User created');
        onClose();
      },
      onError: (err: Error) => toast.error(err.message),
    });
  };

  return (
    <div className="modal modal-blur fade show d-block" role="dialog" aria-modal="true">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Create user</h5>
            <button className="btn-close" type="button" onClick={onClose} aria-label="Close" />
          </div>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="modal-body row g-3">
              <div className="col-md-6">
                <label className="form-label">Full name</label>
                <input className="form-control" {...form.register('fullName')} />
                {form.formState.errors.fullName && (
                  <div className="invalid-feedback d-block">{form.formState.errors.fullName.message}</div>
                )}
              </div>
              <div className="col-md-6">
                <label className="form-label">Email</label>
                <input type="email" className="form-control" {...form.register('email')} />
                {form.formState.errors.email && (
                  <div className="invalid-feedback d-block">{form.formState.errors.email.message}</div>
                )}
              </div>
              <div className="col-md-6">
                <label className="form-label">Password</label>
                <input type="password" className="form-control" {...form.register('password')} />
                {form.formState.errors.password && (
                  <div className="invalid-feedback d-block">{form.formState.errors.password.message}</div>
                )}
              </div>
              <div className="col-md-6">
                <label className="form-label">Company name <span className="text-secondary">(optional)</span></label>
                <input className="form-control" {...form.register('companyName')} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Plan / role</label>
                <select className="form-select" {...form.register('plan')}>
                  {PLANS.map((p) => (
                    <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-link link-secondary me-auto" type="button" onClick={onClose}>
                Cancel
              </button>
              <button className="btn btn-primary" type="submit" disabled={createUser.isPending}>
                {createUser.isPending ? 'Creating…' : 'Create user'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// ── Edit user modal ────────────────────────────────────────────────────────────
const EditUserModal = ({ user, onClose }: { user: AdminUser; onClose: () => void }) => {
  const updateUser = useAdminUpdateUser();
  const form = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      fullName: user.fullName,
      companyName: user.companyName ?? '',
      plan: user.plan,
    },
  });

  const onSubmit = (values: EditValues) => {
    updateUser.mutate(
      { id: user.id, payload: values },
      {
        onSuccess: () => {
          toast.success('User updated');
          onClose();
        },
        onError: (err: Error) => toast.error(err.message),
      },
    );
  };

  return (
    <div className="modal modal-blur fade show d-block" role="dialog" aria-modal="true">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Edit user — {user.email}</h5>
            <button className="btn-close" type="button" onClick={onClose} aria-label="Close" />
          </div>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="modal-body row g-3">
              <div className="col-md-6">
                <label className="form-label">Full name</label>
                <input className="form-control" {...form.register('fullName')} />
                {form.formState.errors.fullName && (
                  <div className="invalid-feedback d-block">{form.formState.errors.fullName.message}</div>
                )}
              </div>
              <div className="col-md-6">
                <label className="form-label">Company name</label>
                <input className="form-control" {...form.register('companyName')} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Plan / role</label>
                <select className="form-select" {...form.register('plan')}>
                  {PLANS.map((p) => (
                    <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-link link-secondary me-auto" type="button" onClick={onClose}>
                Cancel
              </button>
              <button className="btn btn-primary" type="submit" disabled={updateUser.isPending}>
                {updateUser.isPending ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// ── Dashboard stats tab ────────────────────────────────────────────────────────
const DashboardPanel = () => {
  const { data: stats, isLoading, isError } = useAdminStats();

  if (isLoading) return <LoadingSpinner />;
  if (isError || !stats) return <ApiErrorAlert error="Failed to load statistics." />;

  const fmtCurrency = (cents: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(cents / 100);

  const planLabels: Record<string, string> = {
    starter: 'Starter',
    professional: 'Professional',
    business: 'Business',
  };
  const planColors: Record<string, string> = {
    starter: 'bg-secondary',
    professional: 'bg-primary',
    business: 'bg-indigo',
  };

  const totalPlanCustomers = Object.values(stats.planBreakdown).reduce((a, b) => a + b, 0) || 1;

  const statCards = [
    {
      label: 'Total customers',
      value: stats.totalCustomers,
      sub: 'All paying & free accounts',
      icon: <IconUsers size={20} />,
      color: 'bg-primary',
    },
    {
      label: 'New customers (30d)',
      value: stats.newCustomersLast30d,
      sub: 'Registered in last 30 days',
      icon: <IconTrendingUp size={20} />,
      color: 'bg-green',
    },
    {
      label: 'Revenue (30d)',
      value: fmtCurrency(stats.revenueLast30dCents),
      sub: 'From paid invoices',
      icon: <IconCurrencyDollar size={20} />,
      color: 'bg-lime',
    },
    {
      label: 'Total revenue',
      value: fmtCurrency(stats.totalRevenueCents),
      sub: 'All time, paid invoices',
      icon: <IconChartBar size={20} />,
      color: 'bg-teal',
    },
    {
      label: 'Total jobs',
      value: stats.totalJobs,
      sub: `${stats.activeJobs} currently active`,
      icon: <IconBriefcase size={20} />,
      color: 'bg-orange',
    },
    {
      label: 'Quotes sent (30d)',
      value: stats.quotesLast30d,
      sub: 'Created in last 30 days',
      icon: <IconFileInvoice size={20} />,
      color: 'bg-azure',
    },
    {
      label: 'Total paid invoices',
      value: stats.totalPaidInvoices,
      sub: 'All time',
      icon: <IconCheck size={20} />,
      color: 'bg-success',
    },
  ];

  return (
    <div className="row g-3">
      {/* Stat cards */}
      {statCards.map(({ label, value, sub, icon, color }) => (
        <div key={label} className="col-sm-6 col-lg-4">
          <div className="card card-sm h-100">
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col-auto">
                  <span className={`${color} text-white avatar`}>{icon}</span>
                </div>
                <div className="col">
                  <div className="h3 mb-0 fw-bold">{value}</div>
                  <div className="fw-medium text-body">{label}</div>
                  <div className="text-secondary small">{sub}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Plan breakdown */}
      <div className="col-12">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title mb-0">
              <IconUsers size={16} className="me-2" />
              Customers by plan
            </h3>
          </div>
          <div className="card-body">
            <div className="row g-3">
              {Object.entries(stats.planBreakdown).map(([plan, count]) => {
                const pct = Math.round((count / totalPlanCustomers) * 100);
                return (
                  <div key={plan} className="col-md-4">
                    <div className="d-flex justify-content-between mb-1">
                      <span className={`badge ${planColors[plan] ?? 'bg-secondary'}-lt text-capitalize`}>
                        {planLabels[plan] ?? plan}
                      </span>
                      <span className="text-secondary small">{count} user{count !== 1 ? 's' : ''} · {pct}%</span>
                    </div>
                    <div className="progress progress-sm">
                      <div
                        className={`progress-bar ${planColors[plan] ?? 'bg-secondary'}`}
                        style={{ width: `${pct}%` }}
                        role="progressbar"
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Stripe Settings tab ────────────────────────────────────────────────────────
const StripeSettingsPanel = () => {
  const { data: settings, isLoading } = useAdminSettings();
  const updateSettings = useUpdateAdminSettings();
  const [showKey, setShowKey] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);

  // Derive the webhook URL from the API base, not window.location (they may differ)
  const apiBase = resolveApiBaseUrl().replace(/\/api$/, '');
  const webhookUrl = `${apiBase}/api/billing/webhook`;

  const form = useForm<StripeSettingsValues>({
    resolver: zodResolver(stripeSettingsSchema),
    defaultValues: {
      stripeApiKey: '',
      stripePublishableKey: '',
      stripeWebhookSecret: '',
      stripePortalConfigurationId: '',
      stripeStarterMonthlyPriceId: '',
      stripeStarterAnnualPriceId: '',
      stripeProfessionalMonthlyPriceId: '',
      stripeProfessionalAnnualPriceId: '',
      stripeBusinessMonthlyPriceId: '',
      stripeBusinessAnnualPriceId: '',
      appUrl: '',
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        stripeApiKey: '',
        stripePublishableKey: settings.stripePublishableKey ?? '',
        stripeWebhookSecret: '',
        stripePortalConfigurationId: settings.stripePortalConfigurationId ?? '',
        stripeStarterMonthlyPriceId: settings.stripeStarterMonthlyPriceId ?? '',
        stripeStarterAnnualPriceId: settings.stripeStarterAnnualPriceId ?? '',
        stripeProfessionalMonthlyPriceId: settings.stripeProfessionalMonthlyPriceId ?? '',
        stripeProfessionalAnnualPriceId: settings.stripeProfessionalAnnualPriceId ?? '',
        stripeBusinessMonthlyPriceId: settings.stripeBusinessMonthlyPriceId ?? '',
        stripeBusinessAnnualPriceId: settings.stripeBusinessAnnualPriceId ?? '',
        appUrl: settings.appUrl ?? '',
      });
    }
  }, [settings, form]);

  const onSubmit = (values: StripeSettingsValues) => {
    const payload: Record<string, string> = {};
    if (values.stripeApiKey?.trim()) payload.stripeApiKey = values.stripeApiKey.trim();
    if (values.stripeWebhookSecret?.trim()) payload.stripeWebhookSecret = values.stripeWebhookSecret.trim();
    if (values.stripePublishableKey !== undefined) payload.stripePublishableKey = values.stripePublishableKey?.trim() ?? '';
    if (values.stripePortalConfigurationId !== undefined) payload.stripePortalConfigurationId = values.stripePortalConfigurationId?.trim() ?? '';
    if (values.stripeStarterMonthlyPriceId !== undefined) payload.stripeStarterMonthlyPriceId = values.stripeStarterMonthlyPriceId?.trim() ?? '';
    if (values.stripeStarterAnnualPriceId !== undefined) payload.stripeStarterAnnualPriceId = values.stripeStarterAnnualPriceId?.trim() ?? '';
    if (values.stripeProfessionalMonthlyPriceId !== undefined) payload.stripeProfessionalMonthlyPriceId = values.stripeProfessionalMonthlyPriceId?.trim() ?? '';
    if (values.stripeProfessionalAnnualPriceId !== undefined) payload.stripeProfessionalAnnualPriceId = values.stripeProfessionalAnnualPriceId?.trim() ?? '';
    if (values.stripeBusinessMonthlyPriceId !== undefined) payload.stripeBusinessMonthlyPriceId = values.stripeBusinessMonthlyPriceId?.trim() ?? '';
    if (values.stripeBusinessAnnualPriceId !== undefined) payload.stripeBusinessAnnualPriceId = values.stripeBusinessAnnualPriceId?.trim() ?? '';
    if (values.appUrl !== undefined) payload.appUrl = values.appUrl?.trim() ?? '';

    updateSettings.mutate(payload, {
      onSuccess: () => {
        toast.success('Stripe settings saved');
        form.reset({ stripeApiKey: '', stripeWebhookSecret: '' });
      },
      onError: (err: Error) => toast.error(err.message),
    });
  };

  if (isLoading) return <div className="text-secondary py-3">Loading settings…</div>;

  const statusItems = [
    { label: 'Secret Key', set: settings?.stripeApiKeySet, value: settings?.stripeApiKey },
    { label: 'Publishable Key', set: Boolean(settings?.stripePublishableKey), value: settings?.stripePublishableKey },
    { label: 'Webhook Secret', set: settings?.stripeWebhookSecretSet, value: settings?.stripeWebhookSecret },
    { label: 'Starter Monthly', set: Boolean(settings?.stripeStarterMonthlyPriceId), value: settings?.stripeStarterMonthlyPriceId },
    { label: 'Pro Monthly', set: Boolean(settings?.stripeProfessionalMonthlyPriceId), value: settings?.stripeProfessionalMonthlyPriceId },
    { label: 'Business Monthly', set: Boolean(settings?.stripeBusinessMonthlyPriceId), value: settings?.stripeBusinessMonthlyPriceId },
    { label: 'App URL', set: Boolean(settings?.appUrl), value: settings?.appUrl },
  ];

  return (
    <div className="row g-4">
      {/* Setup guide */}
      <div className="col-12">
        <div className="alert alert-info" role="alert">
          <div className="d-flex gap-2 align-items-start">
            <IconAlertCircle size={18} className="mt-1 flex-shrink-0" />
            <div className="small">
              <h4 className="alert-heading h6 mb-2">Stripe setup — step by step</h4>
              <ol className="mb-2 ps-3">
                <li>Sign in to <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer">dashboard.stripe.com <IconExternalLink size={11} /></a></li>
                <li>Go to <strong>Developers → API keys</strong> — copy your <strong>Secret key</strong> (<code>sk_live_…</code> or <code>sk_test_…</code>) and <strong>Publishable key</strong> (<code>pk_live_…</code>)</li>
                <li>Go to <strong>Developers → Webhooks → Add endpoint</strong> — paste this URL: <code className="user-select-all">{webhookUrl}</code></li>
                <li>Select events: <code>checkout.session.completed</code>, <code>customer.subscription.updated</code>, <code>customer.subscription.deleted</code>, <code>payment_intent.succeeded</code></li>
                <li>Click "Reveal" on the webhook's <strong>Signing secret</strong> (<code>whsec_…</code>) and paste it below</li>
                <li>Go to <strong>Products</strong> — create your 3 plans (Starter/Professional/Business), each with a monthly and annual price. Copy each <strong>Price ID</strong> (<code>price_…</code>) below</li>
                <li>Enable the <strong>Customer Portal</strong> at <em>Settings → Billing → Customer portal</em>. Optional: copy the Portal Configuration ID (<code>bpc_…</code>) to customise the portal appearance</li>
              </ol>
              <p className="mb-0 text-secondary">Use <code>sk_test_</code> during development, <code>sk_live_</code> in production. Keep them in sync.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Status cards */}
      <div className="col-12">
        <div className="row g-2">
          {statusItems.map(({ label, set, value }) => (
            <div key={label} className="col-6 col-md-3">
              <div className={`card card-sm ${set ? 'border-success' : 'border-warning'}`}>
                <div className="card-body py-2 px-3">
                  <div className="d-flex align-items-center gap-2">
                    {set
                      ? <IconCheck size={14} className="text-success flex-shrink-0" />
                      : <IconAlertCircle size={14} className="text-warning flex-shrink-0" />
                    }
                    <div>
                      <div className="small fw-semibold">{label}</div>
                      <div className="text-secondary" style={{ fontSize: '0.7rem', fontFamily: 'monospace' }}>
                        {set ? (value || '••••') : 'Not set'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Settings form */}
      <div className="col-12">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title mb-0">
              <IconSettings size={16} className="me-2" />
              Stripe credentials &amp; configuration
            </h3>
          </div>
          <div className="card-body">
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="row g-3">

                {/* ── API Keys ── */}
                <div className="col-12">
                  <h5 className="text-secondary small fw-semibold text-uppercase mb-0">API Keys</h5>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">
                    Secret Key
                    <span className="text-secondary ms-1 fw-normal small">(leave blank to keep existing)</span>
                  </label>
                  <div className="input-group">
                    <input
                      type={showKey ? 'text' : 'password'}
                      className="form-control font-monospace"
                      placeholder={settings?.stripeApiKeySet ? 'Enter new key to replace' : 'sk_live_… or sk_test_…'}
                      {...form.register('stripeApiKey')}
                    />
                    <button type="button" className="btn btn-outline-secondary" onClick={() => setShowKey((v) => !v)}>
                      {showKey ? <IconEyeOff size={14} /> : <IconEye size={14} />}
                    </button>
                  </div>
                  <div className="form-hint">
                    Your Stripe <strong>server-side</strong> secret. Never expose this to clients.
                    Find it at <strong>Developers → API keys → Secret key</strong>. Format: <code>sk_live_…</code> or <code>sk_test_…</code>
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">Publishable Key</label>
                  <input
                    className="form-control font-monospace"
                    placeholder="pk_live_… or pk_test_…"
                    {...form.register('stripePublishableKey')}
                  />
                  <div className="form-hint">
                    Safe to expose publicly — used in the browser for Stripe.js payment forms.
                    Find it at <strong>Developers → API keys → Publishable key</strong>. Format: <code>pk_live_…</code>
                  </div>
                </div>

                {/* ── Webhook ── */}
                <div className="col-12 mt-1">
                  <h5 className="text-secondary small fw-semibold text-uppercase mb-0">Webhook</h5>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">
                    Webhook Signing Secret
                    <span className="text-secondary ms-1 fw-normal small">(leave blank to keep existing)</span>
                  </label>
                  <div className="input-group">
                    <input
                      type={showWebhookSecret ? 'text' : 'password'}
                      className="form-control font-monospace"
                      placeholder={settings?.stripeWebhookSecretSet ? 'Enter new secret to replace' : 'whsec_…'}
                      {...form.register('stripeWebhookSecret')}
                    />
                    <button type="button" className="btn btn-outline-secondary" onClick={() => setShowWebhookSecret((v) => !v)}>
                      {showWebhookSecret ? <IconEyeOff size={14} /> : <IconEye size={14} />}
                    </button>
                  </div>
                  <div className="form-hint">
                    Used to verify that webhook events genuinely come from Stripe.
                    <strong> Developers → Webhooks → [your endpoint] → Signing secret → Reveal</strong>. Format: <code>whsec_…</code>
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">Webhook Endpoint URL</label>
                  <div className="input-group">
                    <input className="form-control font-monospace text-secondary" value={webhookUrl} readOnly />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => { void navigator.clipboard.writeText(webhookUrl); toast.success('Copied!'); }}
                    >
                      Copy
                    </button>
                  </div>
                  <div className="form-hint">
                    Paste this URL when adding a webhook endpoint in Stripe. This is your server's billing webhook.
                  </div>
                </div>

                {/* ── Portal config ID ── */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold">
                    Portal Configuration ID
                    <span className="text-secondary ms-1 fw-normal small">(optional)</span>
                  </label>
                  <input
                    className="form-control font-monospace"
                    placeholder="bpc_…"
                    {...form.register('stripePortalConfigurationId')}
                  />
                  <div className="form-hint">
                    Customises which features contractors see in the billing self-service portal.
                    Leave blank to use Stripe's default. Find it at <strong>Settings → Billing → Customer portal → Configuration ID</strong>. Format: <code>bpc_…</code>
                  </div>
                </div>

                {/* ── App URL ── */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold">App URL</label>
                  <input
                    className="form-control"
                    placeholder="https://app.jobrythm.com"
                    {...form.register('appUrl')}
                  />
                  <div className="form-hint">
                    The public URL where your app is hosted (no trailing slash). Used to build client portal links in quote/invoice emails.
                    Example: <code>https://app.jobrythm.com</code>
                  </div>
                </div>

                {/* ── Price IDs — Starter ── */}
                <div className="col-12 mt-1">
                  <h5 className="text-secondary small fw-semibold text-uppercase mb-0">Price IDs — Starter plan ($14/mo · $9/mo billed annually)</h5>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Starter Monthly Price ID</label>
                  <input className="form-control font-monospace" placeholder="price_…" {...form.register('stripeStarterMonthlyPriceId')} />
                  <div className="form-hint">
                    Found in your Stripe Dashboard under <strong>Products → Starter → Monthly price → Price ID</strong>
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Starter Annual Price ID</label>
                  <input className="form-control font-monospace" placeholder="price_…" {...form.register('stripeStarterAnnualPriceId')} />
                  <div className="form-hint">
                    Found in your Stripe Dashboard under <strong>Products → Starter → Annual price → Price ID</strong>
                  </div>
                </div>

                {/* ── Price IDs — Professional ── */}
                <div className="col-12 mt-1">
                  <h5 className="text-secondary small fw-semibold text-uppercase mb-0">Price IDs — Professional plan ($29/mo · $24/mo billed annually)</h5>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Professional Monthly Price ID</label>
                  <input className="form-control font-monospace" placeholder="price_…" {...form.register('stripeProfessionalMonthlyPriceId')} />
                  <div className="form-hint">
                    <strong>Products → Professional → Monthly price → Price ID</strong>
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Professional Annual Price ID</label>
                  <input className="form-control font-monospace" placeholder="price_…" {...form.register('stripeProfessionalAnnualPriceId')} />
                  <div className="form-hint">
                    <strong>Products → Professional → Annual price → Price ID</strong>
                  </div>
                </div>

                {/* ── Price IDs — Business ── */}
                <div className="col-12 mt-1">
                  <h5 className="text-secondary small fw-semibold text-uppercase mb-0">Price IDs — Business plan ($59/mo · $49/mo billed annually)</h5>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Business Monthly Price ID</label>
                  <input className="form-control font-monospace" placeholder="price_…" {...form.register('stripeBusinessMonthlyPriceId')} />
                  <div className="form-hint">
                    <strong>Products → Business → Monthly price → Price ID</strong>
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Business Annual Price ID</label>
                  <input className="form-control font-monospace" placeholder="price_…" {...form.register('stripeBusinessAnnualPriceId')} />
                  <div className="form-hint">
                    <strong>Products → Business → Annual price → Price ID</strong>
                  </div>
                </div>

                <div className="col-12 pt-1">
                  <button className="btn btn-primary" type="submit" disabled={updateSettings.isPending}>
                    {updateSettings.isPending ? 'Saving…' : 'Save Stripe settings'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Email Settings panel ───────────────────────────────────────────────────────
const EmailSettingsPanel = () => {
  const { data: settings, isLoading } = useAdminSettings();
  const updateSettings = useUpdateAdminSettings();
  const testEmail = useTestEmail();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<EmailSettingsValues>({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues: {
      smtpHost: '',
      smtpPort: '',
      smtpUser: '',
      smtpPassword: '',
      smtpFromEmail: '',
      smtpFromName: '',
      testEmailTo: '',
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        smtpHost: settings.smtpHost ?? '',
        smtpPort: settings.smtpPort ?? '',
        smtpUser: settings.smtpUser ?? '',
        smtpPassword: '',
        smtpFromEmail: settings.smtpFromEmail ?? '',
        smtpFromName: settings.smtpFromName ?? '',
        testEmailTo: '',
      });
    }
  }, [settings, form]);

  const onSubmit = (values: EmailSettingsValues) => {
    const payload: Record<string, string> = {};
    if (values.smtpHost !== undefined) payload.smtpHost = values.smtpHost?.trim() ?? '';
    if (values.smtpPort !== undefined) payload.smtpPort = values.smtpPort?.trim() ?? '';
    if (values.smtpUser !== undefined) payload.smtpUser = values.smtpUser?.trim() ?? '';
    if (values.smtpPassword?.trim()) payload.smtpPassword = values.smtpPassword.trim();
    if (values.smtpFromEmail !== undefined) payload.smtpFromEmail = values.smtpFromEmail?.trim() ?? '';
    if (values.smtpFromName !== undefined) payload.smtpFromName = values.smtpFromName?.trim() ?? '';

    updateSettings.mutate(payload, {
      onSuccess: () => {
        toast.success('Email settings saved');
        form.setValue('smtpPassword', '');
      },
      onError: (err: Error) => toast.error(err.message),
    });
  };

  const handleTestEmail = () => {
    const to = form.getValues('testEmailTo')?.trim() || undefined;
    testEmail.mutate(to, {
      onSuccess: (res) => toast.success(res.message),
      onError: (err: Error) => toast.error(err.message),
    });
  };

  if (isLoading) return <div className="text-secondary py-3">Loading settings…</div>;

  return (
    <div className="row g-4">
      {/* Provider guide */}
      <div className="col-12">
        <div className="alert alert-info" role="alert">
          <div className="d-flex gap-2 align-items-start">
            <IconAlertCircle size={18} className="mt-1 flex-shrink-0" />
            <div className="small">
              <h4 className="alert-heading h6 mb-2">SMTP provider quick reference</h4>
              <div className="row g-2">
                <div className="col-md-6">
                  <strong>Gmail / Google Workspace</strong>
                  <ul className="ps-3 mb-1">
                    <li>Host: <code>smtp.gmail.com</code> · Port: <code>587</code></li>
                    <li>Enable <em>2-Step Verification</em>, then create an <strong>App Password</strong> at <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer">myaccount.google.com/apppasswords <IconExternalLink size={10} /></a></li>
                    <li>Use your Gmail address as both username and From email</li>
                  </ul>
                </div>
                <div className="col-md-6">
                  <strong>SendGrid</strong>
                  <ul className="ps-3 mb-1">
                    <li>Host: <code>smtp.sendgrid.net</code> · Port: <code>587</code></li>
                    <li>Username: <code>apikey</code> (literal string)</li>
                    <li>Password: your <a href="https://app.sendgrid.com/settings/api_keys" target="_blank" rel="noopener noreferrer">SendGrid API key <IconExternalLink size={10} /></a></li>
                  </ul>
                </div>
                <div className="col-md-6">
                  <strong>Mailgun</strong>
                  <ul className="ps-3 mb-0">
                    <li>Host: <code>smtp.mailgun.org</code> · Port: <code>587</code></li>
                    <li>Username &amp; password from your <a href="https://app.mailgun.com/app/domains" target="_blank" rel="noopener noreferrer">Mailgun domain <IconExternalLink size={10} /></a></li>
                  </ul>
                </div>
                <div className="col-md-6">
                  <strong>Proton Mail</strong>
                  <ul className="ps-3 mb-0">
                    <li>Host: <code>smtp.protonmail.ch</code> · Port: <code>587</code></li>
                    <li>Password: your <strong>Bridge password</strong> (not account login) from the <a href="https://proton.me/mail/bridge" target="_blank" rel="noopener noreferrer">Bridge app <IconExternalLink size={10} /></a></li>
                  </ul>
                </div>
              </div>
              <p className="mb-0 mt-2 text-secondary">Port <code>587</code> uses STARTTLS (auto-upgrade). Port <code>465</code> uses SSL/TLS directly. Both are secure. Port <code>25</code> is unencrypted — avoid it.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Status card */}
      <div className="col-12">
        <div className={`card card-sm ${settings?.emailConfigured ? 'border-success' : 'border-warning'}`}>
          <div className="card-body py-2 px-3">
            <div className="d-flex align-items-center gap-2">
              {settings?.emailConfigured
                ? <IconCheck size={16} className="text-success" />
                : <IconAlertCircle size={16} className="text-warning" />
              }
              <span className="fw-semibold small">
                {settings?.emailConfigured ? 'Email configured' : 'Email not configured'}
              </span>
              {settings?.emailConfigured && settings.smtpHost && (
                <span className="text-secondary small ms-1">via {settings.smtpHost}:{settings.smtpPort || '587'}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Settings form */}
      <div className="col-12">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title mb-0">
              <IconSettings size={16} className="me-2" />
              SMTP configuration
            </h3>
          </div>
          <div className="card-body">
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="row g-3">
                <div className="col-md-9">
                  <label className="form-label fw-semibold">SMTP Host</label>
                  <input
                    className="form-control font-monospace"
                    placeholder="smtp.gmail.com"
                    {...form.register('smtpHost')}
                  />
                  <div className="form-hint">The outgoing mail server hostname. See your email provider's SMTP docs.</div>
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-semibold">Port</label>
                  <input
                    className="form-control font-monospace"
                    placeholder="587"
                    {...form.register('smtpPort')}
                  />
                  <div className="form-hint"><code>587</code> (STARTTLS) or <code>465</code> (SSL). Use <code>587</code> if unsure.</div>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">SMTP Username</label>
                  <input
                    className="form-control"
                    placeholder="you@example.com"
                    autoComplete="username"
                    {...form.register('smtpUser')}
                  />
                  <div className="form-hint">Usually your full email address. For SendGrid, use the literal string <code>apikey</code>.</div>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">
                    SMTP Password
                    <span className="text-secondary ms-1 fw-normal small">(leave blank to keep existing)</span>
                  </label>
                  <div className="input-group">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-control"
                      placeholder={settings?.smtpPasswordSet ? 'Enter new password to replace' : 'App password or API key'}
                      autoComplete="new-password"
                      {...form.register('smtpPassword')}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowPassword((v) => !v)}
                    >
                      {showPassword ? <IconEyeOff size={14} /> : <IconEye size={14} />}
                    </button>
                  </div>
                  <div className="form-hint">
                    Use an <strong>App Password</strong> (not your account password). For Gmail: generate one at <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer">myaccount.google.com/apppasswords <IconExternalLink size={10} /></a>
                  </div>
                </div>

                <div className="col-12 mt-1">
                  <h5 className="text-secondary small fw-semibold text-uppercase mb-0">Sender details</h5>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">From Email</label>
                  <input
                    className="form-control"
                    placeholder="noreply@yourcompany.com"
                    {...form.register('smtpFromEmail')}
                  />
                  <div className="form-hint">
                    The email address shown in the "From" field of emails sent to your customers. Must be verified/authorised by your SMTP provider.
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">From Name</label>
                  <input
                    className="form-control"
                    placeholder="Jobrythm"
                    {...form.register('smtpFromName')}
                  />
                  <div className="form-hint">
                    The display name shown alongside the From email. E.g. <code>Jobrythm</code> or your company name.
                  </div>
                </div>

                <div className="col-12 pt-1">
                  <button className="btn btn-primary" type="submit" disabled={updateSettings.isPending}>
                    {updateSettings.isPending ? 'Saving…' : 'Save email settings'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Test email */}
      <div className="col-12">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title mb-0">
              <IconMail size={16} className="me-2" />
              Send test email
            </h3>
          </div>
          <div className="card-body">
            <p className="text-secondary small mb-3">
              Sends a test email to verify your SMTP configuration is working correctly.
              Leave blank to send to the admin account's email address.
            </p>
            <div className="row g-2 align-items-end">
              <div className="col-md-6">
                <label className="form-label">Recipient (optional)</label>
                <input
                  className="form-control"
                  placeholder="test@example.com"
                  {...form.register('testEmailTo')}
                />
              </div>
              <div className="col-auto">
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={handleTestEmail}
                  disabled={testEmail.isPending || !settings?.emailConfigured}
                >
                  {testEmail.isPending ? 'Sending…' : 'Send test email'}
                </button>
              </div>
              {!settings?.emailConfigured && (
                <div className="col-12">
                  <span className="text-warning small">Save your SMTP settings first before sending a test email.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── AI / Gemini Settings panel ─────────────────────────────────────────────────
const GEMINI_MODELS = [
  { value: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro Preview — most capable, best reasoning' },
  { value: 'gemini-3-flash-preview', label: 'Gemini 3 Flash Preview — recommended, fast & cost-effective' },
  { value: 'gemini-3.1-flash-lite-preview', label: 'Gemini 3.1 Flash Lite Preview — lightest & cheapest' },
  { value: 'gemini-2.5-pro-preview-05-06', label: 'Gemini 2.5 Pro Preview (legacy)' },
  { value: 'gemini-2.5-flash-preview-04-17', label: 'Gemini 2.5 Flash Preview (legacy)' },
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (legacy)' },
  { value: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash Lite (legacy)' },
  { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (legacy)' },
  { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (legacy)' },
];

const AiSettingsPanel = () => {
  const { data: settings, isLoading } = useAdminSettings();
  const updateSettings = useUpdateAdminSettings();
  const [showKey, setShowKey] = useState(false);

  const form = useForm<AiSettingsValues>({
    resolver: zodResolver(aiSettingsSchema),
    defaultValues: {
      geminiApiKey: '',
      geminiModel: 'gemini-3-flash-preview',
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        geminiApiKey: '',
        geminiModel: settings.geminiModel ?? 'gemini-3-flash-preview',
      });
    }
  }, [settings, form]);

  const onSubmit = (values: AiSettingsValues) => {
    const payload: Record<string, string> = {};
    if (values.geminiApiKey?.trim()) payload.geminiApiKey = values.geminiApiKey.trim();
    if (values.geminiModel) payload.geminiModel = values.geminiModel;

    updateSettings.mutate(payload, {
      onSuccess: () => {
        toast.success('AI settings saved');
        form.setValue('geminiApiKey', '');
      },
      onError: (err: Error) => toast.error(err.message),
    });
  };

  if (isLoading) return <div className="text-secondary py-3">Loading settings…</div>;

  return (
    <div className="row g-4">
      {/* What this does */}
      <div className="col-12">
        <div className="alert alert-info" role="alert">
          <div className="d-flex gap-2 align-items-start">
            <IconAlertCircle size={18} className="mt-1 flex-shrink-0" />
            <div className="small">
              <h4 className="alert-heading h6 mb-2">AI features — powered by Google Gemini</h4>
              <p className="mb-2">
                When enabled, contractors see a <strong>✨ AI Suggest</strong> button on job line items.
                The AI suggests appropriate line items with quantities and prices based on the job description and past job history.
                AI also powers smart autofill when creating new clients and jobs.
              </p>
              <h5 className="h6 mb-1">How to get a Gemini API key</h5>
              <ol className="mb-2 ps-3">
                <li>Go to <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">aistudio.google.com/app/apikey <IconExternalLink size={10} /></a></li>
                <li>Click <strong>Create API key</strong> and select or create a Google Cloud project</li>
                <li>Copy the generated API key and paste it below</li>
              </ol>
              <p className="mb-0 text-secondary">
                Gemini 2.0 Flash is free up to generous rate limits. Higher-tier models cost per token — see <a href="https://ai.google.dev/pricing" target="_blank" rel="noopener noreferrer">ai.google.dev/pricing <IconExternalLink size={10} /></a>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Status card */}
      <div className="col-12">
        <div className={`card card-sm ${settings?.aiConfigured ? 'border-success' : 'border-warning'}`}>
          <div className="card-body py-2 px-3">
            <div className="d-flex align-items-center gap-2">
              {settings?.aiConfigured
                ? <IconCheck size={16} className="text-success" />
                : <IconAlertCircle size={16} className="text-warning" />
              }
              <span className="fw-semibold small">
                {settings?.aiConfigured ? 'AI configured' : 'AI not configured — AI features will be hidden'}
              </span>
              {settings?.aiConfigured && settings.geminiModel && (
                <span className="text-secondary small ms-1">· using <code>{settings.geminiModel}</code></span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Settings form */}
      <div className="col-12">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title mb-0">
              <IconSparkles size={16} className="me-2" />
              Gemini API configuration
            </h3>
          </div>
          <div className="card-body">
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label fw-semibold">
                    Gemini API Key
                    <span className="text-secondary ms-1 fw-normal small">(leave blank to keep existing)</span>
                  </label>
                  <div className="input-group">
                    <input
                      type={showKey ? 'text' : 'password'}
                      className="form-control font-monospace"
                      placeholder={settings?.geminiApiKeySet ? 'Enter new key to replace' : 'AIza…'}
                      {...form.register('geminiApiKey')}
                    />
                    <button type="button" className="btn btn-outline-secondary" onClick={() => setShowKey((v) => !v)}>
                      {showKey ? <IconEyeOff size={14} /> : <IconEye size={14} />}
                    </button>
                  </div>
                  <div className="form-hint">
                    Your Google Gemini API key (starts with <code>AIza…</code>). Get one at{' '}
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">
                      aistudio.google.com <IconExternalLink size={10} />
                    </a>.
                  </div>
                </div>

                <div className="col-md-8">
                  <label className="form-label fw-semibold">Model</label>
                  <select className="form-select" {...form.register('geminiModel')}>
                    {GEMINI_MODELS.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  <div className="form-hint">
                    <strong>Gemini 3 Flash Preview</strong> is the recommended default — fast, cost-effective, and currently supported by Google.
                    Choose <strong>Gemini 3.1 Pro Preview</strong> for the highest quality reasoning, or <strong>3.1 Flash Lite Preview</strong> for the lightest/cheapest option.
                    Older Gemini 2.x and 1.x models are listed for backwards compatibility but may be deprecated by Google.
                    See <a href="https://ai.google.dev/gemini-api/docs/models" target="_blank" rel="noopener noreferrer">model docs <IconExternalLink size={10} /></a> for full details.
                  </div>
                </div>

                <div className="col-12 pt-1">
                  <button className="btn btn-primary" type="submit" disabled={updateSettings.isPending}>
                    {updateSettings.isPending ? 'Saving…' : 'Save AI settings'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Debug logs */}
      <div className="col-12">
        <AiDebugLogsPanel />
      </div>
    </div>
  );
};

// ── AI debug logs panel ────────────────────────────────────────────────────────
const AiDebugLogsPanel = () => {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const { data: logs, isLoading, refetch, isFetching } = useAdminAiLogs(true, autoRefresh ? 5000 : 0);
  const clearLogs = useClearAdminAiLogs();

  const toggle = (id: string) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const statusBadge = (status: AiDebugLogEntry['status']) => {
    if (status === 'success') return <span className="badge bg-success-lt">success</span>;
    if (status === 'unconfigured') return <span className="badge bg-warning-lt">unconfigured</span>;
    return <span className="badge bg-danger-lt">error</span>;
  };

  const renderJson = (value: unknown): string => {
    if (value === undefined || value === null) return '';
    if (typeof value === 'string') return value;
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  };

  return (
    <div className="card">
      <div className="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
        <h3 className="card-title mb-0">
          <IconAlertCircle size={16} className="me-2" />
          AI Debug Logs
          <span className="text-secondary fw-normal small ms-2">
            (last {logs?.length ?? 0} call{logs?.length === 1 ? '' : 's'}, in-memory only)
          </span>
        </h3>
        <div className="d-flex gap-2 align-items-center">
          <label className="form-check form-switch m-0 small">
            <input
              type="checkbox"
              className="form-check-input"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            <span className="form-check-label">Auto-refresh</span>
          </label>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={() => void refetch()}
            disabled={isFetching}
          >
            {isFetching ? 'Refreshing…' : 'Refresh'}
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-danger"
            onClick={() => {
              clearLogs.mutate(undefined, {
                onSuccess: () => toast.success('AI debug logs cleared'),
                onError: (err: Error) => toast.error(err.message),
              });
            }}
            disabled={clearLogs.isPending || !logs?.length}
          >
            {clearLogs.isPending ? 'Clearing…' : 'Clear'}
          </button>
        </div>
      </div>
      <div className="card-body">
        <p className="text-secondary small mb-3">
          Every AI suggestion request is captured here, including the prompts sent to Gemini, the raw response, and any error returned by the model or SDK.
          Use this to diagnose <strong>“AI suggestion failed”</strong> errors. Logs live only in the running server's memory and are wiped on restart.
        </p>
        {isLoading && <div className="text-secondary py-2">Loading logs…</div>}
        {!isLoading && (!logs || logs.length === 0) && (
          <div className="empty py-3">
            <p className="empty-title h5">No AI calls yet</p>
            <p className="empty-subtitle text-secondary">
              Click an <strong>✨ AI Suggest</strong> button anywhere in the app and the request will be captured here.
            </p>
          </div>
        )}
        {logs && logs.length > 0 && (
          <div className="d-flex flex-column gap-2">
            {logs.map((log) => {
              const isOpen = !!expanded[log.id];
              return (
                <div key={log.id} className="border rounded">
                  <button
                    type="button"
                    className="btn btn-link text-decoration-none w-100 text-start p-2"
                    onClick={() => toggle(log.id)}
                  >
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      {statusBadge(log.status)}
                      <code className="small">{log.endpoint}</code>
                      {log.model && <span className="text-secondary small">· <code>{log.model}</code></span>}
                      <span className="text-secondary small">· {log.durationMs} ms</span>
                      <span className="text-secondary small ms-auto">{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    {log.error && (
                      <div className="text-danger small mt-1">
                        {log.error.name ? `${log.error.name}: ` : ''}{log.error.message}
                      </div>
                    )}
                  </button>
                  {isOpen && (
                    <div className="border-top p-3 bg-light-subtle">
                      <dl className="row g-2 small mb-0">
                        {log.userEmail && (
                          <>
                            <dt className="col-sm-3 text-secondary">User</dt>
                            <dd className="col-sm-9 mb-0">{log.userEmail}{log.userId ? ` (${log.userId})` : ''}</dd>
                          </>
                        )}
                        {log.notes && log.notes.length > 0 && (
                          <>
                            <dt className="col-sm-3 text-secondary">Notes</dt>
                            <dd className="col-sm-9 mb-0">
                              <ul className="mb-0 ps-3">
                                {log.notes.map((n, i) => (<li key={i}>{n}</li>))}
                              </ul>
                            </dd>
                          </>
                        )}
                        {log.request?.params && Object.keys(log.request.params).length > 0 && (
                          <>
                            <dt className="col-sm-3 text-secondary">URL params</dt>
                            <dd className="col-sm-9 mb-0"><pre className="mb-0 small">{renderJson(log.request.params)}</pre></dd>
                          </>
                        )}
                        {log.request?.body !== undefined && (
                          <>
                            <dt className="col-sm-3 text-secondary">Request body</dt>
                            <dd className="col-sm-9 mb-0"><pre className="mb-0 small">{renderJson(log.request.body)}</pre></dd>
                          </>
                        )}
                        {log.request?.systemPrompt && (
                          <>
                            <dt className="col-sm-3 text-secondary">System prompt</dt>
                            <dd className="col-sm-9 mb-0">
                              <pre className="mb-0 small" style={{ maxHeight: 200, overflow: 'auto', whiteSpace: 'pre-wrap' }}>
                                {log.request.systemPrompt}
                              </pre>
                            </dd>
                          </>
                        )}
                        {log.request?.userPrompt && (
                          <>
                            <dt className="col-sm-3 text-secondary">User prompt</dt>
                            <dd className="col-sm-9 mb-0">
                              <pre className="mb-0 small" style={{ maxHeight: 200, overflow: 'auto', whiteSpace: 'pre-wrap' }}>
                                {log.request.userPrompt}
                              </pre>
                            </dd>
                          </>
                        )}
                        {log.rawResponse && (
                          <>
                            <dt className="col-sm-3 text-secondary">Raw model response</dt>
                            <dd className="col-sm-9 mb-0">
                              <pre className="mb-0 small" style={{ maxHeight: 200, overflow: 'auto', whiteSpace: 'pre-wrap' }}>
                                {log.rawResponse}
                              </pre>
                            </dd>
                          </>
                        )}
                        {log.parsedResponse !== undefined && (
                          <>
                            <dt className="col-sm-3 text-secondary">Parsed result</dt>
                            <dd className="col-sm-9 mb-0">
                              <pre className="mb-0 small" style={{ maxHeight: 200, overflow: 'auto' }}>
                                {renderJson(log.parsedResponse)}
                              </pre>
                            </dd>
                          </>
                        )}
                        {log.error && (
                          <>
                            <dt className="col-sm-3 text-secondary">Error</dt>
                            <dd className="col-sm-9 mb-0">
                              <pre className="mb-0 small text-danger" style={{ maxHeight: 300, overflow: 'auto', whiteSpace: 'pre-wrap' }}>
                                {(log.error.name ? `${log.error.name}: ` : '') + log.error.message}
                                {log.error.stack ? `\n\n${log.error.stack}` : ''}
                                {log.error.detail ? `\n\nDetail:\n${renderJson(log.error.detail)}` : ''}
                              </pre>
                            </dd>
                          </>
                        )}
                      </dl>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Integrations Settings panel ────────────────────────────────────────────────
const integrationsSettingsSchema = z.object({
  quickbooksClientId: z.string().optional(),
  quickbooksClientSecret: z.string().optional(),
  quickbooksRedirectUri: z.string().optional(),
  quickbooksSandbox: z.string().optional(),
  xeroClientId: z.string().optional(),
  xeroClientSecret: z.string().optional(),
  xeroRedirectUri: z.string().optional(),
});
type IntegrationsSettingsValues = z.infer<typeof integrationsSettingsSchema>;

const IntegrationsSettingsPanel = () => {
  const { data: settings, isLoading } = useAdminSettings();
  const updateSettings = useUpdateAdminSettings();
  const form = useForm<IntegrationsSettingsValues>({
    resolver: zodResolver(integrationsSettingsSchema),
    defaultValues: {
      quickbooksClientId: '',
      quickbooksClientSecret: '',
      quickbooksRedirectUri: '',
      quickbooksSandbox: 'true',
      xeroClientId: '',
      xeroClientSecret: '',
      xeroRedirectUri: '',
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        quickbooksClientId: settings.quickbooksClientId ?? '',
        quickbooksClientSecret: '',
        quickbooksRedirectUri: settings.quickbooksRedirectUri ?? '',
        quickbooksSandbox: settings.quickbooksSandbox ? 'true' : 'false',
        xeroClientId: settings.xeroClientId ?? '',
        xeroClientSecret: '',
        xeroRedirectUri: settings.xeroRedirectUri ?? '',
      });
    }
  }, [settings, form]);

  const onSubmit = (values: IntegrationsSettingsValues) => {
    const payload: Partial<IntegrationsSettingsValues> = { ...values };
    if (!payload.quickbooksClientSecret?.trim()) delete payload.quickbooksClientSecret;
    if (!payload.xeroClientSecret?.trim()) delete payload.xeroClientSecret;
    updateSettings.mutate(payload as Record<string, string>, {
      onSuccess: () => toast.success('Integrations settings saved'),
      onError: (err: Error) => toast.error(err.message),
    });
    form.setValue('quickbooksClientSecret', '');
    form.setValue('xeroClientSecret', '');
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="row row-cards">
      {/* QuickBooks */}
      <div className="col-12">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">QuickBooks Online Integration</h3>
          </div>
          <div className="card-body">
            <div className="alert alert-info mb-3">
              <h4 className="alert-heading h6 mb-2">How to set up QuickBooks integration</h4>
              <ol className="mb-0 ps-3">
                <li>Go to <a href="https://developer.intuit.com/app/developer/myapps" target="_blank" rel="noreferrer" className="alert-link">developer.intuit.com</a> and create an app.</li>
                <li>Select <strong>Accounting</strong> scope.</li>
                <li>Copy the <strong>Client ID</strong> and <strong>Client Secret</strong> from "Keys &amp; credentials".</li>
                <li>Add your Redirect URI (e.g. <code>https://yourdomain.com/api/integrations/quickbooks/callback</code>) to the app's allowed redirect URIs.</li>
                <li>Use <strong>Sandbox</strong> mode for testing, then switch to <strong>Production</strong> once ready.</li>
              </ol>
            </div>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Client ID</label>
                  <input className="form-control" placeholder="AB..." {...form.register('quickbooksClientId')} />
                  <div className="form-hint">From Intuit Developer → Your App → Keys &amp; Credentials</div>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Client Secret</label>
                  <input className="form-control" type="password" placeholder={settings?.quickbooksClientSecretSet ? 'Enter new secret to replace' : 'Paste secret…'} {...form.register('quickbooksClientSecret')} />
                  <div className="form-hint">From Intuit Developer → Your App → Keys &amp; Credentials</div>
                </div>
                <div className="col-md-8">
                  <label className="form-label">Redirect URI</label>
                  <input className="form-control" placeholder="https://yourdomain.com/api/integrations/quickbooks/callback" {...form.register('quickbooksRedirectUri')} />
                  <div className="form-hint">Must match exactly what you entered in the Intuit Developer portal</div>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Mode</label>
                  <select className="form-select" {...form.register('quickbooksSandbox')}>
                    <option value="true">Sandbox (testing)</option>
                    <option value="false">Production (live)</option>
                  </select>
                </div>
                <div className="col-12">
                  <button className="btn btn-primary" type="submit" disabled={updateSettings.isPending}>
                    {updateSettings.isPending ? 'Saving…' : 'Save QuickBooks settings'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Xero */}
      <div className="col-12">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Xero Integration</h3>
          </div>
          <div className="card-body">
            <div className="alert alert-info mb-3">
              <h4 className="alert-heading h6 mb-2">How to set up Xero integration</h4>
              <ol className="mb-0 ps-3">
                <li>Go to <a href="https://developer.xero.com/app/manage" target="_blank" rel="noreferrer" className="alert-link">developer.xero.com</a> and create a new app.</li>
                <li>Set the integration type to <strong>Web App</strong>.</li>
                <li>Add your Redirect URI (e.g. <code>https://yourdomain.com/api/integrations/xero/callback</code>).</li>
                <li>Copy the <strong>Client ID</strong> and <strong>Client Secret</strong> from the app configuration.</li>
                <li>Ensure the scopes include <code>accounting.transactions</code> and <code>accounting.contacts</code>.</li>
              </ol>
            </div>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Client ID</label>
                  <input className="form-control" placeholder="XXXXXXXX-..." {...form.register('xeroClientId')} />
                  <div className="form-hint">From Xero Developer → Your App → App Credentials</div>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Client Secret</label>
                  <input className="form-control" type="password" placeholder={settings?.xeroClientSecretSet ? 'Enter new secret to replace' : 'Paste secret…'} {...form.register('xeroClientSecret')} />
                  <div className="form-hint">From Xero Developer → Your App → App Credentials</div>
                </div>
                <div className="col-md-8">
                  <label className="form-label">Redirect URI</label>
                  <input className="form-control" placeholder="https://yourdomain.com/api/integrations/xero/callback" {...form.register('xeroRedirectUri')} />
                  <div className="form-hint">Must match exactly what you entered in the Xero Developer portal</div>
                </div>
                <div className="col-12">
                  <button className="btn btn-primary" type="submit" disabled={updateSettings.isPending}>
                    {updateSettings.isPending ? 'Saving…' : 'Save Xero settings'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main page ──────────────────────────────────────────────────────────────────
export const AdminPage = () => {
  const { user: currentUser } = useAuth();
  const { data: users = [], isLoading, isError, error } = useAdminUsers();
  const deleteUser = useAdminDeleteUser();

  const [tab, setTab] = useState<'dashboard' | 'users' | 'settings' | 'email' | 'ai' | 'integrations' | 'sales'>('dashboard');
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  if (isLoading && tab === 'users') return <TableSkeleton rows={6} columns={5} />;
  if (isError && tab === 'users') return <ApiErrorAlert error={(error as Error).message} />;

  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.plan === 'admin').length;
  const customerCount = users.filter((u) => u.plan !== 'admin').length;

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteUser.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success('User deleted');
        setDeleteTarget(null);
      },
      onError: (err: Error) => {
        toast.error(err.message);
        setDeleteTarget(null);
      },
    });
  };

  return (
    <>
      {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} />}
      {editTarget && <EditUserModal user={editTarget} onClose={() => setEditTarget(null)} />}
      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete user"
        body={`Are you sure you want to permanently delete ${deleteTarget?.fullName} (${deleteTarget?.email})? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />

      {/* Tabs */}
      <div className="card mb-4">
        <div className="card-header">
          <ul className="nav nav-tabs card-header-tabs">
            <li className="nav-item">
              <button
                className={`nav-link ${tab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setTab('dashboard')}
              >
                <IconChartBar size={15} className="me-1" />
                Dashboard
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${tab === 'users' ? 'active' : ''}`}
                onClick={() => setTab('users')}
              >
                <IconUsers size={15} className="me-1" />
                Users
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${tab === 'settings' ? 'active' : ''}`}
                onClick={() => setTab('settings')}
              >
                <IconSettings size={15} className="me-1" />
                Stripe / Billing
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${tab === 'email' ? 'active' : ''}`}
                onClick={() => setTab('email')}
              >
                <IconMail size={15} className="me-1" />
                Email / SMTP
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${tab === 'ai' ? 'active' : ''}`}
                onClick={() => setTab('ai')}
              >
                <IconSparkles size={15} className="me-1" />
                AI
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${tab === 'sales' ? 'active' : ''}`}
                onClick={() => setTab('sales')}
              >
                <IconTargetArrow size={15} className="me-1" />
                Sales
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${tab === 'integrations' ? 'active' : ''}`}
                onClick={() => setTab('integrations')}
              >
                <IconExternalLink size={15} className="me-1" />
                Integrations
              </button>
            </li>
          </ul>
        </div>
      </div>

      {tab === 'dashboard' && <DashboardPanel />}

      {tab === 'settings' && <StripeSettingsPanel />}

      {tab === 'email' && <EmailSettingsPanel />}

      {tab === 'ai' && <AiSettingsPanel />}

      {tab === 'integrations' && <IntegrationsSettingsPanel />}

      {tab === 'sales' && <SalesPanel />}

      {tab === 'users' && (
        <>
          {/* Stats row */}
          <div className="row g-3 mb-4">
            <div className="col-sm-4">
              <div className="card card-sm">
                <div className="card-body">
                  <div className="row align-items-center">
                    <div className="col-auto">
                      <span className="bg-primary text-white avatar"><IconUsers size={18} /></span>
                    </div>
                    <div className="col">
                      <div className="font-weight-medium">{totalUsers} Total users</div>
                      <div className="text-secondary small">All accounts</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-sm-4">
              <div className="card card-sm">
                <div className="card-body">
                  <div className="row align-items-center">
                    <div className="col-auto">
                      <span className="bg-red text-white avatar"><IconShieldLock size={18} /></span>
                    </div>
                    <div className="col">
                      <div className="font-weight-medium">{adminCount} Admin{adminCount !== 1 ? 's' : ''}</div>
                      <div className="text-secondary small">Platform admins</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-sm-4">
              <div className="card card-sm">
                <div className="card-body">
                  <div className="row align-items-center">
                    <div className="col-auto">
                      <span className="bg-green text-white avatar"><IconUser size={18} /></span>
                    </div>
                    <div className="col">
                      <div className="font-weight-medium">{customerCount} Customer{customerCount !== 1 ? 's' : ''}</div>
                      <div className="text-secondary small">Starter / Pro / Team</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Users table */}
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h3 className="card-title mb-0">
                <IconUsers size={18} className="me-2 text-primary" />
                User management
              </h3>
              <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
                <IconPlus size={16} className="me-1" />
                New user
              </button>
            </div>
            <div className="table-responsive">
              <table className="table table-vcenter card-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Company</th>
                    <th>Plan / role</th>
                    <th>Joined</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center text-secondary py-4">No users found</td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id}>
                        <td className="fw-semibold">{u.fullName}</td>
                        <td className="text-secondary">{u.email}</td>
                        <td>{u.companyName ?? <span className="text-secondary">—</span>}</td>
                        <td>
                          <span className={`badge ${planBadgeClass[u.plan] ?? 'bg-secondary-lt'} text-capitalize`}>
                            {u.plan}
                          </span>
                        </td>
                        <td className="text-secondary">{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div className="btn-list flex-nowrap">
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => setEditTarget(u)}
                              title="Edit user"
                            >
                              <IconEdit size={14} />
                            </button>
                            {u.id !== currentUser?.id && (
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => setDeleteTarget(u)}
                                title="Delete user"
                              >
                                <IconTrash size={14} />
                              </button>
                            )}
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
      )}
    </>
  );
};

