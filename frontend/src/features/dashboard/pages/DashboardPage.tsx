import { useState } from 'react';
import { IconBriefcase, IconChartBar, IconCheck, IconFileText, IconReceipt, IconRocket, IconUsers, IconX } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ApiErrorAlert } from '../../../components/ApiErrorAlert';
import { CurrencyDisplay } from '../../../components/CurrencyDisplay';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { StatusBadge } from '../../../components/StatusBadge';
import { useDashboard } from '../hooks/useDashboard';
import { loadDemoData } from '../../../api/dashboard';
import type { DashboardStats } from '../../../types';
import { formatDate } from '../../../utils';

const ONBOARDING_DISMISSED_KEY = 'jobrythm_onboarding_dismissed';

const OnboardingCard = ({ data }: { data: Pick<DashboardStats, 'activeJobs' | 'quotesThisMonth' | 'recentJobs'> }) => {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(ONBOARDING_DISMISSED_KEY) === '1');
  const queryClient = useQueryClient();

  const demoMutation = useMutation({
    mutationFn: loadDemoData,
    onSuccess: () => {
      toast.success('Demo data loaded! Explore your sample jobs and quotes.');
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
    onError: () => toast.error('Failed to load demo data. Please try again.'),
  });

  const hasClient = data.recentJobs.length > 0;
  const hasJob = data.recentJobs.length > 0;
  const hasQuote = data.quotesThisMonth > 0;
  const allDone = hasClient && hasJob && hasQuote;

  if (dismissed || allDone) return null;

  const steps = [
    { label: 'Add your first client', done: hasClient, href: '/clients/new' },
    { label: 'Create a job', done: hasJob, href: '/jobs/new' },
    { label: 'Generate a quote', done: hasQuote, href: '/quotes' },
    { label: 'Send the quote to your client', done: false, href: '/quotes' },
  ];

  return (
    <div className="col-12">
      <div className="card border-primary">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-start">
            <div className="d-flex gap-3 align-items-center mb-3">
              <IconRocket className="text-primary" size={28} />
              <div>
                <h3 className="mb-0">Welcome to Jobrythm 👋</h3>
                <p className="text-secondary mb-0">Complete these steps to get started — or load demo data to explore first.</p>
              </div>
            </div>
            <button
              className="btn btn-sm btn-ghost-secondary"
              onClick={() => { localStorage.setItem(ONBOARDING_DISMISSED_KEY, '1'); setDismissed(true); }}
              title="Dismiss"
            >
              <IconX size={16} />
            </button>
          </div>
          <div className="row g-2 mb-3">
            {steps.map((step, i) => (
              <div className="col-sm-6 col-lg-3" key={i}>
                <div className={`d-flex align-items-center gap-2 p-2 rounded ${step.done ? 'bg-success-lt' : 'bg-light'}`}>
                  {step.done
                    ? <IconCheck size={16} className="text-success" />
                    : <span className="badge bg-secondary text-white" style={{ minWidth: 22 }}>{i + 1}</span>
                  }
                  {step.done
                    ? <span className="text-success">{step.label}</span>
                    : <Link to={step.href} className="text-reset">{step.label}</Link>
                  }
                </div>
              </div>
            ))}
          </div>
          <button
            className="btn btn-outline-primary btn-sm"
            disabled={demoMutation.isPending}
            onClick={() => demoMutation.mutate()}
          >
            {demoMutation.isPending ? 'Loading…' : '✨ Load demo data'}
          </button>
          <span className="text-secondary ms-2 small">Explore with sample client, jobs, quotes and invoices.</span>
        </div>
      </div>
    </div>
  );
};

export const DashboardPage = () => {
  const { data, isLoading, isError, error } = useDashboard();

  if (isLoading) return <LoadingSpinner label="Loading dashboard..." />;
  if (isError) return <ApiErrorAlert error={(error as Error).message} />;
  if (!data) return null;

  return (
    <div className="row g-3">
      <OnboardingCard data={data} />
      <div className="col-12">
        <div className="row g-3">
          <div className="col-sm-6 col-lg-3">
            <div className="card">
              <div className="card-body d-flex align-items-center gap-3">
                <IconBriefcase className="text-blue" />
                <div>
                  <div className="text-secondary">Active Jobs</div>
                  <div className="h2 mb-0">{data.activeJobs}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-sm-6 col-lg-3">
            <div className="card">
              <div className="card-body d-flex align-items-center gap-3">
                <IconFileText className="text-indigo" />
                <div>
                  <div className="text-secondary">Quotes This Month</div>
                  <div className="h2 mb-0">{data.quotesThisMonth}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-sm-6 col-lg-3">
            <div className="card">
              <div className="card-body d-flex align-items-center gap-3">
                <IconChartBar className="text-green" />
                <div>
                  <div className="text-secondary">Revenue This Month</div>
                  <div className="h2 mb-0"><CurrencyDisplay cents={data.revenueThisMonth} /></div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-sm-6 col-lg-3">
            <div className="card">
              <div className="card-body d-flex align-items-center gap-3">
                <IconReceipt className="text-orange" />
                <div>
                  <div className="text-secondary">Outstanding Invoices</div>
                  <div className="h2 mb-0"><CurrencyDisplay cents={data.outstandingInvoices} /></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="col-xl-8">
        <div className="card">
          <div className="card-header d-flex justify-content-between">
            <h3 className="card-title">Recent Jobs</h3>
            <div className="btn-list">
              <Link className="btn btn-sm btn-primary" to="/jobs/new">New Job</Link>
              <Link className="btn btn-sm" to="/quotes">New Quote</Link>
              <Link className="btn btn-sm" to="/clients/new"><IconUsers size={16} className="me-1" /> New Client</Link>
            </div>
          </div>
          <div className="table-responsive">
            <table className="table table-vcenter card-table">
              <thead>
                <tr>
                  <th>Job</th>
                  <th>Client</th>
                  <th>Status</th>
                  <th>Value</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {data.recentJobs.map((job) => (
                  <tr key={job.id}>
                    <td><Link to={`/jobs/${job.id}`}>{job.title}</Link></td>
                    <td>{job.client?.name ?? '-'}</td>
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

      <div className="col-xl-4">
        <div className="card">
          <div className="card-header"><h3 className="card-title">Recent Activity</h3></div>
          <div className="list-group list-group-flush list-group-hoverable">
            {data.recentActivity.map((item) => (
              <div key={item.id} className="list-group-item">
                <div className="fw-semibold">{item.description}</div>
                <div className="text-secondary small">{formatDate(item.createdAt)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

