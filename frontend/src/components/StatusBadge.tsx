import type { Invoice, JobStatus, Quote } from '../types';
import { cn, getStatusColor } from '../utils';

interface StatusBadgeProps {
  status: JobStatus | Quote['status'] | Invoice['status'];
  className?: string;
}

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  return (
    <span className={cn('badge text-capitalize', getStatusColor(status), className)}>
      {status.replace('_', ' ')}
    </span>
  );
};

