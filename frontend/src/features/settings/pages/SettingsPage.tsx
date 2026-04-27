import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { z } from 'zod';
import { IconAlertCircle, IconCheck, IconCrown } from '@tabler/icons-react';
import { useAuthStore } from '../../../store/authStore';
import { updateCurrentUser, uploadCurrentUserLogo } from '../../../api/users';
import { createBillingPortalSession, createCheckoutSession, getBillingStatus } from '../../../api/dashboard';

const profileSchema = z.object({
  name: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
});

const companySchema = z.object({
  companyName: z.string().min(1, 'Required'),
  address: z.string().optional(),
  defaultVatRate: z.coerce.number().min(0).max(100),
  defaultQuoteValidityDays: z.coerce.number().min(1),
});

type ProfileValues = z.infer<typeof profileSchema>;
type CompanyValues = z.infer<typeof companySchema>;

const planBadge: Record<string, string> = {
  starter: 'bg-secondary-lt',
  pro: 'bg-blue-lt',
  team: 'bg-indigo-lt',
  admin: 'bg-red-lt',
};

export const SettingsPage = () => {
  const [tab, setTab] = useState<'profile' | 'company' | 'billing'>('profile');
  const user = useAuthStore((state) => state.user);
  const setAuth = useAuthStore((state) => state.setAuth);
  const session = useAuthStore((state) => state.session);

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name ?? '',
      email: user?.email ?? '',
      currentPassword: '',
      newPassword: '',
    },
  });

  const companyForm = useForm<CompanyValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      companyName: user?.companyName ?? '',
      address: '',
      defaultVatRate: 20,
      defaultQuoteValidityDays: 14,
    },
  });

  const profileMutation = useMutation({
    mutationFn: updateCurrentUser,
    onSuccess: (updatedUser) => {
      if (session) {
        setAuth(updatedUser, session);
      }
      toast.success('Profile updated');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const companyMutation = useMutation({
    mutationFn: updateCurrentUser,
    onSuccess: (updatedUser) => {
      if (session) {
        setAuth(updatedUser, session);
      }
      toast.success('Company settings saved');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const uploadLogoMutation = useMutation({
    mutationFn: uploadCurrentUserLogo,
    onSuccess: (updatedUser) => {
      if (session) {
        setAuth(updatedUser, session);
      }
      toast.success('Logo uploaded');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const checkoutMutation = useMutation({
    mutationFn: (planTier: 'pro' | 'team') => createCheckoutSession(planTier),
    onSuccess: (result) => {
      window.location.assign(result.url);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const portalMutation = useMutation({
    mutationFn: createBillingPortalSession,
    onSuccess: (result) => {
      window.location.assign(result.url);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const { data: billingStatus } = useQuery({
    queryKey: ['billing', 'status'],
    queryFn: getBillingStatus,
    enabled: tab === 'billing',
  });

  const handleLogoUpload = (file: File | null) => {
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      toast.error('Logo must be jpg, png, or webp.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Logo must be 5MB or smaller.');
      return;
    }
    uploadLogoMutation.mutate(file);
  };

  const currentPlan = user?.plan ?? 'starter';
  const isPaid = currentPlan === 'pro' || currentPlan === 'team';

  return (
    <div className="card">
      <div className="card-header">
        <ul className="nav nav-tabs card-header-tabs">
          <li className="nav-item"><button className={`nav-link ${tab === 'profile' ? 'active' : ''}`} onClick={() => setTab('profile')}>Profile</button></li>
          <li className="nav-item"><button className={`nav-link ${tab === 'company' ? 'active' : ''}`} onClick={() => setTab('company')}>Company</button></li>
          <li className="nav-item"><button className={`nav-link ${tab === 'billing' ? 'active' : ''}`} onClick={() => setTab('billing')}>Billing</button></li>
        </ul>
      </div>
      <div className="card-body">
        {tab === 'profile' ? (
          <form
            onSubmit={profileForm.handleSubmit((values) => {
              profileMutation.mutate({
                name: values.name,
                email: values.email,
                currentPassword: values.currentPassword || null,
                newPassword: values.newPassword || null,
              });
            })}
            className="row g-3"
          >
            <div className="col-md-6">
              <label className="form-label">Name</label>
              <input className="form-control" {...profileForm.register('name')} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Email</label>
              <input className="form-control" {...profileForm.register('email')} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Current password</label>
              <input type="password" className="form-control" {...profileForm.register('currentPassword')} />
            </div>
            <div className="col-md-6">
              <label className="form-label">New password</label>
              <input type="password" className="form-control" {...profileForm.register('newPassword')} />
            </div>
            <div className="col-12"><button className="btn btn-primary">Save profile</button></div>
          </form>
        ) : null}

        {tab === 'company' ? (
          <form
            onSubmit={companyForm.handleSubmit((values) => {
              companyMutation.mutate({
                companyName: values.companyName,
                address: values.address ?? null,
                defaultVatRate: values.defaultVatRate,
                defaultQuoteValidityDays: values.defaultQuoteValidityDays,
              });
            })}
            className="row g-3"
          >
            <div className="col-md-6">
              <label className="form-label">Company name</label>
              <input className="form-control" {...companyForm.register('companyName')} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Address</label>
              <input className="form-control" {...companyForm.register('address')} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Company logo</label>
              <input
                className="form-control"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => handleLogoUpload(event.target.files?.[0] ?? null)}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Default VAT rate</label>
              <input className="form-control" type="number" step="0.1" {...companyForm.register('defaultVatRate')} />
            </div>
            <div className="col-md-3">
              <label className="form-label">Quote validity days</label>
              <input className="form-control" type="number" {...companyForm.register('defaultQuoteValidityDays')} />
            </div>
            <div className="col-12"><button className="btn btn-primary">Save company settings</button></div>
          </form>
        ) : null}

        {tab === 'billing' ? (
          <div>
            {/* Current plan */}
            <div className="mb-4">
              <div className="d-flex align-items-center gap-2 mb-1">
                <span className={`badge text-capitalize ${planBadge[currentPlan] ?? 'bg-secondary-lt'}`}>
                  {currentPlan} plan
                </span>
                {isPaid && <IconCrown size={16} className="text-warning" />}
              </div>
              {user?.subscriptionEndsAt && (
                <div className="text-secondary small">
                  Renews / expires: {new Date(user.subscriptionEndsAt).toLocaleDateString()}
                </div>
              )}
            </div>

            {/* Billing not configured */}
            {billingStatus && !billingStatus.configured && (
              <div className="alert alert-warning d-flex align-items-center gap-2">
                <IconAlertCircle size={18} />
                <span>Billing is not configured yet. Please ask your administrator to set up Stripe in the Admin console.</span>
              </div>
            )}

            {/* Active subscriber — manage subscription */}
            {billingStatus?.configured && isPaid && (
              <div>
                <p className="text-secondary mb-3">You have an active subscription. Use the button below to change your plan, update payment details, or cancel.</p>
                <button
                  className="btn btn-primary"
                  onClick={() => portalMutation.mutate()}
                  disabled={portalMutation.isPending}
                >
                  {portalMutation.isPending ? 'Redirecting…' : 'Manage subscription'}
                </button>
              </div>
            )}

            {/* Starter — show plan cards */}
            {billingStatus?.configured && !isPaid && (
              <div className="row g-3">
                {billingStatus.hasProPlan && (
                  <div className="col-md-6">
                    <div className="card border-primary">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h3 className="card-title mb-0">Pro</h3>
                          <span className="badge bg-blue-lt">Most popular</span>
                        </div>
                        <p className="text-secondary small mb-3">Perfect for growing trade businesses.</p>
                        <ul className="list-unstyled small mb-3">
                          {['Unlimited jobs & quotes', 'PDF generation', 'Email sending', 'Priority support'].map((f) => (
                            <li key={f} className="d-flex align-items-center gap-1 mb-1">
                              <IconCheck size={14} className="text-success flex-shrink-0" />{f}
                            </li>
                          ))}
                        </ul>
                        <button
                          className="btn btn-primary w-100"
                          onClick={() => checkoutMutation.mutate('pro')}
                          disabled={checkoutMutation.isPending}
                        >
                          {checkoutMutation.isPending ? 'Redirecting…' : 'Upgrade to Pro'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {billingStatus.hasTeamPlan && (
                  <div className="col-md-6">
                    <div className="card border-indigo">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h3 className="card-title mb-0">Team</h3>
                          <span className="badge bg-indigo-lt">Multi-user</span>
                        </div>
                        <p className="text-secondary small mb-3">Everything in Pro, plus team features.</p>
                        <ul className="list-unstyled small mb-3">
                          {['Everything in Pro', 'Multiple team members', 'Role-based access', 'Dedicated support'].map((f) => (
                            <li key={f} className="d-flex align-items-center gap-1 mb-1">
                              <IconCheck size={14} className="text-success flex-shrink-0" />{f}
                            </li>
                          ))}
                        </ul>
                        <button
                          className="btn btn-outline-indigo w-100"
                          onClick={() => checkoutMutation.mutate('team')}
                          disabled={checkoutMutation.isPending}
                        >
                          {checkoutMutation.isPending ? 'Redirecting…' : 'Upgrade to Team'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {!billingStatus.hasProPlan && !billingStatus.hasTeamPlan && (
                  <div className="col-12">
                    <div className="alert alert-warning d-flex align-items-center gap-2">
                      <IconAlertCircle size={18} />
                      <span>No billing plans have been configured yet. Ask your administrator to add plan Price IDs in the Admin console.</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};

