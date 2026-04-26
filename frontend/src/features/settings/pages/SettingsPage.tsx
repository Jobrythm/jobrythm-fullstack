import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { z } from 'zod';
import { useAuthStore } from '../../../store/authStore';
import { updateCurrentUser, uploadCurrentUserLogo } from '../../../api/users';
import { createBillingPortalSession, createCheckoutSession } from '../../../api/dashboard';

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
  defaultPaymentTerms: z.string().optional(),
  defaultQuoteValidityDays: z.coerce.number().min(1),
});

type ProfileValues = z.infer<typeof profileSchema>;
type CompanyValues = z.infer<typeof companySchema>;

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
      defaultPaymentTerms: 'Payment due in 14 days.',
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
    mutationFn: createCheckoutSession,
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
                defaultPaymentTerms: values.defaultPaymentTerms || null,
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
            <div className="col-12">
              <label className="form-label">Default payment terms</label>
              <textarea className="form-control" rows={3} {...companyForm.register('defaultPaymentTerms')} />
            </div>
            <div className="col-12"><button className="btn btn-primary">Save company settings</button></div>
          </form>
        ) : null}

        {tab === 'billing' ? (
          <div>
            <div className="mb-3">
              <span className="badge bg-indigo-lt text-capitalize">{user?.plan ?? 'starter'} plan</span>
            </div>
            <div className="btn-list">
              <button className="btn btn-primary" onClick={() => checkoutMutation.mutate()} disabled={checkoutMutation.isPending}>
                {checkoutMutation.isPending ? 'Redirecting...' : 'Upgrade plan'}
              </button>
              <button className="btn btn-outline-danger" onClick={() => portalMutation.mutate()} disabled={portalMutation.isPending}>
                {portalMutation.isPending ? 'Redirecting...' : 'Manage subscription'}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

