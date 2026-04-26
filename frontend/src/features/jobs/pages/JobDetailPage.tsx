import { IconFileText, IconReceipt } from '@tabler/icons-react';
import { addDays } from 'date-fns';
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ApiErrorAlert } from '../../../components/ApiErrorAlert';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { CurrencyDisplay } from '../../../components/CurrencyDisplay';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { StatusBadge } from '../../../components/StatusBadge';
import { formatDate, formatPercent, getMarginColor } from '../../../utils';
import { useInvoices } from '../../invoices/hooks/useInvoices';
import { LineItemTable } from '../components/LineItemTable';
import {
  useCreateLineItem,
  useDeleteLineItem,
  useGenerateInvoice,
  useGenerateQuote,
  useJob,
  useUpdateJobStatus,
  useUpdateJob,
} from '../hooks/useJobs';
import { useDownloadQuotePdf, useQuotes, useSendQuote, useUpdateQuote } from '../../quotes/hooks/useQuotes';
import { useDownloadInvoicePdf, useMarkInvoicePaid, useSendInvoice } from '../../invoices/hooks/useInvoices';
import type { JobStatus } from '../../../types';

const statusOptions: JobStatus[] = ['draft', 'quoted', 'active', 'completed', 'invoiced'];

export const JobDetailPage = () => {
  const { id } = useParams();
  const [tab, setTab] = useState<'overview' | 'line-items' | 'quote' | 'invoice'>('overview');
  const [deleteLineItemId, setDeleteLineItemId] = useState<string | null>(null);
  const { data: job, isLoading, isError, error } = useJob(id);
  const updateJob = useUpdateJob();
  const updateJobStatus = useUpdateJobStatus();
  const createLineItem = useCreateLineItem();
  const deleteLineItem = useDeleteLineItem();
  const { data: quotesResponse } = useQuotes();
  const { data: invoicesResponse } = useInvoices();
  const generateQuote = useGenerateQuote();
  const generateInvoice = useGenerateInvoice();
  const updateQuote = useUpdateQuote();
  const sendQuote = useSendQuote();
  const sendInvoice = useSendInvoice();
  const markInvoicePaid = useMarkInvoicePaid();
  const downloadQuotePdf = useDownloadQuotePdf();
  const downloadInvoicePdf = useDownloadInvoicePdf();

  const quote = useMemo(() => (quotesResponse?.items ?? []).find((item) => item.jobId === id), [quotesResponse?.items, id]);
  const invoice = useMemo(() => (invoicesResponse?.items ?? []).find((item) => item.jobId === id), [invoicesResponse?.items, id]);

  const openPdfBlob = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.rel = 'noopener noreferrer';
    link.target = '_blank';
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  if (isLoading) return <LoadingSpinner label="Loading job..." />;
  if (isError) return <ApiErrorAlert error={(error as Error).message} />;
  if (!job) return <ApiErrorAlert error="Job not found" />;

  return (
    <div className="row g-3">
      <div className="col-12">
        <div className="card">
          <div className="card-body d-flex flex-wrap justify-content-between gap-3 align-items-start">
            <div>
              <input
                className="form-control form-control-flush fs-2 fw-bold px-0"
                defaultValue={job.title}
                onBlur={(event) => {
                  if (!event.target.value || event.target.value === job.title) return;
                  updateJob.mutate({ id: job.id, payload: { title: event.target.value } }, { onSuccess: () => toast.success('Title updated') });
                }}
              />
              <div className="text-secondary">
                {job.client?.name ?? '-'}
                {job.startDate ? ` - ${formatDate(job.startDate)}` : ''}
                {job.endDate ? ` to ${formatDate(job.endDate)}` : ''}
              </div>
            </div>
            <div className="d-flex align-items-center gap-2">
              <StatusBadge status={job.status} />
              <select
                className="form-select"
                value={job.status}
                onChange={(event) => {
                  updateJobStatus.mutate(
                    { id: job.id, payload: { status: event.target.value as JobStatus } },
                    { onSuccess: () => toast.success('Status updated') },
                  );
                }}
              >
                {statusOptions.map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="card-footer">
            <ul className="nav nav-tabs card-header-tabs">
              <li className="nav-item"><button className={`nav-link ${tab === 'overview' ? 'active' : ''}`} onClick={() => setTab('overview')}>Overview</button></li>
              <li className="nav-item"><button className={`nav-link ${tab === 'line-items' ? 'active' : ''}`} onClick={() => setTab('line-items')}>Line Items</button></li>
              <li className="nav-item"><button className={`nav-link ${tab === 'quote' ? 'active' : ''}`} onClick={() => setTab('quote')}>Quote</button></li>
              <li className="nav-item"><button className={`nav-link ${tab === 'invoice' ? 'active' : ''}`} onClick={() => setTab('invoice')}>Invoice</button></li>
            </ul>
          </div>
        </div>
      </div>

      {tab === 'overview' ? (
        <>
          <div className="col-12">
            <div className="card">
              <div className="card-header"><h3 className="card-title">Description</h3></div>
              <div className="card-body">
                <textarea
                  className="form-control"
                  rows={4}
                  defaultValue={job.description}
                  onBlur={(event) => {
                    if (event.target.value === job.description) return;
                    updateJob.mutate({ id: job.id, payload: { description: event.target.value } }, { onSuccess: () => toast.success('Description updated') });
                  }}
                />
              </div>
            </div>
          </div>
          <div className="col-md-4"><div className="card"><div className="card-body"><div className="text-secondary">Total Cost</div><h2><CurrencyDisplay cents={job.totalCost} /></h2></div></div></div>
          <div className="col-md-4"><div className="card"><div className="card-body"><div className="text-secondary">Total Revenue</div><h2><CurrencyDisplay cents={job.totalRevenue} /></h2></div></div></div>
          <div className="col-md-4"><div className="card"><div className="card-body"><div className="text-secondary">Margin</div><h2 className={getMarginColor(job.marginPercent)}>{formatPercent(job.marginPercent)}</h2></div></div></div>
        </>
      ) : null}

      {tab === 'line-items' ? (
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <LineItemTable
                items={job.lineItems}
                onAdd={(values) => {
                  createLineItem.mutate(
                    {
                      jobId: job.id,
                      payload: {
                        ...values,
                        unitCost: Math.round(values.unitCost * 100),
                        unitPrice: Math.round(values.unitPrice * 100),
                      },
                    },
                    {
                      onSuccess: () => toast.success('Line item added'),
                      onError: (err: Error) => toast.error(err.message),
                    },
                  );
                }}
                onDelete={(lineItemId) => setDeleteLineItemId(lineItemId)}
              />
            </div>
          </div>
        </div>
      ) : null}

      {tab === 'quote' ? (
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              {!quote ? (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    generateQuote.mutate(
                      {
                        jobId: job.id,
                        payload: {
                          validUntil: addDays(new Date(), 14).toISOString(),
                          vatRate: 20,
                          notes: '',
                          terms: 'Payment due in 14 days.',
                        },
                      },
                      {
                        onSuccess: () => toast.success('Quote generated'),
                        onError: (err: Error) => toast.error(err.message),
                      },
                    );
                  }}
                >
                  Generate Quote
                </button>
              ) : (
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="card bg-light">
                      <div className="card-body">
                        <div className="d-flex justify-content-between">
                          <h3>{quote.quoteNumber}</h3>
                          <StatusBadge status={quote.status} />
                        </div>
                        <p className="text-secondary">Valid until {formatDate(quote.validUntil)}</p>
                        <h2><CurrencyDisplay cents={quote.totalGross} /></h2>
                        <div className="btn-list">
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => {
                              downloadQuotePdf.mutate(quote.id, {
                                onSuccess: (blob) => openPdfBlob(blob, `${quote.quoteNumber}.pdf`),
                                onError: (err: Error) => toast.error(err.message),
                              });
                            }}
                          >
                            <IconFileText size={16} className="me-1" /> Preview PDF
                          </button>
                          <button
                            className="btn btn-primary"
                            disabled={sendQuote.isPending}
                            onClick={() =>
                              sendQuote.mutate(quote.id, {
                                onSuccess: (result) => toast.success(result.message ?? 'Quote sent'),
                                onError: (err: Error) => toast.error(err.message),
                              })
                            }
                          >
                            {sendQuote.isPending ? 'Sending...' : 'Send to Client'}
                          </button>
                        </div>
                        <div className="btn-list mt-3">
                          <button className="btn btn-sm" onClick={() => updateQuote.mutate({ id: quote.id, payload: { status: 'accepted' } })}>Mark Accepted</button>
                          <button className="btn btn-sm" onClick={() => updateQuote.mutate({ id: quote.id, payload: { status: 'rejected' } })}>Mark Rejected</button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Notes</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      defaultValue={quote.notes}
                      onBlur={(event) => updateQuote.mutate({ id: quote.id, payload: { notes: event.target.value } })}
                    />
                    <label className="form-label mt-3">Terms</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      defaultValue={quote.terms}
                      onBlur={(event) => updateQuote.mutate({ id: quote.id, payload: { terms: event.target.value } })}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {tab === 'invoice' ? (
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              {!invoice ? (
                <>
                  {quote?.status === 'accepted' ? (
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        generateInvoice.mutate(
                          {
                            jobId: job.id,
                            payload: {
                              dueDate: addDays(new Date(), 14).toISOString(),
                              vatRate: quote.vatRate,
                              terms: quote.terms,
                              notes: quote.notes,
                            },
                          },
                          { onSuccess: () => toast.success('Invoice created from quote') },
                        );
                      }}
                    >
                      Convert Quote to Invoice
                    </button>
                  ) : (
                    <p className="text-secondary mb-0">No invoice yet. Accept a quote to convert it into an invoice.</p>
                  )}
                </>
              ) : (
                <div className="card bg-light">
                  <div className="card-body">
                    <div className="d-flex justify-content-between">
                      <h3>{invoice.invoiceNumber}</h3>
                      <StatusBadge status={invoice.status} />
                    </div>
                    <p className="text-secondary">Due {formatDate(invoice.dueDate)}</p>
                    <h2><CurrencyDisplay cents={invoice.totalGross} /></h2>
                    <div className="btn-list">
                      <button
                        className="btn btn-outline-primary"
                        onClick={() => {
                          downloadInvoicePdf.mutate(invoice.id, {
                            onSuccess: (blob) => openPdfBlob(blob, `${invoice.invoiceNumber}.pdf`),
                            onError: (err: Error) => toast.error(err.message),
                          });
                        }}
                      >
                        <IconReceipt size={16} className="me-1" /> Preview PDF
                      </button>
                      <button
                        className="btn btn-primary"
                        disabled={sendInvoice.isPending}
                        onClick={() => sendInvoice.mutate(invoice.id, {
                          onSuccess: (result) => toast.success(result.message ?? 'Invoice sent'),
                          onError: (err: Error) => toast.error(err.message),
                        })}
                      >
                        {sendInvoice.isPending ? 'Sending...' : 'Send to Client'}
                      </button>
                      {invoice.status !== 'paid' ? (
                        <button
                          className="btn btn-primary"
                          onClick={() => markInvoicePaid.mutate(invoice.id, { onSuccess: () => toast.success('Invoice marked as paid') })}
                        >
                          Mark as paid
                        </button>
                      ) : null}
                      <Link className="btn" to={`/invoices/${invoice.id}`}>Open invoice</Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmModal
        open={Boolean(deleteLineItemId)}
        title="Delete line item"
        body="This line item will be removed from totals."
        confirmLabel="Delete"
        onClose={() => setDeleteLineItemId(null)}
        onConfirm={() => {
          if (!deleteLineItemId) return;
          deleteLineItem.mutate(deleteLineItemId, {
            onSuccess: () => {
              toast.success('Line item deleted');
              setDeleteLineItemId(null);
            },
          });
        }}
      />
    </div>
  );
};

