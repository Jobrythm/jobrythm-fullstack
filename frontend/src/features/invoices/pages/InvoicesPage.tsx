import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CurrencyDisplay } from '../../../components/CurrencyDisplay';
import { TableSkeleton } from '../../../components/TableSkeleton';
import { StatusBadge } from '../../../components/StatusBadge';
import { formatDate } from '../../../utils';
import { useInvoices } from '../hooks/useInvoices';
import type { Invoice } from '../../../types';

const statuses: Array<'all' | Invoice['status']> = ['all', 'draft', 'sent', 'paid', 'overdue'];

export const InvoicesPage = () => {
  const [status, setStatus] = useState<'all' | Invoice['status']>('all');
  const { data: invoicesResponse, isLoading } = useInvoices(status === 'all' ? undefined : { status });
  const invoices = invoicesResponse?.items ?? [];

  return (
    <div className="card">
      <div className="card-header">
        <div className="btn-list">
          {statuses.map((value) => (
            <button key={value} className={`btn btn-sm ${status === value ? 'btn-primary' : ''}`} onClick={() => setStatus(value)}>
              {value}
            </button>
          ))}
        </div>
      </div>
      {isLoading ? (
        <TableSkeleton rows={6} columns={8} />
      ) : (
        <div className="table-responsive">
          <table className="table table-vcenter card-table">
            <thead>
              <tr><th>Invoice #</th><th>Client</th><th>Job title</th><th>Status</th><th>Total</th><th>Due</th><th>Paid</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td>{invoice.invoiceNumber}</td>
                  <td>{invoice.job?.client?.name ?? '-'}</td>
                  <td>{invoice.job?.title ?? '-'}</td>
                  <td><StatusBadge status={invoice.status} /></td>
                  <td><CurrencyDisplay cents={invoice.totalGross} /></td>
                  <td>{formatDate(invoice.dueDate)}</td>
                  <td>{invoice.paidAt ? formatDate(invoice.paidAt) : '-'}</td>
                  <td><Link className="btn btn-sm" to={`/invoices/${invoice.id}`}>View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

