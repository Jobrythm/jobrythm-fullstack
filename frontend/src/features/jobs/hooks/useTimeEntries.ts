import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  clockIn,
  clockOut,
  createTimeEntry,
  deleteTimeEntry,
  getTimeEntries,
  updateTimeEntry,
  type TimeEntryPayload,
} from '../../../api/timeEntries';

export const timeEntryKeys = {
  all: ['time-entries'] as const,
  byJob: (jobId: string) => ['time-entries', 'job', jobId] as const,
};

export const useTimeEntries = (jobId: string) =>
  useQuery({
    queryKey: timeEntryKeys.byJob(jobId),
    queryFn: () => getTimeEntries(jobId),
    enabled: !!jobId,
  });

export const useCreateTimeEntry = (jobId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: TimeEntryPayload) => createTimeEntry(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: timeEntryKeys.byJob(jobId) }),
  });
};

export const useUpdateTimeEntry = (jobId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<TimeEntryPayload> }) =>
      updateTimeEntry(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: timeEntryKeys.byJob(jobId) }),
  });
};

export const useDeleteTimeEntry = (jobId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTimeEntry(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: timeEntryKeys.byJob(jobId) }),
  });
};

export const useClockIn = (jobId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => clockIn(jobId),
    onSuccess: () => qc.invalidateQueries({ queryKey: timeEntryKeys.byJob(jobId) }),
  });
};

export const useClockOut = (jobId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => clockOut(),
    onSuccess: () => qc.invalidateQueries({ queryKey: timeEntryKeys.byJob(jobId) }),
  });
};
