import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { loadStripe } from '@stripe/stripe-js';
import type { Stripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import toast from 'react-hot-toast';
import { getPublicInvoice, createInvoicePaymentIntent, getPublicConfig } from '../../../api/portal';
import type { PublicInvoice } from '../../../api/portal';

function formatCents(cents: number) {
  return `£${(Number(cents) / 100).toFixed(2)}`;
}

function formatDate(d: string | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Stripe checkout form ─────────────────────────────────────────────────────

const CheckoutForm = ({
  invoice,
  onSuccess,
}: {
  invoice: PublicInvoice;
  onSuccess: () => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    const { error } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (error) {
      toast.error(error.message ?? 'Payment failed. Please try again.');
    } else {
      onSuccess();
    }
    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button
        type="submit"
        className="btn btn-primary w-100 mt-3"
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? 'Processing…' : `Pay ${formatCents(invoice.totalGross)}`}
      </button>
    </form>
  );
};

// ── Main invoice portal page ─────────────────────────────────────────────────

export const PublicInvoicePage = () => {
  const { token } = useParams<{ token: string }>();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);

  // Load public config (includes Stripe publishable key from DB) once
  useQuery({
    queryKey: ['public-config'],
    queryFn: async () => {
      const config = await getPublicConfig();
      const key = config.stripePublishableKey ?? (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined);
      setStripePromise(key ? loadStripe(key) : null);
      return config;
    },
  });

  const { data: invoice, isLoading, isError } = useQuery({
    queryKey: ['public-invoice', token],
    queryFn: () => getPublicInvoice(token!),
    enabled: Boolean(token),
  });

  const createIntent = useMutation({
    mutationFn: () => createInvoicePaymentIntent(token!),
    onSuccess: (data) => setClientSecret(data.clientSecret),
    onError: () => toast.error('Unable to start payment. Please try again.'),
  });

  if (isLoading) {
    return <div className="text-center py-5"><div className="spinner-border text-primary" /></div>;
  }

  if (isError || !invoice) {
    return (
      <div className="card card-body text-center py-5">
        <h3>Invoice not found</h3>
        <p className="text-secondary">This link may have expired or is invalid.</p>
      </div>
    );
  }

  const isAlreadyPaid = paid || invoice.status === 'paid';

  return (
    <div className="row justify-content-center">
      <div className="col-lg-8">
        {/* Contractor header */}
        <div className="card mb-3">
          <div className="card-body d-flex justify-content-between align-items-start">
            <div>
              {invoice.contractor.logoUrl && (
                <img src={invoice.contractor.logoUrl} alt="logo" style={{ height: 48, marginBottom: 8 }} />
              )}
              <div className="fw-bold fs-5">{invoice.contractor.companyName ?? 'Your Contractor'}</div>
              {invoice.contractor.companyAddress && (
                <div className="text-secondary small">{invoice.contractor.companyAddress}</div>
              )}
            </div>
            <div className="text-end">
              <div className="text-secondary small">INVOICE</div>
              <div className="fw-bold">#{invoice.invoiceNumber}</div>
              <div className="text-secondary small">Issued {formatDate(invoice.createdAt)}</div>
              <div className="text-secondary small">Due {formatDate(invoice.dueDate)}</div>
            </div>
          </div>
        </div>

        {/* Paid banner */}
        {isAlreadyPaid && (
          <div className="alert alert-success mb-4">
            <strong>✓ Payment received{invoice.paidAt ? ` on ${formatDate(invoice.paidAt)}` : ''}.</strong> Thank you!
          </div>
        )}

        {/* Bill to */}
        <div className="card mb-3">
          <div className="card-body">
            <div className="text-secondary small mb-1">FOR</div>
            <div className="fw-bold">{invoice.job.client?.name ?? 'Client'}</div>
            <div className="text-secondary">{invoice.job.title}</div>
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
                {invoice.job.lineItems.map((item) => (
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
                  <div>{formatCents(invoice.totalNet)}</div>
                </div>
                <div className="d-flex gap-4">
                  <div className="text-secondary">VAT ({invoice.vatRate}%)</div>
                  <div>{formatCents(invoice.vatAmount)}</div>
                </div>
                <div className="d-flex gap-4 fw-bold fs-5 mt-1">
                  <div>Total due</div>
                  <div>{formatCents(invoice.totalGross)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes / Terms */}
        {(invoice.notes || invoice.terms) && (
          <div className="card mb-3">
            <div className="card-body">
              {invoice.notes && (
                <div className="mb-3">
                  <div className="text-secondary small mb-1">NOTES</div>
                  <p className="mb-0">{invoice.notes}</p>
                </div>
              )}
              {invoice.terms && (
                <div>
                  <div className="text-secondary small mb-1">TERMS</div>
                  <p className="mb-0">{invoice.terms}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pay now */}
        {!isAlreadyPaid && stripePromise && (
          <div className="card">
            <div className="card-body">
              {!clientSecret ? (
                <button
                  className="btn btn-primary w-100"
                  disabled={createIntent.isPending}
                  onClick={() => createIntent.mutate()}
                >
                  {createIntent.isPending ? 'Loading payment…' : `Pay Now — ${formatCents(invoice.totalGross)}`}
                </button>
              ) : (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <CheckoutForm invoice={invoice} onSuccess={() => setPaid(true)} />
                </Elements>
              )}
            </div>
          </div>
        )}

        {!isAlreadyPaid && !stripePromise && (
          <div className="alert alert-info">
            To pay this invoice, please contact {invoice.contractor.companyName ?? 'your contractor'} directly.
          </div>
        )}
      </div>
    </div>
  );
};
