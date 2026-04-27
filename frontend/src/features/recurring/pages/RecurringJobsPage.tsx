import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IconPlus, IconRefresh, IconEdit, IconToggleRight, IconToggleLeft, IconTrash } from '@tabler/icons-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { recurringJobsApi, type RecurringJobTemplate, type CreateRecurringJobPayload, type RecurringFrequency } from '../../../api/recurringJobs';
import { useClients } from '../../clients/hooks/useClients';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { TableSkeleton } from '../../../components/TableSkeleton';
import { EmptyState } from '../../../components/EmptyState';

const FREQ_LABELS: Record<RecurringFrequency, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  biweekly: 'Every 2 weeks',
  monthly: 'Monthly',
  quarterly: 'Every 3 months',
  yearly: 'Yearly',
};

const FREQS: RecurringFrequency[] = ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'];

interface FormState {
  title: string;
  clientId: string;
  description: string;
  frequency: RecurringFrequency;
  startDate: string;
  endDate: string;
}

const EMPTY_FORM: FormState = {
  title: '',
  clientId: '',
  description: '',
  frequency: 'monthly',
  startDate: new Date().toISOString().slice(0, 10),
  endDate: '',
};

interface ModalProps {
  initial: FormState;
  onSave: (data: FormState) => void;
  onClose: () => void;
  isSaving: boolean;
  editMode: boolean;
}

