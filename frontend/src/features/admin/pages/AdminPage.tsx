import { zodResolver } from '@hookform/resolvers/zod';
import {
  IconPlus,
  IconShieldLock,
  IconTrash,
  IconUser,
  IconUsers,
  IconEdit,
} from '@tabler/icons-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { z } from 'zod';
import { ApiErrorAlert } from '../../../components/ApiErrorAlert';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { TableSkeleton } from '../../../components/TableSkeleton';
import { useAuth } from '../../../hooks/useAuth';
import type { AdminUser, AdminUserPlan } from '../../../types';
import {
  useAdminCreateUser,
  useAdminDeleteUser,
  useAdminUpdateUser,
  useAdminUsers,
} from '../hooks/useAdminUsers';

const PLANS: AdminUserPlan[] = ['starter', 'pro', 'team', 'admin'];

const planBadgeClass: Record<AdminUserPlan, string> = {
  starter: 'bg-secondary-lt',
  pro: 'bg-blue-lt',
  team: 'bg-indigo-lt',
  admin: 'bg-red-lt',
};

const createSchema = z.object({
  fullName: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Minimum 8 characters'),
  companyName: z.string().optional(),
  plan: z.enum(['starter', 'pro', 'team', 'admin']),
});

const editSchema = z.object({
  fullName: z.string().min(1, 'Required'),
  companyName: z.string().optional(),
  plan: z.enum(['starter', 'pro', 'team', 'admin']),
});

type CreateValues = z.infer<typeof createSchema>;
type EditValues = z.infer<typeof editSchema>;

