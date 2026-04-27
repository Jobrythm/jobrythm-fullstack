import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconCrown,
  IconToggleLeft,
  IconToggleRight,
} from '@tabler/icons-react';
import { register as registerUser } from '../api/auth';
import { createCheckoutSession } from '../api/dashboard';
import { getApiErrorMessage, normalizeApiError } from '../api/errors';
import { ApiErrorAlert } from '../components/ApiErrorAlert';
import { AuthLayout } from '../layouts/AuthLayout';
import { useAuthStore } from '../store/authStore';

// ── Account details schema ────────────────────────────────────────────────────
const accountSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    companyName: z.string().optional(),
    email: z.string().email('Valid email required'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[a-z]/, 'Must include a lowercase letter')
      .regex(/[A-Z]/, 'Must include an uppercase letter')
      .regex(/\d/, 'Must include a digit')
      .regex(/[^A-Za-z0-9]/, 'Must include a special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'Passwords must match',
    path: ['confirmPassword'],
  });

type AccountValues = z.infer<typeof accountSchema>;

// ── Plan data ─────────────────────────────────────────────────────────────────
const PLANS = [
  {
    tier: 'starter' as const,
    name: 'Starter',
    monthlyPrice: 14,
    annualPrice: 9,
    description: 'Perfect for solo traders & freelancers',
    users: '1 user',
    jobs: 'Up to 15 active jobs',
    features: ['Up to 15 active jobs', 'Quotes & invoices', 'Client management', 'PDF export'],
    badge: null as string | null,
    color: 'secondary' as const,
  },
  {
    tier: 'professional' as const,
    name: 'Professional',
    monthlyPrice: 29,
    annualPrice: 24,
    description: 'For small teams ready to scale',
    users: 'Up to 3 users',
    jobs: 'Unlimited jobs',
    features: ['Unlimited active jobs', 'Up to 3 team members', 'Client portal', 'Priority support'],
    badge: 'Most popular' as string | null,
    color: 'primary' as const,
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
    badge: null as string | null,
    color: 'indigo' as const,
  },
] as const;

type PlanTier = (typeof PLANS)[number]['tier'];

