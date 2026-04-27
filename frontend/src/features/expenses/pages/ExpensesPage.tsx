import { zodResolver } from '@hookform/resolvers/zod';
import { IconEdit, IconPlus, IconTrash } from '@tabler/icons-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { EmptyState } from '../../../components/EmptyState';
import { CurrencyDisplay } from '../../../components/CurrencyDisplay';
import {
  useCreateExpense,
  useDeleteExpense,
  useExpenseSummary,
  useExpenses,
  useUpdateExpense,
} from '../hooks/useExpenses';
import type { Expense } from '../../../api/expenses';

const CATEGORIES = ['materials', 'labour', 'equipment', 'fuel', 'subcontractor', 'other'] as const;

const expenseSchema = z.object({
  description: z.string().min(1, 'Required'),
  amountDollars: z.coerce.number().min(0.01, 'Amount required'),
  category: z.enum(CATEGORIES),
  date: z.string().min(1, 'Date required'),
  jobId: z.string().optional(),
  isBillable: z.boolean().default(false),
  notes: z.string().optional(),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

const categoryBadge: Record<string, string> = {
  materials: 'bg-orange-lt',
  labour: 'bg-blue-lt',
  equipment: 'bg-purple-lt',
  fuel: 'bg-yellow-lt',
  subcontractor: 'bg-pink-lt',
  other: 'bg-secondary-lt',
};

const today = () => new Date().toISOString().split('T')[0];

export const ExpensesPage = () => {
  const { data: expenses = [], isLoading } = useExpenses();
  const { data: summary } = useExpenseSummary();
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { category: 'other', date: today(), isBillable: false },
  });

  const openEdit = (expense: Expense) => {
    setEditingId(expense.id);
    reset({
      description: expense.description,
      amountDollars: expense.amountCents / 100,
      category: expense.category as typeof CATEGORIES[number],
      date: expense.date,
      jobId: expense.jobId ?? '',
      isBillable: expense.isBillable,
      notes: expense.notes ?? '',
    });
    setShowForm(true);
  };

  const openNew = () => {
    setEditingId(null);
    reset({ category: 'other', date: today(), isBillable: false });
    setShowForm(true);
  };

  const onSubmit = (values: ExpenseFormValues) => {
    const payload = {
      description: values.description,
      amountCents: Math.round(values.amountDollars * 100),
      category: values.category,
      date: values.date,
      jobId: values.jobId || undefined,
      isBillable: values.isBillable,
      notes: values.notes || undefined,
    };
    if (editingId) {
      updateExpense.mutate(
        { id: editingId, payload },
        { onSuccess: () => { reset(); setShowForm(false); setEditingId(null); } }
      );
    } else {
      createExpense.mutate(payload, {
        onSuccess: () => { reset(); setShowForm(false); },
      });
    }
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amountCents), 0);

  return (
    <div className="page-body">
      <div className="container-xl">
        <div className="page-header mb-3">
          <div className="row align-items-center">
            <div className="col">
              <h2 className="page-title">Expenses</h2>
            </div>
            <div className="col-auto">
              <button className="btn btn-primary" onClick={openNew}>
                <IconPlus size={16} className="me-1" />
                Add Expense
              </button>
            </div>
          </div>
        </div>

        {/* Summary cards */}
        <div className="row row-cards mb-3">
          <div className="col-sm-6 col-lg-3">
            <div className="card card-sm">
              <div className="card-body">
                <div className="row align-items-center">
                  <div className="col-auto">
                    <span className="bg-orange text-white avatar">$</span>
                  </div>
                  <div className="col">
                    <div className="font-weight-medium">Total Expenses</div>
                    <div className="text-secondary"><CurrencyDisplay cents={totalExpenses} /></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {summary && (
            <div className="col-sm-6 col-lg-3">
              <div className="card card-sm">
                <div className="card-body">
                  <div className="row align-items-center">
                    <div className="col-auto">
                      <span className="bg-blue text-white avatar">B</span>
                    </div>
                    <div className="col">
                      <div className="font-weight-medium">Billable</div>
                      <div className="text-secondary">
                        <CurrencyDisplay cents={Number(summary.billableTotal ?? 0)} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Expense form */}
        {showForm && (
          <div className="card mb-3">
            <div className="card-header">
              <h3 className="card-title">{editingId ? 'Edit Expense' : 'Add Expense'}</h3>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Description *</label>
                    <input type="text" className="form-control" placeholder="e.g. Copper fittings" {...register('description')} />
                    {errors.description && <div className="invalid-feedback d-block">{errors.description.message}</div>}
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Amount ($) *</label>
                    <input type="number" step="0.01" min="0" className="form-control" {...register('amountDollars')} />
                    {errors.amountDollars && <div className="invalid-feedback d-block">{errors.amountDollars.message}</div>}
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Date *</label>
                    <input type="date" className="form-control" {...register('date')} />
                    {errors.date && <div className="invalid-feedback d-block">{errors.date.message}</div>}
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Category</label>
                    <select className="form-select" {...register('category')}>
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Notes</label>
                    <input type="text" className="form-control" placeholder="Optional notes" {...register('notes')} />
                  </div>
                  <div className="col-md-3 d-flex align-items-end">
                    <label className="form-check form-switch">
                      <input className="form-check-input" type="checkbox" {...register('isBillable')} />
                      <span className="form-check-label">Billable to client</span>
                    </label>
                  </div>
                  <div className="col-12 d-flex gap-2">
                    <button type="submit" className="btn btn-primary" disabled={createExpense.isPending || updateExpense.isPending}>
                      {editingId ? 'Update' : 'Add Expense'}
                    </button>
                    <button type="button" className="btn btn-ghost-secondary" onClick={() => { setShowForm(false); setEditingId(null); reset(); }}>
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Expenses table */}
        <div className="card">
          <div className="card-body p-0">
            {isLoading ? (
              <div className="p-4 text-muted">Loading expenses…</div>
            ) : expenses.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  icon={<IconPlus size={40} className="text-muted" />}
                  title="No expenses yet"
                  description="Track materials, fuel, subcontractors, and other job costs."
                />
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-vcenter card-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Category</th>
                      <th>Amount</th>
                      <th>Billable</th>
                      <th>Notes</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((e) => (
                      <tr key={e.id}>
                        <td className="text-nowrap text-muted">{e.date}</td>
                        <td>{e.description}</td>
                        <td>
                          <span className={`badge ${categoryBadge[e.category] ?? 'bg-secondary-lt'}`}>
                            {e.category}
                          </span>
                        </td>
                        <td className="fw-medium"><CurrencyDisplay cents={Number(e.amountCents)} /></td>
                        <td>
                          {e.isBillable ? (
                            <span className="badge bg-blue-lt">Billable</span>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td className="text-muted">{e.notes || '—'}</td>
                        <td>
                          <div className="d-flex gap-1">
                            <button className="btn btn-ghost-secondary btn-sm btn-icon" onClick={() => openEdit(e)}>
                              <IconEdit size={15} />
                            </button>
                            <button className="btn btn-ghost-danger btn-sm btn-icon" onClick={() => setDeleteId(e.id)}>
                              <IconTrash size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        open={!!deleteId}
        title="Delete expense?"
        body="This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteId) deleteExpense.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
        }}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
};
