import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { login } from '../api/auth';
import { getApiErrorMessage, normalizeApiError } from '../api/errors';
import { ApiErrorAlert } from '../components/ApiErrorAlert';
import { AuthLayout } from '../layouts/AuthLayout';
import { useAuthStore } from '../store/authStore';

const schema = z.object({
  email: z.string().min(1, 'Required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type Values = z.infer<typeof schema>;

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((state) => state.setAuth);

  const { register, handleSubmit, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: ({ user, session }) => {
      setAuth(user, session);
      toast.success('Welcome back');
      navigate(location.state?.from?.pathname ?? '/dashboard');
    },
    onError: (error: Error) => {
      const normalized = normalizeApiError(error);
      toast.error(getApiErrorMessage(error));
      if (normalized.status === 429) {
        toast('Too many login attempts. Please wait before trying again.');
      }
    },
  });

  return (
    <AuthLayout title="Sign in" subtitle="Access your Jobrythm workspace">
      {mutation.isError ? <ApiErrorAlert error={mutation.error.message} /> : null}
      <form onSubmit={handleSubmit((values) => mutation.mutate(values))}>
        <div className="mb-3">
          <label className="form-label">Email or Username</label>
          <input className="form-control" type="text" {...register('email')} />
          {errors.email ? <small className="text-danger">{errors.email.message}</small> : null}
        </div>
        <div className="mb-3">
          <label className="form-label">Password</label>
          <input className="form-control" type="password" {...register('password')} />
          {errors.password ? <small className="text-danger">{errors.password.message}</small> : null}
        </div>
        <button className="btn btn-primary w-100" type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
      <div className="text-center text-secondary mt-3">
        No account yet? <Link to="/register">Register</Link>
      </div>
    </AuthLayout>
  );
};

