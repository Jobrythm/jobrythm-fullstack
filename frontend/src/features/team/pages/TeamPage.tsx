import { useState } from 'react';
import { IconPlus, IconUsers, IconEdit, IconCheck, IconX, IconKey, IconShieldCheck, IconUser } from '@tabler/icons-react';
import toast from 'react-hot-toast';
import { useTeamMembers, useCreateTeamMember, useUpdateTeamMember, useDeleteTeamMember } from '../hooks/useTeam';
import {
  useCompanyMembers,
  useCreateCompanyMember,
  useUpdateCompanyMember,
  useDeleteCompanyMember,
  useResetMemberPassword,
} from '../hooks/useCompanyMembers';
import { TeamMemberModal } from '../components/TeamMemberModal';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { TableSkeleton } from '../../../components/TableSkeleton';
import { EmptyState } from '../../../components/EmptyState';
import { useAuthStore } from '../../../store/authStore';
import type { TeamMember } from '../../../api/team';
import type { CompanyMember } from '../../../api/companyMembers';

const ROLE_BADGE: Record<string, string> = {
  owner: 'bg-red-lt text-red',
  manager: 'bg-blue-lt text-blue',
  technician: 'bg-green-lt text-green',
};

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  manager: 'Manager',
  technician: 'Technician',
};

const PLAN_LIMITS: Record<string, number> = {
  starter: 0,
  professional: 3,
  business: 10,
  admin: 9999,
};

