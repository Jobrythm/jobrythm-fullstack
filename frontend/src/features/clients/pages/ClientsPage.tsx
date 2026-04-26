import { IconUsers } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { CurrencyDisplay } from '../../../components/CurrencyDisplay';
import { EmptyState } from '../../../components/EmptyState';
import { TableSkeleton } from '../../../components/TableSkeleton';
import { useJobs } from '../../jobs/hooks/useJobs';
import { useClients } from '../hooks/useClients';

export const ClientsPage = () => {
  const { data: clientsResponse, isLoading } = useClients();
  const { data: jobsResponse } = useJobs();
  const clients = clientsResponse?.items ?? [];
  const jobs = jobsResponse?.items ?? [];

  if (isLoading) return <TableSkeleton rows={6} columns={6} />;

  if (!clients.length) {
    return (
      <EmptyState
        icon={<IconUsers size={46} className="text-secondary" />}
        title="No clients yet"
        description="Add your first client to start creating jobs and quotes."
        action={<Link className="btn btn-primary" to="/clients/new">New Client</Link>}
      />
    );
  }

  return (
    <div className="card">
      <div className="table-responsive">
        <table className="table table-vcenter card-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Jobs</th>
              <th>Total Revenue</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => {
              const clientJobs = jobs.filter((job) => job.clientId === client.id);
              const totalRevenue = clientJobs.reduce((acc, job) => acc + job.totalRevenue, 0);

              return (
                <tr key={client.id}>
                  <td>{client.name}</td>
                  <td>{client.email ?? '-'}</td>
                  <td>{client.phone ?? '-'}</td>
                  <td>{clientJobs.length}</td>
                  <td><CurrencyDisplay cents={totalRevenue} /></td>
                  <td><Link className="btn btn-sm" to={`/clients/${client.id}`}>View</Link></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

