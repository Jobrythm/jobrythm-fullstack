import { Navigate, createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { DashboardPage } from '../features/dashboard/pages/DashboardPage';
import { JobsPage } from '../features/jobs/pages/JobsPage';
import { NewJobPage } from '../features/jobs/pages/NewJobPage';
import { JobDetailPage } from '../features/jobs/pages/JobDetailPage';
import { EditJobPage } from '../features/jobs/pages/EditJobPage';
import { ClientsPage } from '../features/clients/pages/ClientsPage';
import { NewClientPage } from '../features/clients/pages/NewClientPage';
import { ClientDetailPage } from '../features/clients/pages/ClientDetailPage';
import { QuotesPage } from '../features/quotes/pages/QuotesPage';
import { QuoteDetailPage } from '../features/quotes/pages/QuoteDetailPage';
import { InvoicesPage } from '../features/invoices/pages/InvoicesPage';
import { InvoiceDetailPage } from '../features/invoices/pages/InvoiceDetailPage';
import { SettingsPage } from '../features/settings/pages/SettingsPage';
import { AdminPage } from '../features/admin/pages/AdminPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <Navigate to="/dashboard" replace /> },
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/jobs', element: <JobsPage /> },
          { path: '/jobs/new', element: <NewJobPage /> },
          { path: '/jobs/:id', element: <JobDetailPage /> },
          { path: '/jobs/:id/edit', element: <EditJobPage /> },
          { path: '/clients', element: <ClientsPage /> },
          { path: '/clients/new', element: <NewClientPage /> },
          { path: '/clients/:id', element: <ClientDetailPage /> },
          { path: '/quotes', element: <QuotesPage /> },
          { path: '/quotes/:id', element: <QuoteDetailPage /> },
          { path: '/invoices', element: <InvoicesPage /> },
          { path: '/invoices/:id', element: <InvoiceDetailPage /> },
          { path: '/settings', element: <SettingsPage /> },
          { path: '/admin', element: <AdminPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);

