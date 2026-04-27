import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getPublicQuote, approvePublicQuote, rejectPublicQuote } from '../../../api/portal';
import type { PublicQuote } from '../../../api/portal';

function formatCents(cents: number) {
  return `£${(Number(cents) / 100).toFixed(2)}`;
}

function formatDate(d: string | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

type ActionState = 'idle' | 'accepted' | 'rejected';

const StatusBanner = ({ status }: { status: PublicQuote['status'] }) => {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    accepted: { bg: 'bg-success-lt', text: 'text-success', label: 'Quote Accepted' },
    rejected: { bg: 'bg-danger-lt', text: 'text-danger', label: 'Quote Declined' },
    expired: { bg: 'bg-warning-lt', text: 'text-warning', label: 'Quote Expired' },
  };
  const s = map[status];
  if (!s) return null;
  return (
    <div className={`alert ${s.bg} ${s.text} mb-4`}>
      <strong>{s.label}</strong>
    </div>
  );
};

export const PublicQuotePage = () => {
  const { token } = useParams<{ token: string }>();
  const [actionState, setActionState] = useState<ActionState>('idle');

  const { data: quote, isLoading, isError } = useQuery({
    queryKey: ['public-quote', token],
    queryFn: () => getPublicQuote(token!),
    enabled: Boolean(token),
  });

  const approve = useMutation({
    mutationFn: () => approvePublicQuote(token!),
    onSuccess: () => setActionState('accepted'),
    onError: () => toast.error('Something went wrong. Please try again.'),
  });

  const reject = useMutation({
    mutationFn: () => rejectPublicQuote(token!),
    onSuccess: () => setActionState('rejected'),
    onError: () => toast.error('Something went wrong. Please try again.'),
  });

  if (isLoading) {
    return <div className="text-center py-5"><div className="spinner-border text-primary" /></div>;
  }

  if (isError || !quote) {
    return (
      <div className="card card-body text-center py-5">
        <h3>Quote not found</h3>
        <p className="text-secondary">This link may have expired or is invalid.</p>
      </div>
    );
  }

  const effectiveStatus = actionState === 'accepted' ? 'accepted' : actionState === 'rejected' ? 'rejected' : quote.status;
  const canAct = effectiveStatus === 'sent' || effectiveStatus === 'draft';

  return (
    <div className="row justify-content-center">
      <div className="col-lg-8">
        {/* Contractor header */}
        <div className="card mb-3">
          <div className="card-body d-flex justify-content-between align-items-start">
            <div>
              {quote.contractor.logoUrl && (
                <img src={quote.contractor.logoUrl} alt="logo" style={{ height: 48, marginBottom: 8 }} />
              )}
              <div className="fw-bold fs-5">{quote.contractor.companyName ?? 'Your Contractor'}</div>
              {quote.contractor.companyAddress && (
                <div className="text-secondary small">{quote.contractor.companyAddress}</div>
              )}
            </div>
            <div className="text-end">
              <div className="text-secondary small">QUOTE</div>
              <div className="fw-bold">#{quote.quoteNumber}</div>
              <div className="text-secondary small">Issued {formatDate(quote.createdAt)}</div>
              <div className="text-secondary small">Valid until {formatDate(quote.validUntil)}</div>
            </div>
          </div>
        </div>

        <StatusBanner status={effectiveStatus} />

        {/* Bill to */}
        <div className="card mb-3">
          <div className="card-body">
            <div className="text-secondary small mb-1">FOR</div>
            <div className="fw-bold">{quote.job.client?.name ?? 'Client'}</div>
            <div className="text-secondary">{quote.job.title}</div>
          </div>
        </div>

        {/* Line items */}
        <div className="card mb-3">
          <div className="table-responsive">
            <table className="table table-vcenter mb-0">
              <thead>
                <tr className="bg-light">
                  <th>Description</th>
                  <th>Category</th>
                  <th className="text-end">Qty</th>
                  <th className="text-end">Unit Price</th>
                  <th className="text-end">Total</th>
                </tr>
              </thead>
              <tbody>
                {quote.job.lineItems.map((item) => (
                  <tr key={item.id}>
                    <td>{item.description}</td>
                    <td className="text-secondary">{item.category}</td>
                    <td className="text-end">{Number(item.quantity)}{item.unit ? ` ${item.unit}` : ''}</td>
                    <td className="text-end">{formatCents(item.unitPrice)}</td>
                    <td className="text-end">{formatCents(item.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card-footer">
            <div className="row justify-content-end">
              <div className="col-auto">
                <div className="d-flex gap-4">
                  <div className="text-secondary">Subtotal</div>
                  <div>{formatCents(quote.totalNet)}</div>
                </div>
                <div className="d-flex gap-4">
                  <div className="text-secondary">VAT ({quote.vatRate}%)</div>
                  <div>{formatCents(quote.vatAmount)}</div>
                </div>
                <div className="d-flex gap-4 fw-bold fs-5 mt-1">
                  <div>Total</div>
                  <div>{formatCents(quote.totalGross)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes / Terms */}
        {(quote.notes || quote.terms) && (
          <div className="card mb-3">
            <div className="card-body">
              {quote.notes && (
                <div className="mb-3">
                  <div className="text-secondary small mb-1">NOTES</div>
                  <p className="mb-0">{quote.notes}</p>
                </div>
              )}
              {quote.terms && (
                <div>
                  <div className="text-secondary small mb-1">TERMS</div>
                  <p className="mb-0">{quote.terms}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action buttons */}
        {canAct && (
          <div className="card">
            <div className="card-body d-flex gap-3 justify-content-end">
              <button
                className="btn btn-outline-danger"
                disabled={reject.isPending}
                onClick={() => reject.mutate()}
              >
                {reject.isPending ? 'Declining…' : 'Decline Quote'}
              </button>
              <button
                className="btn btn-success"
                disabled={approve.isPending}
                onClick={() => approve.mutate()}
              >
                {approve.isPending ? 'Accepting…' : 'Accept Quote'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