function RecurringJobModal({ initial, onSave, onClose, isSaving, editMode }: ModalProps) {
  const [form, setForm] = useState<FormState>(initial);
  const { data: clientsData } = useClients();
  const clients = clientsData?.items ?? [];

  const set = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="modal modal-blur show d-block" tabIndex={-1}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{editMode ? 'Edit recurring job' : 'New recurring job'}</h5>
            <button className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label required">Job title</label>
              <input className="form-control" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Monthly maintenance visit" />
            </div>
            <div className="mb-3">
              <label className="form-label">Client</label>
              <select className="form-select" value={form.clientId} onChange={(e) => set('clientId', e.target.value)}>
                <option value="">No client</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label">Description</label>
              <textarea className="form-control" rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} />
            </div>
            <div className="row g-3">
              <div className="col-6">
                <label className="form-label required">Frequency</label>
                <select className="form-select" value={form.frequency} onChange={(e) => set('frequency', e.target.value as RecurringFrequency)}>
                  {FREQS.map((f) => <option key={f} value={f}>{FREQ_LABELS[f]}</option>)}
                </select>
              </div>
              <div className="col-6">
                <label className="form-label required">Start date</label>
                <input type="date" className="form-control" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} />
              </div>
              <div className="col-6">
                <label className="form-label">End date <span className="text-secondary">(optional)</span></label>
                <input type="date" className="form-control" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} />
              </div>
            </div>
            <div className="mt-3 alert alert-info small">
              Jobs will be automatically created on the schedule and appear in your Jobs list with a recurring badge.
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-link me-auto" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={() => onSave(form)} disabled={!form.title || !form.startDate || isSaving}>
              {isSaving ? 'Saving…' : editMode ? 'Save changes' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RecurringJobsPage() {
  const qc = useQueryClient();
  const key = ['recurring-jobs'];
  const { data: templates = [], isLoading } = useQuery({ queryKey: key, queryFn: recurringJobsApi.list });
  const createMutation = useMutation({
    mutationFn: (data: CreateRecurringJobPayload) => recurringJobsApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: key }); toast.success('Recurring job created'); setModalOpen(false); },
    onError: () => toast.error('Failed to create recurring job'),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateRecurringJobPayload> & { isActive?: boolean } }) =>
      recurringJobsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: key }); toast.success('Updated'); setModalOpen(false); },
    onError: () => toast.error('Failed to update'),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => recurringJobsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: key }); toast.success('Deleted'); setDeleteTarget(null); },
    onError: () => toast.error('Failed to delete'),
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<RecurringJobTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RecurringJobTemplate | null>(null);

  const openCreate = () => { setEditTarget(null); setModalOpen(true); };
  const openEdit = (t: RecurringJobTemplate) => { setEditTarget(t); setModalOpen(true); };

  const handleSave = (form: FormState) => {
    const payload: CreateRecurringJobPayload = {
      title: form.title,
      clientId: form.clientId || undefined,
      description: form.description || undefined,
      frequency: form.frequency,
      startDate: form.startDate,
      endDate: form.endDate || undefined,
    };
    if (editTarget) {
      updateMutation.mutate({ id: editTarget.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const toggleActive = (t: RecurringJobTemplate) => {
    updateMutation.mutate({ id: t.id, data: { isActive: !t.isActive } });
  };

  const formInitial: FormState = editTarget
    ? {
        title: editTarget.title,
        clientId: editTarget.clientId ?? '',
        description: editTarget.description ?? '',
        frequency: editTarget.frequency,
        startDate: editTarget.startDate,
        endDate: editTarget.endDate ?? '',
      }
    : EMPTY_FORM;

  return (
    <>
      {modalOpen && (
        <RecurringJobModal
          initial={formInitial}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
          isSaving={createMutation.isPending || updateMutation.isPending}
          editMode={Boolean(editTarget)}
        />
      )}
      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete recurring job"
        body={`Delete "${deleteTarget?.title}"? Future jobs will not be spawned. Existing spawned jobs are not affected.`}
        confirmLabel="Delete"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onClose={() => setDeleteTarget(null)}
      />

      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h2 className="h4 mb-0">Recurring Jobs</h2>
          <span className="text-secondary small">Auto-create jobs on a schedule</span>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <IconPlus size={16} className="me-1" />
          New recurring job
        </button>
      </div>

      {isLoading ? (
        <TableSkeleton rows={3} columns={6} />
      ) : templates.length === 0 ? (
        <EmptyState
          icon={<IconRefresh size={40} strokeWidth={1.5} />}
          title="No recurring jobs yet"
          description="Set up jobs that automatically repeat — monthly maintenance, weekly inspections, quarterly services."
          action={<button className="btn btn-primary" onClick={openCreate}><IconPlus size={16} className="me-1" />Create first recurring job</button>}
        />
      ) : (
        <div className="card">
          <div className="table-responsive">
            <table className="table table-vcenter card-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Client</th>
                  <th>Frequency</th>
                  <th>Next run</th>
                  <th>Jobs created</th>
                  <th>Status</th>
                  <th className="w-1" />
                </tr>
              </thead>
              <tbody>
                {templates.map((t) => (
                  <tr key={t.id}>
                    <td className="fw-semibold">{t.title}</td>
                    <td className="text-secondary">{t.client?.name ?? '—'}</td>
                    <td><span className="badge bg-blue-lt">{FREQ_LABELS[t.frequency]}</span></td>
                    <td className="text-secondary">
                      {t.nextRunAt ? new Date(t.nextRunAt).toLocaleDateString() : '—'}
                    </td>
                    <td>
                      <Link to={`/jobs?recurring=${t.id}`} className="text-secondary">
                        {t.jobsSpawned}
                      </Link>
                    </td>
                    <td>
                      {t.isActive
                        ? <span className="badge bg-success-lt text-success">Active</span>
                        : <span className="badge bg-secondary-lt text-secondary">Paused</span>}
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <button className="btn btn-sm btn-ghost-secondary" title="Edit" onClick={() => openEdit(t)}>
                          <IconEdit size={15} />
                        </button>
                        <button
                          className="btn btn-sm btn-ghost-secondary"
                          title={t.isActive ? 'Pause' : 'Resume'}
                          onClick={() => toggleActive(t)}
                        >
                          {t.isActive ? <IconToggleLeft size={15} /> : <IconToggleRight size={15} />}
                        </button>
                        <button className="btn btn-sm btn-ghost-danger text-danger" title="Delete" onClick={() => setDeleteTarget(t)}>
                          <IconTrash size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
