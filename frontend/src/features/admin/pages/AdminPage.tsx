import { IconUsers, IconShieldLock, IconLayout2, IconBuildingStore } from '@tabler/icons-react';
import { useClients } from '../../clients/hooks/useClients';
import { useJobs } from '../../jobs/hooks/useJobs';
import { TableSkeleton } from '../../../components/TableSkeleton';
import { CurrencyDisplay } from '../../../components/CurrencyDisplay';

export const AdminPage = () => {
  const { data: clientsResponse, isLoading: loadingClients } = useClients();
  const { data: jobsResponse, isLoading: loadingJobs } = useJobs();
  const clients = clientsResponse?.items ?? [];
  const jobs = jobsResponse?.items ?? [];

  if (loadingClients || loadingJobs) return <TableSkeleton rows={6} columns={6} />;

  const totalRevenue = jobs.reduce((acc, job) => acc + job.totalRevenue, 0);

  return (
    <div className="space-y-4">
      <div className="row row-cards mb-4">
        <div className="col-sm-6 col-lg-3">
          <div className="card card-sm">
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col-auto">
                  <span className="bg-primary text-white avatar"><IconBuildingStore /></span>
                </div>
                <div className="col">
                  <div className="font-weight-medium">{clients.length} Customers</div>
                  <div className="text-secondary">Platform wide</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-sm-6 col-lg-3">
          <div className="card card-sm">
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col-auto">
                  <span className="bg-green text-white avatar"><IconLayout2 /></span>
                </div>
                <div className="col">
                  <div className="font-weight-medium">{jobs.length} Total Jobs</div>
                  <div className="text-secondary">Across all accounts</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-sm-6 col-lg-3">
          <div className="card card-sm">
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col-auto">
                  <span className="bg-azure text-white avatar"><IconLayout2 /></span>
                </div>
                <div className="col">
                  <div className="font-weight-medium"><CurrencyDisplay cents={totalRevenue} /></div>
                  <div className="text-secondary">Total Volume</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <IconUsers size={18} className="me-2 text-primary" />
            Customer Management
          </h3>
        </div>
        <div className="table-responsive">
          <table className="table table-vcenter card-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Joined</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id}>
                  <td>{client.name}</td>
                  <td>{client.email ?? '-'}</td>
                  <td>{client.phone ?? '-'}</td>
                  <td>{new Date(client.createdAt).toLocaleDateString()}</td>
                  <td><span className="badge bg-success-lt">Active</span></td>
                  <td>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => {
                      if (confirm('Are you sure you want to delete this customer?')) {
                        // Mock deletion
                        alert('Customer deleted (mock)');
                      }
                    }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h3 className="card-title">
            <IconShieldLock size={18} className="me-2 text-primary" />
            Admin Accounts
          </h3>
          <button className="btn btn-primary btn-sm" onClick={() => alert('Feature to invite new admin (mock)')}>
            Invite Admin
          </button>
        </div>
        <div className="table-responsive">
          <table className="table table-vcenter card-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Admin User</td>
                <td>admin@jobrythm.com</td>
                <td><span className="badge bg-blue-lt">Super Admin</span></td>
                <td>
                  <button className="btn btn-sm btn-outline-secondary disabled">Edit</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
