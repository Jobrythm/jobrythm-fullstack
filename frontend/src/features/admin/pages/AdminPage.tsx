import { zodResolver } from '@hookform/resolvers/zod';
import {
  IconCheck,
  IconEye,
  IconEyeOff,
  IconPlus,
  IconSettings,
  IconShieldLock,
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
import { useAuth } from '../../../hooks/useAuth';
import type { AdminUser, AdminUserPlan } from '../../../types';
import {
  useAdminCreateUser,
  useAdminDeleteUser,
  useAdminSettings,
  useAdminUpdateUser,
  useAdminUsers,
  useUpdateAdminSettings,
} from '../hooks/useAdminUsers';

const PLANS: AdminUserPlan[] = ['starter', 'pro', 'team', 'admin'];

const planBadgeClass: Record<AdminUserPlan, string> = {
  starter: 'bg-secondary-lt',
  pro: 'bg-blue-lt',
  team: 'bg-indigo-lt',
  admin: 'bg-red-lt',
};

const createSchema = z.object({
  fullName: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Minimum 8 characters'),
  companyName: z.string().optional(),
  plan: z.enum(['starter', 'pro', 'team', 'admin']),
});

const editSchema = z.object({
  fullName: z.string().min(1, 'Required'),
  companyName: z.string().optional(),
  plan: z.enum(['starter', 'pro', 'team', 'admin']),
});

const stripeSettingsSchema = z.object({
  stripeApiKey: z.string().optional(),
  stripeWebhookSecret: z.string().optional(),
  stripeProPriceId: z.string().optional(),
  stripeTeamPriceId: z.string().optional(),
});

type CreateValues = z.infer<typeof createSchema>;
type EditValues = z.infer<typeof editSchema>;
type StripeSettingsValues = z.infer<typeof stripeSettingsSchema>;

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
      stripeProPriceId: '',
      stripeTeamPriceId: '',
    },
  });

  // Pre-populate price IDs (not secrets) once settings load
  useEffect(() => {
    if (settings) {
      form.reset({
        stripeApiKey: '',
        stripeWebhookSecret: '',
        stripeProPriceId: settings.stripeProPriceId ?? '',
        stripeTeamPriceId: settings.stripeTeamPriceId ?? '',
      });
    }
  }, [settings, form]);

  const onSubmit = (values: StripeSettingsValues) => {
    const payload: Record<string, string> = {};
    if (values.stripeApiKey?.trim()) payload.stripeApiKey = values.stripeApiKey.trim();
    if (values.stripeWebhookSecret?.trim()) payload.stripeWebhookSecret = values.stripeWebhookSecret.trim();
    if (values.stripeProPriceId !== undefined) payload.stripeProPriceId = values.stripeProPriceId?.trim() ?? '';
    if (values.stripeTeamPriceId !== undefined) payload.stripeTeamPriceId = values.stripeTeamPriceId?.trim() ?? '';

    updateSettings.mutate(payload, {
      onSuccess: () => {
        toast.success('Stripe settings saved');
        form.reset({ stripeApiKey: '', stripeWebhookSecret: '' });
      },
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
              <h4 className="alert-heading h6 mb-2">What to create in your Stripe Dashboard</h4>
              <ol className="mb-2 ps-3 small">
                <li>Go to <strong>Products</strong> and create a product called <strong>"Jobrythm Pro"</strong> with a recurring monthly price. Copy the <strong>Price ID</strong> (starts with <code>price_</code>) into the Pro Price ID field below.</li>
                <li>Optionally create a second product called <strong>"Jobrythm Team"</strong> the same way and paste its Price ID into the Team Price ID field.</li>
                <li>Go to <strong>Developers → Webhooks</strong>, click <strong>Add endpoint</strong>, and enter: <code>{window.location.origin}/api/billing/webhook</code></li>
                <li>Under <em>Events to listen for</em>, select: <code>checkout.session.completed</code>, <code>customer.subscription.updated</code>, <code>customer.subscription.deleted</code></li>
                <li>After creating the webhook, reveal the <strong>Signing Secret</strong> (starts with <code>whsec_</code>) and paste it below.</li>
                <li>Go to <strong>Developers → API keys</strong>, copy your <strong>Secret key</strong> (starts with <code>sk_</code>) and paste it below.</li>
                <li>Enable the <strong>Customer Portal</strong> at <em>Billing → Customer portal</em> in your Stripe Dashboard.</li>
              </ol>
              <p className="mb-0 small text-secondary">Use <code>sk_test_</code> keys and <code>whsec_test_</code> secrets during development. Switch to <code>sk_live_</code> in production.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Current status */}
      <div className="col-12">
        <div className="row g-2">
          {[
            { label: 'Stripe API Key', set: settings?.stripeApiKeySet, value: settings?.stripeApiKey },
            { label: 'Webhook Secret', set: settings?.stripeWebhookSecretSet, value: settings?.stripeWebhookSecret },
            { label: 'Pro Price ID', set: settings?.stripeProPriceIdSet, value: settings?.stripeProPriceId },
            { label: 'Team Price ID', set: settings?.stripeTeamPriceIdSet, value: settings?.stripeTeamPriceId },
          ].map(({ label, set, value }) => (
            <div key={label} className="col-sm-6 col-md-3">
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
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowKey((v) => !v)}
                      title={showKey ? 'Hide' : 'Show'}
                    >
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
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowWebhookSecret((v) => !v)}
                      title={showWebhookSecret ? 'Hide' : 'Show'}
                    >
                      {showWebhookSecret ? <IconEyeOff size={14} /> : <IconEye size={14} />}
                    </button>
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Pro Plan Price ID</label>
                  <input
                    className="form-control font-monospace"
                    placeholder="price_..."
                    {...form.register('stripeProPriceId')}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">
                    Team Plan Price ID
                    <span className="text-secondary ms-1 small">(optional)</span>
                  </label>
                  <input
                    className="form-control font-monospace"
                    placeholder="price_..."
                    {...form.register('stripeTeamPriceId')}
                  />
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

// ── Main page ──────────────────────────────────────────────────────────────────
export const AdminPage = () => {
  const { user: currentUser } = useAuth();
  const { data: users = [], isLoading, isError, error } = useAdminUsers();
  const deleteUser = useAdminDeleteUser();

  const [tab, setTab] = useState<'users' | 'settings'>('users');
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
          </ul>
        </div>
      </div>

      {tab === 'settings' && <StripeSettingsPanel />}

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

