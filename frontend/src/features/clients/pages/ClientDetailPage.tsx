import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { z } from 'zod';
import { CurrencyDisplay } from '../../../components/CurrencyDisplay';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { StatusBadge } from '../../../components/StatusBadge';
import { formatDate } from '../../../utils';
import { useJobs } from '../../jobs/hooks/useJobs';
import { useClient, useUpdateClient } from '../hooks/useClients';

const schema = z.object({
  name: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type Values = z.infer<typeof schema>;

export const ClientDetailPage = () => {
  const { id } = useParams();
  const { data: client, isLoading } = useClient(id);
  const { data: jobsResponse } = useJobs();
  const jobs = jobsResponse?.items ?? [];
  const updateClient = useUpdateClient();

  const { register, handleSubmit, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
    values: {
      name: client?.name ?? '',
      email: client?.email ?? '',
      phone: client?.phone ?? '',
      address: client?.address ?? '',
    },
  });

  if (isLoading || !client) return <LoadingSpinner label="Loading client..." />;

  const clientJobs = jobs.filter((job) => job.clientId === client.id);
  const totalRevenue = clientJobs.reduce((acc, job) => acc + job.totalRevenue, 0);

  return (
    <div className="row g-3">
      <div className="col-lg-4">
        <div className="card">
          <div className="card-header"><h3 className="card-title">Contact info</h3></div>
          <div className="card-body">
            <form
              onSubmit={handleSubmit((values) => {
                updateClient.mutate(
                  { id: client.id, payload: values },
                  { onSuccess: () => toast.success('Client updated') },
                );
              })}
            >
              <label className="form-label">Name</label>
              <input className="form-control" {...register('name')} />
              {errors.name ? <small className="text-danger">{errors.name.message}</small> : null}

              <label className="form-label mt-3">Email</label>
              <input className="form-control" {...register('email')} />

              <label className="form-label mt-3">Phone</label>
              <input className="form-control" {...register('phone')} />

              <label className="form-label mt-3">Address</label>
              <textarea className="form-control" rows={3} {...register('address')} />

              <button className="btn btn-primary mt-3" type="submit">Save</button>
            </form>
          </div>
        </div>
      </div>

      <div className="col-lg-8">
        <div className="row g-3 mb-1">
          <div className="col-md-6"><div className="card"><div className="card-body"><div className="text-secondary">Total revenue</div><h3><CurrencyDisplay cents={totalRevenue} /></h3></div></div></div>
          <div className="col-md-6"><div className="card"><div className="card-body"><div className="text-secondary">Jobs count</div><h3>{clientJobs.length}</h3></div></div></div>
        </div>
        <div className="card">
          <div className="table-responsive">
            <table className="table table-vcenter card-table">
              <thead>
                <tr><th>Job</th><th>Status</th><th>Revenue</th><th>Date</th></tr>
              </thead>
              <tbody>
                {clientJobs.map((job) => (
                  <tr key={job.id}>
                    <td><Link to={`/jobs/${job.id}`}>{job.title}</Link></td>
                    <td><StatusBadge status={job.status} /></td>
                    <td><CurrencyDisplay cents={job.totalRevenue} /></td>
                    <td>{formatDate(job.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

