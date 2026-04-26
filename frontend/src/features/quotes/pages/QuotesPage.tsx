import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CurrencyDisplay } from '../../../components/CurrencyDisplay';
import { TableSkeleton } from '../../../components/TableSkeleton';
import { StatusBadge } from '../../../components/StatusBadge';
import { formatDate } from '../../../utils';
import { useQuotes } from '../hooks/useQuotes';
import type { Quote } from '../../../types';

const statuses: Array<'all' | Quote['status']> = ['all', 'draft', 'sent', 'accepted', 'rejected'];

export const QuotesPage = () => {
  const [status, setStatus] = useState<'all' | Quote['status']>('all');
  const { data: quotesResponse, isLoading } = useQuotes(status === 'all' ? undefined : { status });
  const quotes = quotesResponse?.items ?? [];

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
              <tr><th>Quote #</th><th>Client</th><th>Job title</th><th>Status</th><th>Total</th><th>Valid Until</th><th>Sent</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {quotes.map((quote) => (
                <tr key={quote.id}>
                  <td>{quote.quoteNumber}</td>
                  <td>{quote.job?.client?.name ?? '-'}</td>
                  <td>{quote.job?.title ?? '-'}</td>
                  <td><StatusBadge status={quote.status} /></td>
                  <td><CurrencyDisplay cents={quote.totalGross} /></td>
                  <td>{formatDate(quote.validUntil)}</td>
                  <td>{quote.sentAt ? formatDate(quote.sentAt) : '-'}</td>
                  <td><Link className="btn btn-sm" to={`/quotes/${quote.id}`}>View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

