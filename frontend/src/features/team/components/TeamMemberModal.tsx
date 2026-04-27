import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { TeamMember } from '../../../api/team';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  role: z.enum(['owner', 'manager', 'technician']),
  notes: z.string().optional(),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  member?: TeamMember | null;
  onSubmit: (values: FormValues) => void;
  onClose: () => void;
  onDelete?: () => void;
  isLoading?: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  manager: 'Manager',
  technician: 'Technician / Field staff',
};

export const TeamMemberModal = ({ member, onSubmit, onClose, onDelete, isLoading }: Props) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      role: 'technician',
      notes: '',
      isActive: true,
    },
  });

  useEffect(() => {
    if (member) {
      form.reset({
        name: member.name,
        email: member.email ?? '',
        phone: member.phone ?? '',
        role: member.role,
        notes: member.notes ?? '',
        isActive: member.isActive,
      });
    } else {
      form.reset({ name: '', email: '', phone: '', role: 'technician', notes: '', isActive: true });
    }
  }, [member, form]);

  return (
    <div className="modal modal-blur fade show d-block" tabIndex={-1} role="dialog">
      <div className="modal-dialog modal-dialog-centered" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{member ? 'Edit team member' : 'Add team member'}</h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="modal-body">
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label required">Name</label>
                  <input className="form-control" placeholder="Jane Smith" {...form.register('name')} />
                  {form.formState.errors.name && (
                    <div className="invalid-feedback d-block">{form.formState.errors.name.message}</div>
                  )}
                </div>

                <div className="col-md-6">
                  <label className="form-label">Email</label>
                  <input className="form-control" type="email" placeholder="jane@example.com" {...form.register('email')} />
                  {form.formState.errors.email && (
                    <div className="invalid-feedback d-block">{form.formState.errors.email.message}</div>
                  )}
                </div>

                <div className="col-md-6">
                  <label className="form-label">Phone</label>
                  <input className="form-control" placeholder="+1 555 000 0000" {...form.register('phone')} />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Role</label>
                  <select className="form-select" {...form.register('role')}>
                    {Object.entries(ROLE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                <div className="col-md-6 d-flex align-items-end">
                  <label className="form-check form-switch">
                    <input className="form-check-input" type="checkbox" role="switch" {...form.register('isActive')} />
                    <span className="form-check-label">Active</span>
                  </label>
                </div>

                <div className="col-12">
                  <label className="form-label">Notes</label>
                  <textarea className="form-control" rows={2} placeholder="Skills, availability, etc." {...form.register('notes')} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              {onDelete && (
                <button type="button" className="btn btn-danger me-auto" onClick={onDelete}>
                  Delete
                </button>
              )}
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={isLoading}>
                {isLoading ? 'Saving…' : member ? 'Save changes' : 'Add member'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
