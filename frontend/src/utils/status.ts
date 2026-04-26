import type { Invoice, JobStatus, Quote } from '../types';

export const getMarginColor = (marginPercent: number): string => {
  if (marginPercent > 20) return 'text-success';
  if (marginPercent >= 10) return 'text-warning';
  return 'text-danger';
};

export const getStatusColor = (status: JobStatus | Quote['status'] | Invoice['status']): string => {
  const map: Record<string, string> = {
    draft: 'bg-secondary-lt',
    quoted: 'bg-indigo-lt',
    active: 'bg-blue-lt',
    completed: 'bg-green-lt',
    invoiced: 'bg-purple-lt',
    sent: 'bg-cyan-lt',
    accepted: 'bg-green-lt',
    rejected: 'bg-red-lt',
    expired: 'bg-orange-lt',
    paid: 'bg-green-lt',
    overdue: 'bg-orange-lt',
    cancelled: 'bg-secondary-lt',
  };

  return map[status] ?? 'bg-secondary-lt';
};

