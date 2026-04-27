import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAppointments, createAppointment, updateAppointment, deleteAppointment,
  type AppointmentPayload,
} from '../../../api/appointments';

export const appointmentsQueryKey = (start?: string, end?: string) =>
  ['appointments', start, end] as const;

export const useAppointments = (start?: string, end?: string) => {
  return useQuery({
    queryKey: appointmentsQueryKey(start, end),
    queryFn: () => getAppointments(start, end),
  });
};

export const useCreateAppointment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createAppointment,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  });
};

export const useUpdateAppointment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<AppointmentPayload> }) =>
      updateAppointment(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  });
};

export const useDeleteAppointment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteAppointment,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  });
};
