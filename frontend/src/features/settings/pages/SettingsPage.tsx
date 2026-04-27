import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { z } from 'zod';
import { IconAlertCircle, IconCheck, IconCrown, IconToggleLeft, IconToggleRight } from '@tabler/icons-react';
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
  professional: 'bg-blue-lt',
  business: 'bg-indigo-lt',
  admin: 'bg-red-lt',
};

const PLANS = [
  {
    tier: 'starter' as const,
    name: 'Starter',
    monthlyPrice: 14,
    annualPrice: 9,
    description: 'Perfect for solo traders & freelancers',
    users: '1 user',
    jobs: 'Up to 15 jobs',
    features: ['Up to 15 active jobs', 'Quotes & invoices', 'Client management', 'PDF export'],
    badge: null,
    color: 'secondary',
  },
  {
    tier: 'professional' as const,
    name: 'Professional',
    monthlyPrice: 29,
    annualPrice: 24,
    description: 'For small teams ready to scale',
    users: 'Up to 3 users',
    jobs: 'Unlimited jobs',
    features: ['Unlimited jobs', 'Up to 3 team members', 'Client portal', 'Priority support'],
    badge: 'Most popular',
    color: 'primary',
  },
  {
    tier: 'business' as const,
    name: 'Business',
    monthlyPrice: 59,
    annualPrice: 49,
    description: 'Growing businesses & larger teams',
    users: 'Up to 10 users',
    jobs: 'Unlimited jobs',
    features: ['Everything in Professional', 'Up to 10 team members', 'Team collaboration', 'API access'],
    badge: null,
    color: 'indigo',
  },
] as const;

