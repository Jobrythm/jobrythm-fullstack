import { zodResolver } from '@hookform/resolvers/zod';
import { IconClock, IconClockOff, IconTrash } from '@tabler/icons-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { EmptyState } from '../../../components/EmptyState';
import {
  useClockIn,
  useClockOut,
  useCreateTimeEntry,
  useDeleteTimeEntry,
  useTimeEntries,
} from '../hooks/useTimeEntries';

const logSchema = z.object({
  startTime: z.string().min(1, 'Start time required'),
  endTime: z.string().optional(),
  description: z.string().optional(),
  isBillable: z.boolean().default(false),
  hourlyRate: z.string().optional(),
});

type LogFormValues = z.infer<typeof logSchema>;

const fmtDuration = (minutes?: number) => {
  if (!minutes) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const fmtDateTime = (dt: string) =>
  new Date(dt).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

interface Props {
  jobId: string;
}

export const TimeEntriesTab = ({ jobId }: Props) => {
  const { data: entries = [], isLoading } = useTimeEntries(jobId);
  const createEntry = useCreateTimeEntry(jobId);
  const deleteEntry = useDeleteTimeEntry(jobId);
  const clockIn = useClockIn(jobId);
  const clockOut = useClockOut(jobId);

  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openEntry = entries.find((e) => !e.endTime);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LogFormValues>({ resolver: zodResolver(logSchema) });

  const onSubmit = (values: LogFormValues) => {
    const hourlyRateCents = values.hourlyRate
      ? Math.round(parseFloat(values.hourlyRate) * 100)
      : undefined;
    createEntry.mutate(
      {
        jobId,
        startTime: values.startTime,
        endTime: values.endTime || undefined,
        description: values.description || undefined,
        isBillable: values.isBillable,
        hourlyRateCents,
      },
      {
        onSuccess: () => {
          reset();
          setShowForm(false);
        },
      }
    );
  };

  const totalMinutes = entries.reduce((sum, e) => sum + (e.durationMinutes ?? 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  if (isLoading) {
    return (
      <div className="col-12">
        <div className="card">
          <div className="card-body">
            <div className="text-muted">Loading time entries…</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="col-12">
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between">
          <h3 className="card-title mb-0">
            Time Tracking
            {totalMinutes > 0 && (
              <span className="ms-2 text-muted fw-normal fs-5">— {totalHours}h total</span>
            )}
          </h3>
          <div className="d-flex gap-2">
            {openEntry ? (
              <button
                className="btn btn-danger btn-sm"
                onClick={() => clockOut.mutate()}
                disabled={clockOut.isPending}
              >
                <IconClockOff size={14} className="me-1" />
                Clock Out
              </button>
            ) : (
              <button
                className="btn btn-success btn-sm"
                onClick={() => clockIn.mutate()}
                disabled={clockIn.isPending}
              >
                <IconClock size={14} className="me-1" />
                Clock In
              </button>
            )}
            <button className="btn btn-primary btn-sm" onClick={() => setShowForm((v) => !v)}>
              Log Time
            </button>
          </div>
        </div>

        {openEntry && (
          <div className="card-body border-bottom py-2 px-3 bg-success-lt">
            <small>
              <IconClock size={14} className="me-1 text-success" />
              Timer running since {fmtDateTime(openEntry.startTime)}
            </small>
          </div>
        )}

        {showForm && (
          <div className="card-body border-bottom">
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Start Time *</label>
                  <input type="datetime-local" className="form-control" {...register('startTime')} />
                  {errors.startTime && (
                    <div className="invalid-feedback d-block">{errors.startTime.message}</div>
                  )}
                </div>
                <div className="col-md-6">
                  <label className="form-label">End Time</label>
                  <input type="datetime-local" className="form-control" {...register('endTime')} />
                </div>
                <div className="col-md-8">
                  <label className="form-label">Description</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="What was done…"
                    {...register('description')}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Hourly Rate ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-control"
                    placeholder="0.00"
                    {...register('hourlyRate')}
                  />
                </div>
                <div className="col-12">
                  <label className="form-check form-switch">
                    <input className="form-check-input" type="checkbox" {...register('isBillable')} />
                    <span className="form-check-label">Billable</span>
                  </label>
                </div>
                <div className="col-12 d-flex gap-2">
                  <button type="submit" className="btn btn-primary" disabled={createEntry.isPending}>
                    Save Entry
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost-secondary"
                    onClick={() => { setShowForm(false); reset(); }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {entries.length === 0 ? (
          <div className="card-body">
            <EmptyState
              icon={<IconClock size={40} className="text-muted" />}
              title="No time logged"
              description="Use 'Clock In' to start a timer or 'Log Time' to add a manual entry."
            />
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-vcenter card-table">
              <thead>
                <tr>
                  <th>Start</th>
                  <th>End</th>
                  <th>Duration</th>
                  <th>Description</th>
                  <th>Rate</th>
                  <th>Billable</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id}>
                    <td className="text-nowrap">{fmtDateTime(e.startTime)}</td>
                    <td className="text-nowrap">
                      {e.endTime ? fmtDateTime(e.endTime) : (
                        <span className="badge bg-success-lt text-success">Running</span>
                      )}
                    </td>
                    <td>{fmtDuration(e.durationMinutes)}</td>
                    <td className="text-muted">{e.description || '—'}</td>
                    <td>
                      {e.hourlyRateCents
                        ? `$${(e.hourlyRateCents / 100).toFixed(2)}/h`
                        : '—'}
                    </td>
                    <td>
                      {e.isBillable ? (
                        <span className="badge bg-blue-lt">Billable</span>
                      ) : (
                        <span className="badge bg-secondary-lt">Non-billable</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-ghost-danger btn-sm btn-icon"
                        onClick={() => setDeleteId(e.id)}
                      >
                        <IconTrash size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal
        open={!!deleteId}
        title="Delete time entry?"
        body="This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteId) deleteEntry.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
        }}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
};
