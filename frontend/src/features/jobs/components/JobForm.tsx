import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { Client, Job } from '../../../types';

const jobSchema = z
  .object({
    title: z.string().min(1, 'Job title is required'),
    description: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    clientId: z.string().min(1, 'Client is required'),
  })
  .refine((value) => {
    if (!value.startDate || !value.endDate) return true;
    return new Date(value.endDate) >= new Date(value.startDate);
  }, 'End date must be on or after start date');

type JobFormValues = z.infer<typeof jobSchema>;

interface JobFormProps {
  clients: Client[];
  initialJob?: Partial<Job>;
  isSaving?: boolean;
  onSubmit: (values: JobFormValues) => void;
  onAddClient: () => void;
}

export const JobForm = ({ clients, initialJob, isSaving = false, onSubmit, onAddClient }: JobFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<JobFormValues>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: initialJob?.title ?? '',
      description: initialJob?.description ?? '',
      startDate: initialJob?.startDate?.slice(0, 10) ?? '',
      endDate: initialJob?.endDate?.slice(0, 10) ?? '',
      clientId: initialJob?.clientId ?? '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="row g-3">
        <div className="col-md-8">
          <label className="form-label">Job Title</label>
          <input className="form-control" {...register('title')} />
          {errors.title ? <small className="text-danger">{errors.title.message}</small> : null}

          <label className="form-label mt-3">Description</label>
          <textarea className="form-control" rows={5} {...register('description')} />
        </div>

        <div className="col-md-4">
          <label className="form-label">Client</label>
          <select className="form-select" {...register('clientId')}>
            <option value="">Select a client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
          {errors.clientId ? <small className="text-danger">{errors.clientId.message}</small> : null}

          <button className="btn btn-link px-0 mt-2" type="button" onClick={onAddClient}>
            + Add new client
          </button>

          <label className="form-label mt-3">Start Date</label>
          <input type="date" className="form-control" {...register('startDate')} />

          <label className="form-label mt-3">End Date</label>
          <input type="date" className="form-control" {...register('endDate')} />
          {errors.root ? <small className="text-danger">{errors.root.message}</small> : null}
        </div>
      </div>

      <div className="mt-4">
        <button className="btn btn-primary" type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Job'}
        </button>
      </div>
    </form>
  );
};

