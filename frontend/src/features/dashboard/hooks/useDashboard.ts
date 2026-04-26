import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '../../../api/dashboard';

export const dashboardQueryKey = ['dashboard', 'stats'] as const;

export const useDashboard = () => {
  return useQuery({
    queryKey: dashboardQueryKey,
    queryFn: getDashboardStats,
  });
};