export const SettingsPage = () => {
  const [tab, setTab] = useState<'profile' | 'company' | 'billing'>('profile');
  const [billingAnnual, setBillingAnnual] = useState(true);
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
      if (session) setAuth(updatedUser, session);
      toast.success('Profile updated');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const companyMutation = useMutation({
    mutationFn: updateCurrentUser,
    onSuccess: (updatedUser) => {
      if (session) setAuth(updatedUser, session);
      toast.success('Company settings saved');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const uploadLogoMutation = useMutation({
    mutationFn: uploadCurrentUserLogo,
    onSuccess: (updatedUser) => {
      if (session) setAuth(updatedUser, session);
      toast.success('Logo uploaded');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const checkoutMutation = useMutation({
    mutationFn: ({ planTier, billingPeriod }: { planTier: 'starter' | 'professional' | 'business'; billingPeriod: 'monthly' | 'annual' }) =>
      createCheckoutSession(planTier, billingPeriod),
    onSuccess: (result) => { window.location.assign(result.url); },
    onError: (error: Error) => toast.error(error.message),
  });

  const portalMutation = useMutation({
    mutationFn: createBillingPortalSession,
    onSuccess: (result) => { window.location.assign(result.url); },
    onError: (error: Error) => toast.error(error.message),
  });

  const { data: billingStatus } = useQuery({
    queryKey: ['billing', 'status'],
    queryFn: getBillingStatus,
    enabled: tab === 'billing',
  });

  const handleLogoUpload = (file: File | null) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
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
  const isPaid = currentPlan === 'professional' || currentPlan === 'business';
  const billingPeriod = billingAnnual ? 'annual' : 'monthly';

  // Does a given tier have a price configured for the selected period?
  const hasPriceFor = (tier: 'starter' | 'professional' | 'business') => {
    if (!billingStatus?.configured) return false;
    if (billingAnnual) {
      if (tier === 'starter') return billingStatus.starterAnnual;
      if (tier === 'professional') return billingStatus.professionalAnnual;
      return billingStatus.businessAnnual;
    }
    if (tier === 'starter') return billingStatus.starterMonthly;
    if (tier === 'professional') return billingStatus.professionalMonthly;
    return billingStatus.businessMonthly;
  };

  return (
    <div className="card">
      <div className="card-header">
        <ul className="nav nav-tabs card-header-tabs">
          <li className="nav-item">
            <button className={`nav-link ${tab === 'profile' ? 'active' : ''}`} onClick={() => setTab('profile')}>Profile</button>
          </li>
          <li className="nav-item">
            <button className={`nav-link ${tab === 'company' ? 'active' : ''}`} onClick={() => setTab('company')}>Company</button>
          </li>
          <li className="nav-item">
            <button className={`nav-link ${tab === 'billing' ? 'active' : ''}`} onClick={() => setTab('billing')}>Billing</button>
          </li>
        </ul>
      </div>
      <div className="card-body">
        {/* ── Profile tab ── */}
        {tab === 'profile' && (
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
            <div className="col-12">
              <button className="btn btn-primary" disabled={profileMutation.isPending}>
                {profileMutation.isPending ? 'Saving…' : 'Save profile'}
              </button>
            </div>
          </form>
        )}

        {/* ── Company tab ── */}
        {tab === 'company' && (
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
                onChange={(e) => handleLogoUpload(e.target.files?.[0] ?? null)}
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
            <div className="col-12">
              <button className="btn btn-primary" disabled={companyMutation.isPending}>
                {companyMutation.isPending ? 'Saving…' : 'Save company settings'}
              </button>
            </div>
          </form>
        )}

        {/* ── Billing tab ── */}
        {tab === 'billing' && (
          <div>
            {/* Current plan header */}
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
                <span>Billing is not configured yet. Ask your administrator to set up Stripe in the Admin console.</span>
              </div>
            )}

            {/* Manage existing subscription */}
            {billingStatus?.configured && isPaid && (
              <div className="mb-4">
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

            {/* Plan cards */}
            {billingStatus?.configured && !isPaid && (
              <>
                {/* Billing period toggle */}
                <div className="d-flex align-items-center justify-content-center gap-3 mb-4">
                  <span className={`fw-semibold ${!billingAnnual ? 'text-body' : 'text-secondary'}`}>Monthly</span>
                  <button
                    type="button"
                    className="btn btn-ghost-secondary p-0 border-0 lh-1"
                    onClick={() => setBillingAnnual((v) => !v)}
                    aria-label="Toggle billing period"
                  >
                    {billingAnnual
                      ? <IconToggleRight size={36} className="text-primary" />
                      : <IconToggleLeft size={36} className="text-secondary" />
                    }
                  </button>
                  <span className={`fw-semibold ${billingAnnual ? 'text-body' : 'text-secondary'}`}>
                    Annual
                    <span className="badge bg-green-lt ms-2 text-green fw-normal">Save up to 36%</span>
                  </span>
                </div>

                {/* Three plan cards */}
                <div className="row g-3">
                  {PLANS.map((plan) => {
                    const price = billingAnnual ? plan.annualPrice : plan.monthlyPrice;
                    const available = hasPriceFor(plan.tier);
                    const isCurrent = currentPlan === plan.tier;

                    return (
                      <div key={plan.tier} className="col-md-4">
                        <div className={`card h-100 ${plan.color === 'primary' ? 'border-primary' : plan.color === 'indigo' ? 'border-indigo' : ''}`}>
                          <div className="card-body d-flex flex-column">
                            <div className="d-flex justify-content-between align-items-start mb-1">
                              <h3 className="card-title mb-0">{plan.name}</h3>
                              {plan.badge && (
                                <span className="badge bg-blue-lt">{plan.badge}</span>
                              )}
                            </div>
                            <p className="text-secondary small mb-2">{plan.description}</p>
                            <div className="mb-2">
                              <span className="h2 fw-bold">${price}</span>
                              <span className="text-secondary small">/mo</span>
                              {billingAnnual && (
                                <div className="text-secondary" style={{ fontSize: '0.75rem' }}>
                                  billed ${price * 12}/yr · was ${plan.monthlyPrice}/mo
                                </div>
                              )}
                            </div>
                            <div className="text-secondary small mb-3">
                              <strong>{plan.users}</strong> · {plan.jobs}
                            </div>
                            <ul className="list-unstyled small mb-4 flex-grow-1">
                              {plan.features.map((f) => (
                                <li key={f} className="d-flex align-items-start gap-1 mb-1">
                                  <IconCheck size={14} className="text-success flex-shrink-0 mt-1" />
                                  {f}
                                </li>
                              ))}
                            </ul>
                            {isCurrent ? (
                              <button className="btn btn-outline-secondary w-100" disabled>Current plan</button>
                            ) : available ? (
                              <button
                                className={`btn w-100 ${plan.color === 'primary' ? 'btn-primary' : plan.color === 'indigo' ? 'btn-indigo' : 'btn-outline-secondary'}`}
                                onClick={() => checkoutMutation.mutate({ planTier: plan.tier, billingPeriod })}
                                disabled={checkoutMutation.isPending}
                              >
                                {checkoutMutation.isPending ? 'Redirecting…' : `Get ${plan.name}`}
                              </button>
                            ) : (
                              <button className="btn btn-outline-secondary w-100" disabled title="Price not configured">
                                Not available
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Feature comparison table */}
                <div className="mt-5">
                  <h4 className="mb-3">Plan comparison</h4>
                  <div className="table-responsive">
                    <table className="table table-bordered text-center">
                      <thead>
                        <tr>
                          <th className="text-start">Feature</th>
                          <th>Starter</th>
                          <th>Professional</th>
                          <th>Business</th>
                        </tr>
                      </thead>
                      <tbody className="small">
                        {[
                          { feature: 'Active jobs', starter: 'Up to 15', professional: 'Unlimited', business: 'Unlimited' },
                          { feature: 'Team members', starter: '1', professional: 'Up to 3', business: 'Up to 10' },
                          { feature: 'Quotes & invoices', starter: '✓', professional: '✓', business: '✓' },
                          { feature: 'Client management', starter: '✓', professional: '✓', business: '✓' },
                          { feature: 'PDF export', starter: '✓', professional: '✓', business: '✓' },
                          { feature: 'Client portal', starter: '—', professional: '✓', business: '✓' },
                          { feature: 'Team collaboration', starter: '—', professional: '—', business: '✓' },
                          { feature: 'API access', starter: '—', professional: '—', business: '✓' },
                          { feature: 'Priority support', starter: '—', professional: '✓', business: '✓' },
                        ].map(({ feature, starter, professional, business }) => (
                          <tr key={feature}>
                            <td className="text-start fw-medium">{feature}</td>
                            <td className={starter === '—' ? 'text-secondary' : ''}>{starter}</td>
                            <td className={professional === '—' ? 'text-secondary' : ''}>{professional}</td>
                            <td className={business === '—' ? 'text-secondary' : ''}>{business}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
