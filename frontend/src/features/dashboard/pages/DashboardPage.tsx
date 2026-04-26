import { IconBriefcase, IconChartBar, IconFileText, IconReceipt, IconUsers } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { ApiErrorAlert } from '../../../components/ApiErrorAlert';
import { CurrencyDisplay } from '../../../components/CurrencyDisplay';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { StatusBadge } from '../../../components/StatusBadge';
import { useDashboard } from '../hooks/useDashboard';
import { formatDate } from '../../../utils';

export const DashboardPage = () => {
  const { data, isLoading, isError, error } = useDashboard();

  if (isLoading) return <LoadingSpinner label="Loading dashboard..." />;
  if (isError) return <ApiErrorAlert error={(error as Error).message} />;
  if (!data) return null;

  return (
    <div className="row g-3">
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

