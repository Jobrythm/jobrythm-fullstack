import { apiClient } from './client';

export interface Attachment {
  id: string;
  jobId: string;
  userId: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export const getAttachments = async (jobId: string): Promise<Attachment[]> => {
  const { data } = await apiClient.get<Attachment[]>('/attachments', { params: { jobId } });
  return data;
};

export const uploadAttachment = async (
  jobId: string,
  file: File,
  description?: string
): Promise<Attachment> => {
  const form = new FormData();
  form.append('file', file);
  form.append('jobId', jobId);
  if (description) form.append('description', description);
  const { data } = await apiClient.post<Attachment>('/attachments', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const deleteAttachment = async (id: string): Promise<void> => {
  await apiClient.delete(`/attachments/${id}`);
};

export const getAttachmentDownloadUrl = (id: string): string => {
  // Use the base URL from apiClient's defaults
  const base = (apiClient.defaults.baseURL ?? '').replace(/\/$/, '');
  return `${base}/attachments/${id}/download`;
};