// ── Login Account Modal ──────────────────────────────────────────────────────
interface LoginAccountModalProps {
  member: CompanyMember | null;
  onClose: () => void;
}
function LoginAccountModal({ member, onClose }: LoginAccountModalProps) {
  const createMutation = useCreateCompanyMember();
  const updateMutation = useUpdateCompanyMember();
  const resetMutation = useResetMemberPassword();

  const [name, setName] = useState(member?.name ?? '');
  const [email, setEmail] = useState(member?.email ?? '');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [companyRole, setCompanyRole] = useState<'member' | 'business_admin'>(
    member?.companyRole ?? 'member',
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (member) {
        await updateMutation.mutateAsync({ id: member.id, data: { name, email, companyRole } });
        if (newPassword) {
          await resetMutation.mutateAsync({ id: member.id, newPassword });
        }
        toast.success('Login account updated');
      } else {
        if (!password) { toast.error('Password is required'); setSaving(false); return; }
        await createMutation.mutateAsync({ name, email, password, companyRole });
        toast.success('Login account created');
      }
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed to save';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal modal-blur show d-block" tabIndex={-1}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{member ? 'Edit Login Account' : 'Add Login Account'}</h5>
            <button className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label required">Full name</label>
              <input className="form-control" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="mb-3">
              <label className="form-label required">Email</label>
              <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            {!member && (
              <div className="mb-3">
                <label className="form-label required">Password</label>
                <input type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
                <div className="form-hint">Minimum 8 characters</div>
              </div>
            )}
            {member && (
              <div className="mb-3">
                <label className="form-label">New password <span className="text-secondary">(leave blank to keep current)</span></label>
                <input type="password" className="form-control" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" />
              </div>
            )}
            <div className="mb-3">
              <label className="form-label">Role</label>
              <select className="form-select" value={companyRole} onChange={(e) => setCompanyRole(e.target.value as 'member' | 'business_admin')}>
                <option value="member">Member — can clock in/out, view own schedule, log time</option>
                <option value="business_admin">Business Admin — can manage jobs, clients, and team members</option>
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-link me-auto" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : member ? 'Save changes' : 'Create account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export const TeamPage = () => {
  const { user } = useAuthStore();
  const { data: members = [], isLoading } = useTeamMembers();
  const createMutation = useCreateTeamMember();
  const updateMutation = useUpdateTeamMember();
  const deleteMutation = useDeleteTeamMember();
  const { data: loginMembers = [], isLoading: loginLoading } = useCompanyMembers();
  const deleteLoginMutation = useDeleteCompanyMember();

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TeamMember | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TeamMember | null>(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [editLoginTarget, setEditLoginTarget] = useState<CompanyMember | null>(null);
  const [deleteLoginTarget, setDeleteLoginTarget] = useState<CompanyMember | null>(null);

  const handleSubmit = async (values: Parameters<typeof createMutation.mutateAsync>[0]) => {
    try {
      if (editTarget) {
        await updateMutation.mutateAsync({ id: editTarget.id, payload: values });
        toast.success('Team member updated');
      } else {
        await createMutation.mutateAsync(values);
        toast.success('Team member added');
      }
      setModalOpen(false);
      setEditTarget(null);
    } catch {
      toast.error('Failed to save team member');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success('Team member removed');
      setDeleteTarget(null);
      setModalOpen(false);
      setEditTarget(null);
    } catch {
      toast.error('Failed to delete team member');
    }
  };

  const handleDeleteLogin = async () => {
    if (!deleteLoginTarget) return;
    try {
      await deleteLoginMutation.mutateAsync(deleteLoginTarget.id);
      toast.success('Login account removed');
      setDeleteLoginTarget(null);
    } catch {
      toast.error('Failed to remove login account');
    }
  };

  const openCreate = () => {
    setEditTarget(null);
    setModalOpen(true);
  };

  const openEdit = (member: TeamMember) => {
    setEditTarget(member);
    setModalOpen(true);
  };

  const activeCount = members.filter((m) => m.isActive).length;

  const plan = user?.plan ?? 'starter';
  const loginLimit = PLAN_LIMITS[plan] ?? 0;
  const canManageLogins = user?.companyRole === 'owner' || user?.companyRole === 'business_admin';

  return (
    <>
      {modalOpen && (
        <TeamMemberModal
          member={editTarget}
          onSubmit={handleSubmit}
          onClose={() => { setModalOpen(false); setEditTarget(null); }}
          onDelete={editTarget ? () => setDeleteTarget(editTarget) : undefined}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}
      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Remove team member"
        body={`Remove ${deleteTarget?.name} from your team? This cannot be undone.`}
        confirmLabel="Remove"
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
      <ConfirmModal
        open={Boolean(deleteLoginTarget)}
        title="Remove login account"
        body={`Remove ${deleteLoginTarget?.name}'s login access? They will no longer be able to sign in.`}
        confirmLabel="Remove"
        onConfirm={handleDeleteLogin}
        onClose={() => setDeleteLoginTarget(null)}
      />
      {loginModalOpen && (
        <LoginAccountModal
          member={editLoginTarget}
          onClose={() => { setLoginModalOpen(false); setEditLoginTarget(null); }}
        />
      )}

      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h2 className="h4 mb-0">Team</h2>
          {members.length > 0 && (
            <span className="text-secondary small">{activeCount} active · {members.length} total</span>
          )}
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <IconPlus size={16} className="me-1" />
          Add member
        </button>
      </div>

      {isLoading ? (
        <TableSkeleton rows={4} columns={5} />
      ) : members.length === 0 ? (
        <EmptyState
          icon={<IconUsers size={40} strokeWidth={1.5} />}
          title="No team members yet"
          description="Add your field staff, managers, and subcontractors so you can assign them to jobs and appointments."
          action={<button className="btn btn-primary" onClick={openCreate}><IconPlus size={16} className="me-1" />Add first member</button>}
        />
      ) : (
        <div className="card mb-4">
          <div className="table-responsive">
            <table className="table table-vcenter card-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th className="w-1" />
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id}>
                    <td className="fw-semibold">{member.name}</td>
                    <td>
                      <span className={`badge ${ROLE_BADGE[member.role] ?? 'bg-secondary-lt'}`}>
                        {ROLE_LABELS[member.role] ?? member.role}
                      </span>
                    </td>
                    <td className="text-secondary">{member.email ?? '—'}</td>
                    <td className="text-secondary">{member.phone ?? '—'}</td>
                    <td>
                      {member.isActive ? (
                        <span className="d-flex align-items-center gap-1 text-success">
                          <IconCheck size={14} /> Active
                        </span>
                      ) : (
                        <span className="d-flex align-items-center gap-1 text-secondary">
                          <IconX size={14} /> Inactive
                        </span>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-ghost-secondary"
                        onClick={() => openEdit(member)}
                      >
                        <IconEdit size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Login Accounts ─────────────────────────────────────────────── */}
      <div className="d-flex justify-content-between align-items-center mb-3 mt-4">
        <div>
          <h2 className="h4 mb-0">Login Accounts</h2>
          <span className="text-secondary small">
            {loginLimit === 0
              ? 'Upgrade to Professional or Business to add team logins'
              : `${loginMembers.length} / ${loginLimit} used · team members with their own login`}
          </span>
        </div>
        {canManageLogins && loginLimit > 0 && loginMembers.length < loginLimit && (
          <button className="btn btn-primary" onClick={() => { setEditLoginTarget(null); setLoginModalOpen(true); }}>
            <IconPlus size={16} className="me-1" />
            Add login
          </button>
        )}
      </div>

      {loginLimit === 0 ? (
        <div className="alert alert-info">
          <IconShieldCheck size={18} className="me-2" />
          <strong>Professional plan</strong> includes up to 3 team login accounts.{' '}
          <strong>Business plan</strong> includes up to 10. Team members get their own login to clock in/out, view schedules, and complete job steps.
        </div>
      ) : loginLoading ? (
        <TableSkeleton rows={2} columns={4} />
      ) : loginMembers.length === 0 ? (
        <EmptyState
          icon={<IconUser size={40} strokeWidth={1.5} />}
          title="No login accounts yet"
          description="Give team members their own login so they can clock in/out, view their schedule, and complete job checklists."
          action={canManageLogins ? (
            <button className="btn btn-primary" onClick={() => { setEditLoginTarget(null); setLoginModalOpen(true); }}>
              <IconPlus size={16} className="me-1" />Add first login
            </button>
          ) : undefined}
        />
      ) : (
        <div className="card">
          <div className="table-responsive">
            <table className="table table-vcenter card-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                  {canManageLogins && <th className="w-1" />}
                </tr>
              </thead>
              <tbody>
                {loginMembers.map((m: CompanyMember) => (
                  <tr key={m.id}>
                    <td className="fw-semibold">{m.name}</td>
                    <td className="text-secondary">{m.email}</td>
                    <td>
                      <span className={`badge ${m.companyRole === 'business_admin' ? 'bg-blue-lt text-blue' : 'bg-secondary-lt text-secondary'}`}>
                        {m.companyRole === 'business_admin' ? 'Business Admin' : 'Member'}
                      </span>
                    </td>
                    <td className="text-secondary">{new Date(m.createdAt).toLocaleDateString()}</td>
                    {canManageLogins && (
                      <td>
                        <div className="d-flex gap-1">
                          <button className="btn btn-sm btn-ghost-secondary" onClick={() => { setEditLoginTarget(m); setLoginModalOpen(true); }}>
                            <IconEdit size={15} />
                          </button>
                          <button className="btn btn-sm btn-ghost-secondary" title="Reset password" onClick={() => { setEditLoginTarget(m); setLoginModalOpen(true); }}>
                            <IconKey size={15} />
                          </button>
                          <button className="btn btn-sm btn-ghost-danger text-danger" onClick={() => setDeleteLoginTarget(m)}>
                            <IconX size={15} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
};
