import { format } from 'date-fns';

export const formatDate = (iso: string): string => {
  return format(new Date(iso), 'dd MMM yyyy');
};

