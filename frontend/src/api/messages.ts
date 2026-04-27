import { apiClient } from './client';

export interface Message {
  id: string;
  jobId: string;
  senderType: 'contractor' | 'client';
  senderName: string;
  body: string;
  emailSent: boolean;
  createdAt: string;
}

export const messagesApi = {
  list: (jobId: string) =>
    apiClient.get<Message[]>(`/jobs/${jobId}/messages`).then((r: { data: Message[] }) => r.data),
  send: (jobId: string, body: string) =>
    apiClient.post<Message>(`/jobs/${jobId}/messages`, { body }).then((r: { data: Message }) => r.data),
  delete: (jobId: string, id: string) =>
    apiClient.delete(`/jobs/${jobId}/messages/${id}`).then((r: { data: unknown }) => r.data),
};
