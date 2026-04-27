import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createTeamMember,
  deleteTeamMember,
  getTeamMembers,
  updateTeamMember,
  type TeamMemberPayload,
} from '../../../api/team';

const TEAM_KEY = ['team'];

export const useTeamMembers = () =>
  useQuery({ queryKey: TEAM_KEY, queryFn: getTeamMembers });

export const useCreateTeamMember = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: TeamMemberPayload) => createTeamMember(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: TEAM_KEY }),
  });
};

export const useUpdateTeamMember = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<TeamMemberPayload> }) =>
      updateTeamMember(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: TEAM_KEY }),
  });
};

export const useDeleteTeamMember = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTeamMember(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: TEAM_KEY }),
  });
};
