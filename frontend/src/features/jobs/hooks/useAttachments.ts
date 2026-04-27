import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  deleteAttachment,
  getAttachments,
  uploadAttachment,
} from '../../../api/attachments';

export const attachmentKeys = {
  byJob: (jobId: string) => ['attachments', jobId] as const,
};

export const useAttachments = (jobId: string) =>
  useQuery({
    queryKey: attachmentKeys.byJob(jobId),
    queryFn: () => getAttachments(jobId),
    enabled: !!jobId,
  });

export const useUploadAttachment = (jobId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, description }: { file: File; description?: string }) =>
      uploadAttachment(jobId, file, description),
    onSuccess: () => qc.invalidateQueries({ queryKey: attachmentKeys.byJob(jobId) }),
  });
};

export const useDeleteAttachment = (jobId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAttachment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: attachmentKeys.byJob(jobId) }),
  });
};
