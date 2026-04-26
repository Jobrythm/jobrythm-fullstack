import { Link, useParams } from 'react-router-dom';
import { CurrencyDisplay } from '../../../components/CurrencyDisplay';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { StatusBadge } from '../../../components/StatusBadge';
import { formatDate } from '../../../utils';
import { useInvoice } from '../hooks/useInvoices';

export const InvoiceDetailPage = () => {
  const { id } = useParams();
  const { data: invoice, isLoading } = useInvoice(id);

  if (isLoading || !invoice) return <LoadingSpinner label="Loading invoice..." />;

  return (
    <div className="card">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div>
            <h2 className="mb-1">{invoice.invoiceNumber}</h2>
            <div className="text-secondary">Job: {invoice.job?.title}</div>
          </div>
          <StatusBadge status={invoice.status} />
        </div>
        <div className="row g-3">
          <div className="col-md-4"><div className="text-secondary">Client</div><div>{invoice.job?.client?.name ?? '-'}</div></div>
          <div className="col-md-4"><div className="text-secondary">Due Date</div><div>{formatDate(invoice.dueDate)}</div></div>
          <div className="col-md-4"><div className="text-secondary">Total</div><div><CurrencyDisplay cents={invoice.totalGross} /></div></div>
        </div>
        <hr />
        <div className="mb-3">
          <h4>Notes</h4>
          <p className="text-secondary">{invoice.notes || 'No notes'}</p>
        </div>
        <div className="mb-3">
          <h4>Terms</h4>
          <p className="text-secondary">{invoice.terms || 'No terms'}</p>
        </div>
        {invoice.jobId ? <Link className="btn btn-primary" to={`/jobs/${invoice.jobId}`}>Open job</Link> : null}
      </div>
    </div>
  );
};