// ── Component ─────────────────────────────────────────────────────────────────
export const RegisterPage = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [step, setStep] = useState<'account' | 'plan'>('account');
  const [accountValues, setAccountValues] = useState<AccountValues | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanTier>('professional');
  const [billingAnnual, setBillingAnnual] = useState(true);

  const accountForm = useForm<AccountValues>({
    resolver: zodResolver(accountSchema),
  });

  const mutation = useMutation({
    mutationFn: async ({ account, plan }: { account: AccountValues; plan: PlanTier }) => {
      // Step 1: create the account
      const authData = await registerUser({
        name: account.name,
        companyName: account.companyName || undefined,
        email: account.email,
        password: account.password,
      });
      // Step 2: immediately attempt to start Stripe checkout
      try {
        const billingPeriod = billingAnnual ? 'annual' : 'monthly';
        const checkout = await createCheckoutSession(plan, billingPeriod);
        return { authData, checkoutUrl: checkout.url };
      } catch {
        // Billing not configured — proceed to dashboard
        return { authData, checkoutUrl: null };
      }
    },
    onSuccess: ({ authData, checkoutUrl }) => {
      setAuth(authData.user, authData.session);
      if (checkoutUrl) {
        toast.success('Account created! Redirecting to checkout…');
        window.location.assign(checkoutUrl);
      } else {
        toast.success('Account created');
        navigate('/dashboard');
      }
    },
    onError: (error: Error) => {
      const normalized = normalizeApiError(error);
      toast.error(getApiErrorMessage(error));
      if (normalized.status === 429) {
        toast('Too many attempts. Please wait before retrying.');
      }
      // If registration failed, go back to account step
      setStep('account');
    },
  });

  // ── Step 1: Account details ──────────────────────────────────────────────
  if (step === 'account') {
    return (
      <AuthLayout title="Create account" subtitle="Start costing and quoting in minutes">
        {mutation.isError ? <ApiErrorAlert error={mutation.error.message} /> : null}
        <form
          onSubmit={accountForm.handleSubmit((values) => {
            setAccountValues(values);
            setStep('plan');
          })}
        >
          <div className="mb-3">
            <label className="form-label">Your name</label>
            <input className="form-control" placeholder="Jane Smith" {...accountForm.register('name')} />
            {accountForm.formState.errors.name && (
              <small className="text-danger">{accountForm.formState.errors.name.message}</small>
            )}
          </div>
          <div className="mb-3">
            <label className="form-label">Company name <span className="text-secondary">(optional)</span></label>
            <input className="form-control" placeholder="Acme Plumbing Ltd" {...accountForm.register('companyName')} />
          </div>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input className="form-control" type="email" placeholder="you@example.com" {...accountForm.register('email')} />
            {accountForm.formState.errors.email && (
              <small className="text-danger">{accountForm.formState.errors.email.message}</small>
            )}
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input className="form-control" type="password" {...accountForm.register('password')} />
            {accountForm.formState.errors.password && (
              <small className="text-danger">{accountForm.formState.errors.password.message}</small>
            )}
          </div>
          <div className="mb-3">
            <label className="form-label">Confirm password</label>
            <input className="form-control" type="password" {...accountForm.register('confirmPassword')} />
            {accountForm.formState.errors.confirmPassword && (
              <small className="text-danger">{accountForm.formState.errors.confirmPassword.message}</small>
            )}
          </div>
          <button className="btn btn-primary w-100" type="submit">
            Next: Choose a plan <IconChevronRight size={16} className="ms-1" />
          </button>
        </form>
        <div className="text-center text-secondary mt-3">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </AuthLayout>
    );
  }

  // ── Step 2: Plan selection ───────────────────────────────────────────────
  return (
    <div className="page page-center">
      <div className="container py-4" style={{ maxWidth: '880px' }}>
        <div className="text-center mb-4">
          <p className="text-secondary">Step 2 of 2 — Choose your plan</p>
          <h2 className="h2 mb-1">Start your 14-day free trial</h2>
          <p className="text-secondary mb-0">No credit card required to start. Cancel anytime.</p>
        </div>

        {/* Billing toggle */}
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
              : <IconToggleLeft size={36} className="text-secondary" />}
          </button>
          <span className={`fw-semibold ${billingAnnual ? 'text-body' : 'text-secondary'}`}>
            Annual
            <span className="badge bg-green-lt ms-2 text-green fw-normal">Save up to 36%</span>
          </span>
        </div>

        {/* Plan cards */}
        <div className="row g-3 mb-4">
          {PLANS.map((plan) => {
            const price = billingAnnual ? plan.annualPrice : plan.monthlyPrice;
            const isSelected = selectedPlan === plan.tier;

            return (
              <div key={plan.tier} className="col-md-4">
                <div
                  className={`card h-100 cursor-pointer ${
                    isSelected
                      ? plan.color === 'primary'
                        ? 'border-primary border-2'
                        : plan.color === 'indigo'
                        ? 'border-indigo border-2'
                        : 'border-secondary border-2'
                      : ''
                  }`}
                  style={{ cursor: 'pointer', transition: 'box-shadow 0.15s' }}
                  onClick={() => setSelectedPlan(plan.tier)}
                >
                  <div className="card-body d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start mb-1">
                      <h3 className="card-title mb-0">{plan.name}</h3>
                      <div className="d-flex gap-1 align-items-center">
                        {plan.badge && <span className="badge bg-blue-lt">{plan.badge}</span>}
                        {isSelected && (
                          <span className={`badge ${plan.color === 'primary' ? 'bg-primary' : plan.color === 'indigo' ? 'bg-indigo' : 'bg-secondary'}`}>
                            <IconCheck size={12} />
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-secondary small mb-2">{plan.description}</p>
                    <div className="mb-2">
                      <span className="h2 fw-bold">£{price}</span>
                      <span className="text-secondary small">/mo</span>
                      {billingAnnual && (
                        <div className="text-secondary" style={{ fontSize: '0.75rem' }}>
                          billed £{price * 12}/year · was £{plan.monthlyPrice}/mo
                        </div>
                      )}
                    </div>
                    <div className="text-secondary small mb-3">
                      <strong>{plan.users}</strong> · {plan.jobs}
                    </div>
                    <ul className="list-unstyled small mb-0 flex-grow-1">
                      {plan.features.map((f) => (
                        <li key={f} className="d-flex align-items-start gap-1 mb-1">
                          <IconCheck size={14} className="text-success flex-shrink-0 mt-1" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="d-flex gap-2 justify-content-center">
          <button
            type="button"
            className="btn btn-ghost-secondary"
            onClick={() => setStep('account')}
            disabled={mutation.isPending}
          >
            <IconChevronLeft size={16} className="me-1" />
            Back
          </button>
          <button
            type="button"
            className="btn btn-primary px-4"
            disabled={mutation.isPending}
            onClick={() => {
              if (accountValues) {
                mutation.mutate({ account: accountValues, plan: selectedPlan });
              }
            }}
          >
            {mutation.isPending ? (
              'Creating account…'
            ) : (
              <>
                <IconCrown size={16} className="me-2" />
                Start free trial on {PLANS.find((p) => p.tier === selectedPlan)?.name}
              </>
            )}
          </button>
        </div>

        <p className="text-center text-secondary small mt-3">
          14-day free trial · No credit card required · Cancel anytime
        </p>

        <div className="text-center text-secondary mt-2">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
};


