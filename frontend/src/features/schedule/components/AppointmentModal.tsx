import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import type { Appointment, AppointmentPayload } from '../../../api/appointments';
import { useJobs } from '../../jobs/hooks/useJobs';
import { useClients } from '../../clients/hooks/useClients';

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  location: z.string().optional(),
  jobId: z.string().optional(),
  clientId: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  appointment?: Appointment | null;
  defaultStart?: string;
  defaultEnd?: string;
  onSubmit: (payload: AppointmentPayload) => void;
  onDelete?: () => void;
  onClose: () => void;
  isLoading?: boolean;
}

function toLocalDateTimeString(iso: string) {
  return format(new Date(iso), "yyyy-MM-dd'T'HH:mm");
}

export const AppointmentModal = ({ appointment, defaultStart, defaultEnd, onSubmit, onDelete, onClose, isLoading }: Props) => {
  const { data: jobsData } = useJobs();
  const { data: clientsData } = useClients();
  const jobs = jobsData?.items ?? [];
  const clients = clientsData?.items ?? [];

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: appointment?.title ?? '',
      description: appointment?.description ?? '',
      startTime: appointment?.startTime ? toLocalDateTimeString(appointment.startTime)
        : (defaultStart ? toLocalDateTimeString(defaultStart) : ''),
      endTime: appointment?.endTime ? toLocalDateTimeString(appointment.endTime)
        : (defaultEnd ? toLocalDateTimeString(defaultEnd) : ''),
      location: appointment?.location ?? '',
      jobId: appointment?.jobId ?? '',
      clientId: appointment?.clientId ?? '',
    },
  });

  useEffect(() => {
    reset({
      title: appointment?.title ?? '',
      description: appointment?.description ?? '',
      startTime: appointment?.startTime ? toLocalDateTimeString(appointment.startTime)
        : (defaultStart ? toLocalDateTimeString(defaultStart) : ''),
      endTime: appointment?.endTime ? toLocalDateTimeString(appointment.endTime)
        : (defaultEnd ? toLocalDateTimeString(defaultEnd) : ''),
      location: appointment?.location ?? '',
      jobId: appointment?.jobId ?? '',
      clientId: appointment?.clientId ?? '',
    });
  }, [appointment, defaultStart, defaultEnd, reset]);

  const handleFormSubmit = (values: FormValues) => {
    onSubmit({
      ...values,
      startTime: new Date(values.startTime).toISOString(),
      endTime: new Date(values.endTime).toISOString(),
      jobId: values.jobId || undefined,
      clientId: values.clientId || undefined,
    });
  };

  return (
    <div className="modal modal-blur show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{appointment ? 'Edit Appointment' : 'New Appointment'}</h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <form onSubmit={handleSubmit(handleFormSubmit)}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label required">Title</label>
                <input className="form-control" {...register('title')} />
                {errors.title && <div className="invalid-feedback d-block">{errors.title.message}</div>}
              </div>
              <div className="row g-2 mb-3">
                <div className="col-6">
                  <label className="form-label required">Start</label>
                  <input type="datetime-local" className="form-control" {...register('startTime')} />
                  {errors.startTime && <div className="invalid-feedback d-block">{errors.startTime.message}</div>}
                </div>
                <div className="col-6">
                  <label className="form-label required">End</label>
                  <input type="datetime-local" className="form-control" {...register('endTime')} />
                  {errors.endTime && <div className="invalid-feedback d-block">{errors.endTime.message}</div>}
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">Location</label>
                <input className="form-control" placeholder="Address or site name" {...register('location')} />
              </div>
              <div className="mb-3">
                <label className="form-label">Job</label>
                <select className="form-select" {...register('jobId')}>
                  <option value="">— None —</option>
                  {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">Client</label>
                <select className="form-select" {...register('clientId')}>
                  <option value="">— None —</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">Notes</label>
                <textarea className="form-control" rows={2} {...register('description')} />
              </div>
            </div>
            <div className="modal-footer">
              {appointment && onDelete && (
                <button type="button" className="btn btn-danger me-auto" onClick={onDelete} disabled={isLoading}>
                  Delete
                </button>
              )}
              <button type="button" className="btn btn-ghost-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={isLoading}>
                {isLoading ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
