import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { IconChartBar } from '@tabler/icons-react';
import { CurrencyDisplay } from '../../../components/CurrencyDisplay';
import { EmptyState } from '../../../components/EmptyState';
import { fetchExpensesByCategory, fetchJobsByStatus, fetchOverview, fetchTopClients } from '../../../api/reports';

const STATUS_COLORS: Record<string, string> = {
  active: '#206bc4',
  completed: '#2fb344',
  cancelled: '#d63939',
  draft: '#a0aec0',
  on_hold: '#f76707',
};

const PIE_COLORS = ['#206bc4', '#2fb344', '#f76707', '#ae3ec9', '#d63939', '#a0aec0'];

const MONTH_OPTIONS = [
  { label: '3 months', value: 3 },
  { label: '6 months', value: 6 },
  { label: '12 months', value: 12 },
];

const fmt = (cents: number) => `£${(cents / 100).toFixed(0)}`;
const fmtTip = (value: unknown, name: unknown): [string, string] => {
  const v = Number(value);
  const n = String(name);
  if (n === 'revenue') return [fmt(v), 'Revenue'];
  if (n === 'expenses') return [fmt(v), 'Expenses'];
  if (n === 'hoursWorked') return [`${v} hrs`, 'Hours worked'];
  return [String(v), n];
};

const renderPieLabel = ({ name, percent }: { name?: string; percent?: number }) =>
  `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`;

