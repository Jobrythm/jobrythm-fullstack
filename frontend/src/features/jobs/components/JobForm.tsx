import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import toast from 'react-hot-toast';
import type { Client, Job } from '../../../types';
import { ClientSearchSelect } from '../../../components/ClientSearchSelect';
import { AiDescribeInput } from '../../../components/AiDescribeInput';

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
  }, {
    message: 'End date must be on or after start date',
    path: ['endDate'],
  });

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
    control,
    setValue,
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

  const handleAiFill = (fields: Record<string, string>) => {
    if (fields.title) setValue('title', fields.title, { shouldValidate: true });
    if (fields.description) setValue('description', fields.description);
    if (fields.startDate) setValue('startDate', fields.startDate);
    if (fields.endDate) setValue('endDate', fields.endDate);
    toast.success('Fields filled from AI — review and adjust before saving');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="mb-3">
        <AiDescribeInput
          endpoint="/ai/suggest-job"
          placeholder="e.g. Replace the boiler at 12 Oak Street for next Monday, fitting a new Worcestershire Bosch combi, should take 2 days"
          onResult={handleAiFill}
        />
      </div>
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
          <Controller
            name="clientId"
            control={control}
            render={({ field }) => (
              <ClientSearchSelect
                clients={clients}
                value={field.value}
                onChange={field.onChange}
                error={errors.clientId?.message}
              />
            )}
          />
          {errors.clientId ? <small className="text-danger">{errors.clientId.message}</small> : null}

          <button className="btn btn-link px-0 mt-2" type="button" onClick={onAddClient}>
            + Add new client
          </button>

          <label className="form-label mt-3">Start Date</label>
          <input type="date" className="form-control" {...register('startDate')} />

          <label className="form-label mt-3">End Date</label>
          <input type="date" className="form-control" {...register('endDate')} />
          {errors.endDate ? <small className="text-danger">{errors.endDate.message}</small> : null}
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

