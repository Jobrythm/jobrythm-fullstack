import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createChecklistItem,
  deleteChecklistItem,
  getChecklistItems,
  reorderChecklistItems,
  updateChecklistItem,
} from '../../../api/checklists';

export const checklistKeys = {
  byJob: (jobId: string) => ['checklists', jobId] as const,
};

export const useChecklistItems = (jobId: string) =>
  useQuery({
    queryKey: checklistKeys.byJob(jobId),
    queryFn: () => getChecklistItems(jobId),
    enabled: !!jobId,
  });

export const useCreateChecklistItem = (jobId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (title: string) =>
      createChecklistItem({ jobId, title }),
    onSuccess: () => qc.invalidateQueries({ queryKey: checklistKeys.byJob(jobId) }),
  });
};

export const useUpdateChecklistItem = (jobId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<{ title: string; isCompleted: boolean; notes: string }>;
    }) => updateChecklistItem(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: checklistKeys.byJob(jobId) }),
  });
};

export const useDeleteChecklistItem = (jobId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteChecklistItem(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: checklistKeys.byJob(jobId) }),
  });
};

export const useReorderChecklist = (jobId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: { id: string; sortOrder: number }[]) => reorderChecklistItems(items),
    onSuccess: () => qc.invalidateQueries({ queryKey: checklistKeys.byJob(jobId) }),
  });
};
