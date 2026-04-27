import { useState } from 'react';
import { IconPlus, IconUsers, IconEdit, IconCheck, IconX } from '@tabler/icons-react';
import toast from 'react-hot-toast';
import { useTeamMembers, useCreateTeamMember, useUpdateTeamMember, useDeleteTeamMember } from '../hooks/useTeam';
import { TeamMemberModal } from '../components/TeamMemberModal';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { TableSkeleton } from '../../../components/TableSkeleton';
import { EmptyState } from '../../../components/EmptyState';
import type { TeamMember } from '../../../api/team';

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

export const TeamPage = () => {
  const { data: members = [], isLoading } = useTeamMembers();
  const createMutation = useCreateTeamMember();
  const updateMutation = useUpdateTeamMember();
  const deleteMutation = useDeleteTeamMember();

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TeamMember | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TeamMember | null>(null);

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

  const openCreate = () => {
    setEditTarget(null);
    setModalOpen(true);
  };

  const openEdit = (member: TeamMember) => {
    setEditTarget(member);
    setModalOpen(true);
  };

  const activeCount = members.filter((m) => m.isActive).length;

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
        <div className="card">
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
    </>
  );
};
