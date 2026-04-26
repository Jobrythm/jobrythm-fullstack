import { IconBriefcase, IconSearch } from '@tabler/icons-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { CurrencyDisplay } from '../../../components/CurrencyDisplay';
import { EmptyState } from '../../../components/EmptyState';
import { StatusBadge } from '../../../components/StatusBadge';
import { TableSkeleton } from '../../../components/TableSkeleton';
import { useTopbarAction } from '../../../layouts/topbarActionContext';
import { formatDate, formatPercent } from '../../../utils';
import { useDeleteJob, useJobs } from '../hooks/useJobs';
import type { JobStatus } from '../../../types';

const statuses: Array<'all' | JobStatus> = ['all', 'draft', 'quoted', 'active', 'completed', 'invoiced'];

export const JobsPage = () => {
  const [status, setStatus] = useState<'all' | JobStatus>('all');
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { setTopbarAction } = useTopbarAction();
  const { data, isLoading } = useJobs(status === 'all' ? undefined : { status });
  const deleteMutation = useDeleteJob();

  useEffect(() => {
    setTopbarAction(<Link className="btn btn-primary" to="/jobs/new">+ New Job</Link>);
    return () => setTopbarAction(null);
  }, [setTopbarAction]);

  const filtered = useMemo(() => {
    const list = data?.items ?? [];
    if (!search) return list;
    const needle = search.toLowerCase();
    return list.filter(
      (job) => job.title.toLowerCase().includes(needle) || job.client?.name.toLowerCase().includes(needle),
    );
  }, [data, search]);

  return (
    <>
      <div className="row g-3 mb-3">
        <div className="col-lg-4">
          <div className="input-icon">
            <span className="input-icon-addon"><IconSearch size={16} /></span>
            <input
              className="form-control"
              placeholder="Search by job title or client"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>
        <div className="col-lg-8">
          <div className="btn-list">
            {statuses.map((value) => (
              <button
                key={value}
                className={`btn btn-sm ${status === value ? 'btn-primary' : ''}`}
                onClick={() => setStatus(value)}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        {isLoading ? (
          <TableSkeleton rows={6} columns={7} />
        ) : !filtered.length ? (
          <EmptyState
            icon={<IconBriefcase size={48} className="text-secondary" />}
            title="No jobs yet"
            description="Create your first job to start tracking costs and margin."
            action={<Link className="btn btn-primary" to="/jobs/new">Create your first job</Link>}
          />
        ) : (
          <div className="table-responsive">
            <table className="table table-vcenter card-table">
              <thead>
                <tr>
                  <th>Job</th>
                  <th>Client</th>
                  <th>Status</th>
                  <th>Total Revenue</th>
                  <th>Margin</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((job) => (
                  <tr key={job.id}>
                    <td>{job.title}</td>
                    <td>{job.client?.name ?? '-'}</td>
                    <td><StatusBadge status={job.status} /></td>
                    <td><CurrencyDisplay cents={job.totalRevenue} /></td>
                    <td>{formatPercent(job.marginPercent)}</td>
                    <td>{formatDate(job.createdAt)}</td>
                    <td>
                      <div className="btn-list flex-nowrap">
                        <Link className="btn btn-sm" to={`/jobs/${job.id}`}>View</Link>
                        <Link className="btn btn-sm" to={`/jobs/${job.id}/edit`}>Edit</Link>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => setDeleteId(job.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal
        open={Boolean(deleteId)}
        title="Delete job"
        body="This action cannot be undone."
        confirmLabel="Delete"
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (!deleteId) return;
          deleteMutation.mutate(deleteId, {
            onSuccess: () => {
              toast.success('Job deleted');
              setDeleteId(null);
            },
            onError: (error: Error) => toast.error(error.message),
          });
        }}
      />
    </>
  );
};