export const ReportingPage = () => {
  const [months, setMonths] = useState(6);

  const overview = useQuery({ queryKey: ['reports-overview', months], queryFn: () => fetchOverview(months) });
  const byStatus = useQuery({ queryKey: ['reports-jobs-status'], queryFn: fetchJobsByStatus });
  const topClients = useQuery({ queryKey: ['reports-top-clients'], queryFn: () => fetchTopClients(10) });
  const expByCat = useQuery({ queryKey: ['reports-expenses-category'], queryFn: fetchExpensesByCategory });

  const overviewData = overview.data
    ? overview.data.labels.map((label, i) => ({
        label,
        revenue: overview.data!.revenue[i],
        expenses: overview.data!.expenses[i],
        hoursWorked: overview.data!.hoursWorked[i],
        jobsCompleted: overview.data!.jobsCompleted[i],
      }))
    : [];

  const totalRevenue = overview.data?.revenue.reduce((a, b) => a + b, 0) ?? 0;
  const totalExpenses = overview.data?.expenses.reduce((a, b) => a + b, 0) ?? 0;
  const totalJobs = overview.data?.jobsCompleted.reduce((a, b) => a + b, 0) ?? 0;
  const totalHours = overview.data?.hoursWorked.reduce((a, b) => a + b, 0) ?? 0;

  return (
    <div className="container-xl">
      <div className="page-header d-print-none">
        <div className="row align-items-center">
          <div className="col">
            <h2 className="page-title">Reports</h2>
            <div className="text-secondary mt-1">Business performance at a glance</div>
          </div>
          <div className="col-auto">
            <div className="btn-group">
              {MONTH_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  className={`btn btn-sm ${months === o.value ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => setMonths(o.value)}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-xl-3">
          <div className="card">
            <div className="card-body">
              <div className="subheader">Total Revenue</div>
              <div className="h1 mt-1">
                {overview.isLoading ? <span className="placeholder col-6" /> : <CurrencyDisplay cents={totalRevenue} />}
              </div>
              <div className="text-secondary small">Paid invoices in period</div>
            </div>
          </div>
        </div>
        <div className="col-sm-6 col-xl-3">
          <div className="card">
            <div className="card-body">
              <div className="subheader">Total Expenses</div>
              <div className="h1 mt-1">
                {overview.isLoading ? <span className="placeholder col-6" /> : <CurrencyDisplay cents={totalExpenses} />}
              </div>
              <div className="text-secondary small">Recorded expenses in period</div>
            </div>
          </div>
        </div>
        <div className="col-sm-6 col-xl-3">
          <div className="card">
            <div className="card-body">
              <div className="subheader">Jobs Completed</div>
              <div className="h1 mt-1">
                {overview.isLoading ? <span className="placeholder col-4" /> : totalJobs}
              </div>
              <div className="text-secondary small">In period</div>
            </div>
          </div>
        </div>
        <div className="col-sm-6 col-xl-3">
          <div className="card">
            <div className="card-body">
              <div className="subheader">Hours Worked</div>
              <div className="h1 mt-1">
                {overview.isLoading ? <span className="placeholder col-4" /> : `${Math.round(totalHours)} hrs`}
              </div>
              <div className="text-secondary small">Logged time entries</div>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue vs Expenses chart */}
      <div className="row g-3 mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Revenue vs Expenses</h3>
            </div>
            <div className="card-body">
              {overview.isLoading ? (
                <div className="placeholder-glow"><span className="placeholder col-12" style={{ height: 260 }} /></div>
              ) : overviewData.length === 0 ? (
                <EmptyState icon={<IconChartBar size={40} className="text-secondary" />} title="No data yet" description="Revenue will appear here once invoices are marked paid." />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={overviewData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#206bc4" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#206bc4" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#d63939" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#d63939" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(v) => fmt(v)} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={fmtTip} />
                    <Legend />
                    <Area type="monotone" dataKey="revenue" name="revenue" stroke="#206bc4" fill="url(#colorRev)" strokeWidth={2} dot={false} />
                    <Area type="monotone" dataKey="expenses" name="expenses" stroke="#d63939" fill="url(#colorExp)" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        {/* Jobs by status */}
        <div className="col-md-4">
          <div className="card h-100">
            <div className="card-header"><h3 className="card-title">Jobs by Status</h3></div>
            <div className="card-body d-flex align-items-center justify-content-center">
              {byStatus.isLoading ? (
                <div className="placeholder-glow w-100"><span className="placeholder col-12" style={{ height: 220 }} /></div>
              ) : !byStatus.data?.length ? (
                <EmptyState icon={<IconChartBar size={36} className="text-secondary" />} title="No jobs yet" description="" />
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={byStatus.data} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={85} label={renderPieLabel} labelLine={false}>
                      {byStatus.data.map((entry, index) => (
                        <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Expenses by category */}
        <div className="col-md-4">
          <div className="card h-100">
            <div className="card-header"><h3 className="card-title">Expenses by Category</h3></div>
            <div className="card-body d-flex align-items-center justify-content-center">
              {expByCat.isLoading ? (
                <div className="placeholder-glow w-100"><span className="placeholder col-12" style={{ height: 220 }} /></div>
              ) : !expByCat.data?.length ? (
                <EmptyState icon={<IconChartBar size={36} className="text-secondary" />} title="No expenses yet" description="" />
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={expByCat.data} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={85} label={renderPieLabel} labelLine={false}>
                      {expByCat.data.map((_, index) => (
                        <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: unknown) => [fmt(Number(v)), 'Total']} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Hours worked per month */}
        <div className="col-md-4">
          <div className="card h-100">
            <div className="card-header"><h3 className="card-title">Hours Worked</h3></div>
            <div className="card-body d-flex align-items-center justify-content-center">
              {overview.isLoading ? (
                <div className="placeholder-glow w-100"><span className="placeholder col-12" style={{ height: 220 }} /></div>
              ) : !overviewData.length ? (
                <EmptyState icon={<IconChartBar size={36} className="text-secondary" />} title="No time entries" description="" />
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={overviewData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => [`${v} hrs`, 'Hours']} />
                    <Bar dataKey="hoursWorked" name="Hours" fill="#2fb344" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Top clients table */}
      <div className="row g-3">
        <div className="col-12">
          <div className="card">
            <div className="card-header"><h3 className="card-title">Top Clients by Revenue</h3></div>
            {topClients.isLoading ? (
              <div className="card-body"><div className="placeholder-glow"><span className="placeholder col-12" style={{ height: 120 }} /></div></div>
            ) : !topClients.data?.length ? (
              <div className="card-body">
                <EmptyState icon={<IconChartBar size={36} className="text-secondary" />} title="No paid invoices yet" description="Top clients will appear once invoices are marked paid." />
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-vcenter card-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Client</th>
                      <th>Invoices</th>
                      <th className="text-end">Total Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topClients.data.map((c, i) => (
                      <tr key={c.clientId}>
                        <td className="text-secondary">{i + 1}</td>
                        <td>{c.clientName}</td>
                        <td>{c.invoiceCount}</td>
                        <td className="text-end fw-semibold"><CurrencyDisplay cents={c.totalRevenue} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
