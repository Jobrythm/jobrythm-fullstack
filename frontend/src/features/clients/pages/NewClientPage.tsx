import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { z } from 'zod';
import { useCreateClient } from '../hooks/useClients';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type Values = z.infer<typeof schema>;

export const NewClientPage = () => {
  const navigate = useNavigate();
  const mutation = useCreateClient();
  const { register, handleSubmit, formState: { errors } } = useForm<Values>({ resolver: zodResolver(schema) });

  return (
    <div className="card">
      <div className="card-body">
        <form
          onSubmit={handleSubmit((values) => {
            mutation.mutate(values, {
              onSuccess: (client) => {
                toast.success('Client created');
                navigate(`/clients/${client.id}`);
              },
            });
          })}
        >
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Name</label>
              <input className="form-control" {...register('name')} />
              {errors.name ? <small className="text-danger">{errors.name.message}</small> : null}
            </div>
            <div className="col-md-6">
              <label className="form-label">Email</label>
              <input className="form-control" {...register('email')} />
              {errors.email ? <small className="text-danger">{errors.email.message}</small> : null}
            </div>
            <div className="col-md-6">
              <label className="form-label">Phone</label>
              <input className="form-control" {...register('phone')} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Address</label>
              <input className="form-control" {...register('address')} />
            </div>
          </div>
          <button className="btn btn-primary mt-4" type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving...' : 'Save Client'}
          </button>
        </form>
      </div>
    </div>
  );
};

