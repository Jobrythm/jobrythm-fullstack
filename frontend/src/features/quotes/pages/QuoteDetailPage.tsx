import { Link, useParams } from 'react-router-dom';
import { CurrencyDisplay } from '../../../components/CurrencyDisplay';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { StatusBadge } from '../../../components/StatusBadge';
import { formatDate } from '../../../utils';
import { useQuote } from '../hooks/useQuotes';

export const QuoteDetailPage = () => {
  const { id } = useParams();
  const { data: quote, isLoading } = useQuote(id);

  if (isLoading || !quote) return <LoadingSpinner label="Loading quote..." />;

  return (
    <div className="card">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div>
            <h2 className="mb-1">{quote.quoteNumber}</h2>
            <div className="text-secondary">Job: {quote.job?.title}</div>
          </div>
          <StatusBadge status={quote.status} />
        </div>
        <div className="row g-3">
          <div className="col-md-4"><div className="text-secondary">Client</div><div>{quote.job?.client?.name ?? '-'}</div></div>
          <div className="col-md-4"><div className="text-secondary">Valid Until</div><div>{formatDate(quote.validUntil)}</div></div>
          <div className="col-md-4"><div className="text-secondary">Total</div><div><CurrencyDisplay cents={quote.totalGross} /></div></div>
        </div>
        <hr />
        <div className="mb-3">
          <h4>Notes</h4>
          <p className="text-secondary">{quote.notes || 'No notes'}</p>
        </div>
        <div className="mb-3">
          <h4>Terms</h4>
          <p className="text-secondary">{quote.terms || 'No terms'}</p>
        </div>
        {quote.jobId ? <Link className="btn btn-primary" to={`/jobs/${quote.jobId}`}>Open job</Link> : null}
      </div>
    </div>
  );
};

