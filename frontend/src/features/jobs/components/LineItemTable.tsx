import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { CurrencyDisplay } from '../../../components/CurrencyDisplay';
import { formatPercent } from '../../../utils';
import type { LineItem, LineItemCategory } from '../../../types';

const lineItemSchema = z.object({
  description: z.string().min(1, 'Required'),
  category: z.enum(['labour', 'materials', 'equipment', 'subcontractor', 'other']),
  quantity: z.coerce.number().positive('Must be positive'),
  unit: z.string().min(1, 'Required'),
  unitCost: z.coerce.number().min(0),
  unitPrice: z.coerce.number().min(0),
});

type LineItemFormValues = z.infer<typeof lineItemSchema>;

interface LineItemTableProps {
  items: LineItem[];
  onAdd: (values: LineItemFormValues) => void;
  onDelete: (id: string) => void;
}

const categoryColor: Record<LineItemCategory, string> = {
  labour: 'bg-blue-lt',
  materials: 'bg-orange-lt',
  equipment: 'bg-purple-lt',
  subcontractor: 'bg-pink-lt',
  other: 'bg-secondary-lt',
};

export const LineItemTable = ({ items, onAdd, onDelete }: LineItemTableProps) => {
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<LineItemFormValues>({
    resolver: zodResolver(lineItemSchema),
    defaultValues: {
      category: 'labour',
      quantity: 1,
      unit: 'hrs',
      unitCost: 0,
      unitPrice: 0,
      description: '',
    },
  });

  const quantity = useWatch({ control, name: 'quantity' });
  const unitCost = useWatch({ control, name: 'unitCost' });
  const unitPrice = useWatch({ control, name: 'unitPrice' });

  const previewTotalCost = Math.round((Number.isFinite(quantity) ? quantity : 0) * (Number.isFinite(unitCost) ? unitCost * 100 : 0));
  const previewTotalPrice = Math.round((Number.isFinite(quantity) ? quantity : 0) * (Number.isFinite(unitPrice) ? unitPrice * 100 : 0));

  const totals = useMemo(() => {
    const totalCost = items.reduce((acc, item) => acc + item.totalCost, 0);
    const totalPrice = items.reduce((acc, item) => acc + item.totalPrice, 0);
    const margin = totalPrice ? ((totalPrice - totalCost) / totalPrice) * 100 : 0;
    return { totalCost, totalPrice, margin };
  }, [items]);

  return (
    <div className="table-responsive">
      <table className="table table-vcenter card-table">
        <thead>
          <tr>
            <th>Description</th>
            <th>Category</th>
            <th>Qty</th>
            <th>Unit</th>
            <th>Unit Cost</th>
            <th>Unit Price</th>
            <th>Total Cost</th>
            <th>Total Price</th>
            <th>Margin</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const margin = item.totalPrice ? ((item.totalPrice - item.totalCost) / item.totalPrice) * 100 : 0;
            return (
              <tr key={item.id}>
                <td>{item.description}</td>
                <td>
                  <span className={`badge ${categoryColor[item.category]}`}>{item.category}</span>
                </td>
                <td>{item.quantity}</td>
                <td>{item.unit}</td>
                <td><CurrencyDisplay cents={item.unitCost} /></td>
                <td><CurrencyDisplay cents={item.unitPrice} /></td>
                <td><CurrencyDisplay cents={item.totalCost} /></td>
                <td><CurrencyDisplay cents={item.totalPrice} /></td>
                <td>{formatPercent(margin)}</td>
                <td>
                  <button className="btn btn-sm btn-ghost-danger" onClick={() => onDelete(item.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            );
          })}

          <tr className="bg-light">
            <td>
              <input
                className="form-control form-control-sm"
                placeholder="Add line item"
                {...register('description')}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') reset();
                }}
              />
              {errors.description ? <small className="text-danger">{errors.description.message}</small> : null}
            </td>
            <td>
              <select className="form-select form-select-sm" {...register('category')}>
                <option value="labour">Labour</option>
                <option value="materials">Materials</option>
                <option value="equipment">Equipment</option>
                <option value="subcontractor">Subcontractor</option>
                <option value="other">Other</option>
              </select>
            </td>
            <td><input className="form-control form-control-sm" type="number" step="0.01" {...register('quantity')} /></td>
            <td><input className="form-control form-control-sm" {...register('unit')} /></td>
            <td><input className="form-control form-control-sm" type="number" step="0.01" {...register('unitCost')} /></td>
            <td><input className="form-control form-control-sm" type="number" step="0.01" {...register('unitPrice')} /></td>
            <td><CurrencyDisplay cents={previewTotalCost} /></td>
            <td><CurrencyDisplay cents={previewTotalPrice} /></td>
            <td>{previewTotalPrice ? formatPercent(((previewTotalPrice - previewTotalCost) / previewTotalPrice) * 100) : '-'}</td>
            <td>
              <button
                className="btn btn-sm btn-primary"
                onClick={handleSubmit((values) => {
                  onAdd(values);
                  reset();
                })}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    void handleSubmit((values) => {
                      onAdd(values);
                      reset();
                    })();
                  }
                }}
              >
                Save
              </button>
            </td>
          </tr>

          <tr className="fw-bold">
            <td colSpan={6}>Totals</td>
            <td><CurrencyDisplay cents={totals.totalCost} /></td>
            <td><CurrencyDisplay cents={totals.totalPrice} /></td>
            <td>{formatPercent(totals.margin)}</td>
            <td />
          </tr>
        </tbody>
      </table>
    </div>
  );
};

