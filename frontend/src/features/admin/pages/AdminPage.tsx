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
import {
  useAdminCreateUser,
  useAdminDeleteUser,
  useAdminSettings,
  useAdminStats,
  useAdminUpdateUser,
  useAdminUsers,
  useTestEmail,
  useUpdateAdminSettings,
} from '../hooks/useAdminUsers';

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
  stripeWebhookSecret: z.string().optional(),
  stripeStarterMonthlyPriceId: z.string().optional(),
  stripeStarterAnnualPriceId: z.string().optional(),
  stripeProfessionalMonthlyPriceId: z.string().optional(),
  stripeProfessionalAnnualPriceId: z.string().optional(),
  stripeBusinessMonthlyPriceId: z.string().optional(),
  stripeBusinessAnnualPriceId: z.string().optional(),
});

const emailSettingsSchema = z.object({
  smtpHost: z.string().optional(),
  smtpPort: z.string().optional(),
  smtpSecure: z.boolean().optional(),
  smtpUser: z.string().optional(),
  smtpPassword: z.string().optional(),
  smtpFromEmail: z.string().optional(),
  smtpFromName: z.string().optional(),
  testEmailTo: z.string().optional(),
});

type CreateValues = z.infer<typeof createSchema>;
type EditValues = z.infer<typeof editSchema>;
type StripeSettingsValues = z.infer<typeof stripeSettingsSchema>;
type EmailSettingsValues = z.infer<typeof emailSettingsSchema>;

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

  const form = useForm<StripeSettingsValues>({
    resolver: zodResolver(stripeSettingsSchema),
    defaultValues: {
      stripeApiKey: '',
      stripeWebhookSecret: '',
      stripeStarterMonthlyPriceId: '',
      stripeStarterAnnualPriceId: '',
      stripeProfessionalMonthlyPriceId: '',
      stripeProfessionalAnnualPriceId: '',
      stripeBusinessMonthlyPriceId: '',
      stripeBusinessAnnualPriceId: '',
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        stripeApiKey: '',
        stripeWebhookSecret: '',
        stripeStarterMonthlyPriceId: settings.stripeStarterMonthlyPriceId ?? '',
        stripeStarterAnnualPriceId: settings.stripeStarterAnnualPriceId ?? '',
        stripeProfessionalMonthlyPriceId: settings.stripeProfessionalMonthlyPriceId ?? '',
        stripeProfessionalAnnualPriceId: settings.stripeProfessionalAnnualPriceId ?? '',
        stripeBusinessMonthlyPriceId: settings.stripeBusinessMonthlyPriceId ?? '',
        stripeBusinessAnnualPriceId: settings.stripeBusinessAnnualPriceId ?? '',
      });
    }
  }, [settings, form]);

  const onSubmit = (values: StripeSettingsValues) => {
    const payload: Record<string, string> = {};
    if (values.stripeApiKey?.trim()) payload.stripeApiKey = values.stripeApiKey.trim();
    if (values.stripeWebhookSecret?.trim()) payload.stripeWebhookSecret = values.stripeWebhookSecret.trim();
    if (values.stripeStarterMonthlyPriceId !== undefined) payload.stripeStarterMonthlyPriceId = values.stripeStarterMonthlyPriceId?.trim() ?? '';
    if (values.stripeStarterAnnualPriceId !== undefined) payload.stripeStarterAnnualPriceId = values.stripeStarterAnnualPriceId?.trim() ?? '';
    if (values.stripeProfessionalMonthlyPriceId !== undefined) payload.stripeProfessionalMonthlyPriceId = values.stripeProfessionalMonthlyPriceId?.trim() ?? '';
    if (values.stripeProfessionalAnnualPriceId !== undefined) payload.stripeProfessionalAnnualPriceId = values.stripeProfessionalAnnualPriceId?.trim() ?? '';
    if (values.stripeBusinessMonthlyPriceId !== undefined) payload.stripeBusinessMonthlyPriceId = values.stripeBusinessMonthlyPriceId?.trim() ?? '';
    if (values.stripeBusinessAnnualPriceId !== undefined) payload.stripeBusinessAnnualPriceId = values.stripeBusinessAnnualPriceId?.trim() ?? '';

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
    { label: 'API Key', set: settings?.stripeApiKeySet, value: settings?.stripeApiKey },
    { label: 'Webhook Secret', set: settings?.stripeWebhookSecretSet, value: settings?.stripeWebhookSecret },
    { label: 'Starter Monthly', set: Boolean(settings?.stripeStarterMonthlyPriceId), value: settings?.stripeStarterMonthlyPriceId },
    { label: 'Starter Annual', set: Boolean(settings?.stripeStarterAnnualPriceId), value: settings?.stripeStarterAnnualPriceId },
    { label: 'Professional Monthly', set: Boolean(settings?.stripeProfessionalMonthlyPriceId), value: settings?.stripeProfessionalMonthlyPriceId },
    { label: 'Professional Annual', set: Boolean(settings?.stripeProfessionalAnnualPriceId), value: settings?.stripeProfessionalAnnualPriceId },
    { label: 'Business Monthly', set: Boolean(settings?.stripeBusinessMonthlyPriceId), value: settings?.stripeBusinessMonthlyPriceId },
    { label: 'Business Annual', set: Boolean(settings?.stripeBusinessAnnualPriceId), value: settings?.stripeBusinessAnnualPriceId },
  ];

  return (
    <div className="row g-4">
      {/* Setup guide */}
      <div className="col-12">
        <div className="alert alert-info" role="alert">
          <div className="d-flex gap-2 align-items-start">
            <IconAlertCircle size={18} className="mt-1 flex-shrink-0" />
            <div>
              <h4 className="alert-heading h6 mb-2">What to configure in your Stripe Dashboard</h4>
              <ol className="mb-2 ps-3 small">
                <li>For each of your 3 products (<strong>Starter</strong>, <strong>Professional</strong>, <strong>Business</strong>), add <strong>two prices</strong>: one monthly, one annual. Copy each <strong>Price ID</strong> (starts with <code>price_</code>) below.</li>
                <li>The products already exist: <code>prod_UPX393kv3F2yh5</code> (Starter), <code>prod_UPX4C6Nne6bwPo</code> (Professional), <code>prod_UPX4oXqZn9sVuS</code> (Business).</li>
                <li>Go to <strong>Developers → Webhooks</strong> → <strong>Add endpoint</strong>: <code>{window.location.origin}/api/billing/webhook</code></li>
                <li>Select events: <code>checkout.session.completed</code>, <code>customer.subscription.updated</code>, <code>customer.subscription.deleted</code></li>
                <li>Reveal the <strong>Signing Secret</strong> (<code>whsec_…</code>) and paste it below.</li>
                <li>Go to <strong>Developers → API keys</strong>, copy your <strong>Secret key</strong> (<code>sk_…</code>) and paste it below.</li>
                <li>Enable the <strong>Customer Portal</strong> at <em>Billing → Customer portal</em>.</li>
              </ol>
              <p className="mb-0 small text-secondary">Use <code>sk_test_</code> / <code>whsec_test_</code> during development. Switch to <code>sk_live_</code> in production.</p>
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
              Update Stripe credentials
            </h3>
          </div>
          <div className="card-body">
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="row g-3">
                {/* Secrets */}
                <div className="col-md-6">
                  <label className="form-label">
                    Stripe Secret Key
                    <span className="text-secondary ms-1 small">(leave blank to keep existing)</span>
                  </label>
                  <div className="input-group">
                    <input
                      type={showKey ? 'text' : 'password'}
                      className="form-control font-monospace"
                      placeholder={settings?.stripeApiKeySet ? 'Enter new key to replace' : 'sk_live_... or sk_test_...'}
                      {...form.register('stripeApiKey')}
                    />
                    <button type="button" className="btn btn-outline-secondary" onClick={() => setShowKey((v) => !v)}>
                      {showKey ? <IconEyeOff size={14} /> : <IconEye size={14} />}
                    </button>
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="form-label">
                    Webhook Signing Secret
                    <span className="text-secondary ms-1 small">(leave blank to keep existing)</span>
                  </label>
                  <div className="input-group">
                    <input
                      type={showWebhookSecret ? 'text' : 'password'}
                      className="form-control font-monospace"
                      placeholder={settings?.stripeWebhookSecretSet ? 'Enter new secret to replace' : 'whsec_...'}
                      {...form.register('stripeWebhookSecret')}
                    />
                    <button type="button" className="btn btn-outline-secondary" onClick={() => setShowWebhookSecret((v) => !v)}>
                      {showWebhookSecret ? <IconEyeOff size={14} /> : <IconEye size={14} />}
                    </button>
                  </div>
                </div>

                {/* Price IDs — grouped by plan */}
                <div className="col-12"><hr className="my-1" /><p className="text-secondary small mb-0 fw-semibold">Starter — $14/mo · $9/mo billed annually</p></div>
                <div className="col-md-6">
                  <label className="form-label">Starter Monthly Price ID</label>
                  <input className="form-control font-monospace" placeholder="price_..." {...form.register('stripeStarterMonthlyPriceId')} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Starter Annual Price ID</label>
                  <input className="form-control font-monospace" placeholder="price_..." {...form.register('stripeStarterAnnualPriceId')} />
                </div>

                <div className="col-12"><hr className="my-1" /><p className="text-secondary small mb-0 fw-semibold">Professional — $29/mo · $24/mo billed annually</p></div>
                <div className="col-md-6">
                  <label className="form-label">Professional Monthly Price ID</label>
                  <input className="form-control font-monospace" placeholder="price_..." {...form.register('stripeProfessionalMonthlyPriceId')} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Professional Annual Price ID</label>
                  <input className="form-control font-monospace" placeholder="price_..." {...form.register('stripeProfessionalAnnualPriceId')} />
                </div>

                <div className="col-12"><hr className="my-1" /><p className="text-secondary small mb-0 fw-semibold">Business — $59/mo · $49/mo billed annually</p></div>
                <div className="col-md-6">
                  <label className="form-label">Business Monthly Price ID</label>
                  <input className="form-control font-monospace" placeholder="price_..." {...form.register('stripeBusinessMonthlyPriceId')} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Business Annual Price ID</label>
                  <input className="form-control font-monospace" placeholder="price_..." {...form.register('stripeBusinessAnnualPriceId')} />
                </div>

                <div className="col-12">
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
      smtpSecure: false,
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
        smtpSecure: settings.smtpSecure ?? false,
        smtpUser: settings.smtpUser ?? '',
        smtpPassword: '',
        smtpFromEmail: settings.smtpFromEmail ?? '',
        smtpFromName: settings.smtpFromName ?? '',
        testEmailTo: '',
      });
    }
  }, [settings, form]);

  const onSubmit = (values: EmailSettingsValues) => {
    const payload: Record<string, string | boolean> = {};
    if (values.smtpHost !== undefined) payload.smtpHost = values.smtpHost?.trim() ?? '';
    if (values.smtpPort !== undefined) payload.smtpPort = values.smtpPort?.trim() ?? '';
    if (values.smtpSecure !== undefined) payload.smtpSecure = values.smtpSecure;
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
      {/* Setup guide */}
      <div className="col-12">
        <div className="alert alert-info" role="alert">
          <div className="d-flex gap-2 align-items-start">
            <IconAlertCircle size={18} className="mt-1 flex-shrink-0" />
            <div>
              <h4 className="alert-heading h6 mb-2">Proton Mail SMTP settings</h4>
              <p className="mb-1 small">To send email via Proton Mail, use the following SMTP settings:</p>
              <ul className="mb-2 ps-3 small">
                <li><strong>Host:</strong> <code>smtp.protonmail.ch</code></li>
                <li><strong>Port:</strong> <code>587</code> (STARTTLS, recommended) or <code>465</code> (SSL/TLS — enable "Secure" below)</li>
                <li><strong>Username:</strong> your full Proton Mail address (e.g. <code>you@proton.me</code>)</li>
                <li><strong>Password:</strong> your <strong>Proton Mail Bridge password</strong> (not your account login). Get it from the Proton Mail Bridge app → Settings.</li>
                <li><strong>From email:</strong> same as your username</li>
              </ul>
              <p className="mb-0 small text-secondary">Enable "Secure (SSL/TLS)" only if using port 465. For port 587, leave it unchecked — the connection upgrades via STARTTLS automatically.</p>
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
                <div className="col-md-8">
                  <label className="form-label">SMTP Host</label>
                  <input
                    className="form-control font-monospace"
                    placeholder="smtp.protonmail.ch"
                    {...form.register('smtpHost')}
                  />
                </div>
                <div className="col-md-2">
                  <label className="form-label">Port</label>
                  <input
                    className="form-control font-monospace"
                    placeholder="587"
                    {...form.register('smtpPort')}
                  />
                </div>
                <div className="col-md-2 d-flex align-items-end">
                  <label className="form-check form-switch mb-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      role="switch"
                      {...form.register('smtpSecure')}
                    />
                    <span className="form-check-label">Secure (SSL/TLS)</span>
                  </label>
                </div>

                <div className="col-md-6">
                  <label className="form-label">SMTP Username</label>
                  <input
                    className="form-control"
                    placeholder="you@proton.me"
                    autoComplete="username"
                    {...form.register('smtpUser')}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">
                    SMTP Password
                    <span className="text-secondary ms-1 small">(leave blank to keep existing)</span>
                  </label>
                  <div className="input-group">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-control"
                      placeholder={settings?.smtpPasswordSet ? 'Enter new password to replace' : 'Proton Mail Bridge password'}
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
                </div>

                <div className="col-12"><hr className="my-1" /></div>

                <div className="col-md-6">
                  <label className="form-label">From Email</label>
                  <input
                    className="form-control"
                    placeholder="you@proton.me"
                    {...form.register('smtpFromEmail')}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">From Name</label>
                  <input
                    className="form-control"
                    placeholder="Jobrythm"
                    {...form.register('smtpFromName')}
                  />
                </div>

                <div className="col-12">
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
              Send a test email to verify your SMTP configuration is working.
              Leave the field blank to send to your own admin email.
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

// ── Main page ──────────────────────────────────────────────────────────────────
export const AdminPage = () => {
  const { user: currentUser } = useAuth();
  const { data: users = [], isLoading, isError, error } = useAdminUsers();
  const deleteUser = useAdminDeleteUser();

  const [tab, setTab] = useState<'dashboard' | 'users' | 'settings' | 'email'>('dashboard');
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
          </ul>
        </div>
      </div>

      {tab === 'dashboard' && <DashboardPanel />}

      {tab === 'settings' && <StripeSettingsPanel />}

      {tab === 'email' && <EmailSettingsPanel />}

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