// ── Create user modal ──────────────────────────────────────────────────────────
const CreateUserModal = ({ onClose }: { onClose: () => void }) => {
  const createUser = useAdminCreateUser();
  const form = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { plan: 'starter' },
  });

  const onSubmit = (values: CreateValues) => {
    createUser.mutate(values, {
      onSuccess: () => {
        toast.success('User created');
        onClose();
      },
      onError: (err: Error) => toast.error(err.message),
    });
  };

  return (
    <div className="modal modal-blur fade show d-block" role="dialog" aria-modal="true">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Create user</h5>
            <button className="btn-close" type="button" onClick={onClose} aria-label="Close" />
          </div>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="modal-body row g-3">
              <div className="col-md-6">
                <label className="form-label">Full name</label>
                <input className="form-control" {...form.register('fullName')} />
                {form.formState.errors.fullName && (
                  <div className="invalid-feedback d-block">{form.formState.errors.fullName.message}</div>
                )}
              </div>
              <div className="col-md-6">
                <label className="form-label">Email</label>
                <input type="email" className="form-control" {...form.register('email')} />
                {form.formState.errors.email && (
                  <div className="invalid-feedback d-block">{form.formState.errors.email.message}</div>
                )}
              </div>
              <div className="col-md-6">
                <label className="form-label">Password</label>
                <input type="password" className="form-control" {...form.register('password')} />
                {form.formState.errors.password && (
                  <div className="invalid-feedback d-block">{form.formState.errors.password.message}</div>
                )}
              </div>
              <div className="col-md-6">
                <label className="form-label">Company name <span className="text-secondary">(optional)</span></label>
                <input className="form-control" {...form.register('companyName')} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Plan / role</label>
                <select className="form-select" {...form.register('plan')}>
                  {PLANS.map((p) => (
                    <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-link link-secondary me-auto" type="button" onClick={onClose}>
                Cancel
              </button>
              <button className="btn btn-primary" type="submit" disabled={createUser.isPending}>
                {createUser.isPending ? 'Creating…' : 'Create user'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// ── Edit user modal ────────────────────────────────────────────────────────────
const EditUserModal = ({ user, onClose }: { user: AdminUser; onClose: () => void }) => {
  const updateUser = useAdminUpdateUser();
  const form = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      fullName: user.fullName,
      companyName: user.companyName ?? '',
      plan: user.plan,
    },
  });

  const onSubmit = (values: EditValues) => {
    updateUser.mutate(
      { id: user.id, payload: values },
      {
        onSuccess: () => {
          toast.success('User updated');
          onClose();
        },
        onError: (err: Error) => toast.error(err.message),
      },
    );
  };

  return (
    <div className="modal modal-blur fade show d-block" role="dialog" aria-modal="true">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Edit user — {user.email}</h5>
            <button className="btn-close" type="button" onClick={onClose} aria-label="Close" />
          </div>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="modal-body row g-3">
              <div className="col-md-6">
                <label className="form-label">Full name</label>
                <input className="form-control" {...form.register('fullName')} />
                {form.formState.errors.fullName && (
                  <div className="invalid-feedback d-block">{form.formState.errors.fullName.message}</div>
                )}
              </div>
              <div className="col-md-6">
                <label className="form-label">Company name</label>
                <input className="form-control" {...form.register('companyName')} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Plan / role</label>
                <select className="form-select" {...form.register('plan')}>
                  {PLANS.map((p) => (
                    <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-link link-secondary me-auto" type="button" onClick={onClose}>
                Cancel
              </button>
              <button className="btn btn-primary" type="submit" disabled={updateUser.isPending}>
                {updateUser.isPending ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// ── Main page ──────────────────────────────────────────────────────────────────
export const AdminPage = () => {
  const { user: currentUser } = useAuth();
  const { data: users = [], isLoading, isError, error } = useAdminUsers();
  const deleteUser = useAdminDeleteUser();

  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  if (isLoading) return <TableSkeleton rows={6} columns={5} />;
  if (isError) return <ApiErrorAlert error={(error as Error).message} />;

  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.plan === 'admin').length;
  const customerCount = users.filter((u) => u.plan !== 'admin').length;

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteUser.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success('User deleted');
        setDeleteTarget(null);
      },
      onError: (err: Error) => {
        toast.error(err.message);
        setDeleteTarget(null);
      },
    });
  };

  return (
    <>
      {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} />}
      {editTarget && <EditUserModal user={editTarget} onClose={() => setEditTarget(null)} />}
      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete user"
        body={`Are you sure you want to permanently delete ${deleteTarget?.fullName} (${deleteTarget?.email})? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />

      {/* Stats row */}
      <div className="row g-3 mb-4">
        <div className="col-sm-4">
          <div className="card card-sm">
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col-auto">
                  <span className="bg-primary text-white avatar"><IconUsers size={18} /></span>
                </div>
                <div className="col">
                  <div className="font-weight-medium">{totalUsers} Total users</div>
                  <div className="text-secondary small">All accounts</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-sm-4">
          <div className="card card-sm">
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col-auto">
                  <span className="bg-red text-white avatar"><IconShieldLock size={18} /></span>
                </div>
                <div className="col">
                  <div className="font-weight-medium">{adminCount} Admin{adminCount !== 1 ? 's' : ''}</div>
                  <div className="text-secondary small">Platform admins</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-sm-4">
          <div className="card card-sm">
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col-auto">
                  <span className="bg-green text-white avatar"><IconUser size={18} /></span>
                </div>
                <div className="col">
                  <div className="font-weight-medium">{customerCount} Customer{customerCount !== 1 ? 's' : ''}</div>
                  <div className="text-secondary small">Starter / Pro / Team</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Users table */}
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h3 className="card-title mb-0">
            <IconUsers size={18} className="me-2 text-primary" />
            User management
          </h3>
          <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
            <IconPlus size={16} className="me-1" />
            New user
          </button>
        </div>
        <div className="table-responsive">
          <table className="table table-vcenter card-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Company</th>
                <th>Plan / role</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-secondary py-4">No users found</td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id}>
                    <td className="fw-semibold">{u.fullName}</td>
                    <td className="text-secondary">{u.email}</td>
                    <td>{u.companyName ?? <span className="text-secondary">—</span>}</td>
                    <td>
                      <span className={`badge ${planBadgeClass[u.plan] ?? 'bg-secondary-lt'} text-capitalize`}>
                        {u.plan}
                      </span>
                    </td>
                    <td className="text-secondary">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="btn-list flex-nowrap">
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => setEditTarget(u)}
                          title="Edit user"
                        >
                          <IconEdit size={14} />
                        </button>
                        {u.id !== currentUser?.id && (
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => setDeleteTarget(u)}
                            title="Delete user"
                          >
                            <IconTrash size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

