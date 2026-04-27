import { apiClient } from './client';

export interface Appointment {
  id: string;
  userId: string;
  jobId?: string;
  clientId?: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo?: string;
  job?: { id: string; title: string; client?: { id: string; name: string } };
  client?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentPayload {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  jobId?: string;
  clientId?: string;
  assignedTo?: string;
  status?: Appointment['status'];
}

export const getAppointments = async (start?: string, end?: string): Promise<Appointment[]> => {
  const { data } = await apiClient.get<Appointment[]>('/appointments', {
    params: { start, end },
  });
  return data;
};

export const getAppointment = async (id: string): Promise<Appointment> => {
  const { data } = await apiClient.get<Appointment>(`/appointments/${id}`);
  return data;
};

export const createAppointment = async (payload: AppointmentPayload): Promise<Appointment> => {
  const { data } = await apiClient.post<Appointment>('/appointments', payload);
  return data;
};

export const updateAppointment = async (id: string, payload: Partial<AppointmentPayload>): Promise<Appointment> => {
  const { data } = await apiClient.put<Appointment>(`/appointments/${id}`, payload);
  return data;
};

export const deleteAppointment = async (id: string): Promise<void> => {
  await apiClient.delete(`/appointments/${id}`);
};
