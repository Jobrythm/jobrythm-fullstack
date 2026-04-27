import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { IconCrown } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { useClients } from '../../clients/hooks/useClients';
import { JobForm } from '../components/JobForm';
import { useCreateJob } from '../hooks/useJobs';
import { normalizeApiError } from '../../../api/errors';

export const NewJobPage = () => {
  const navigate = useNavigate();
  const { data: clientsResponse, isLoading } = useClients();
  const clients = clientsResponse?.items ?? [];
  const createMutation = useCreateJob();

  if (isLoading) return <LoadingSpinner label="Loading clients..." />;

  const isPlanLimitError =
    createMutation.isError &&
    normalizeApiError(createMutation.error).code === 'PLAN_LIMIT_EXCEEDED';

  return (
    <>
      {isPlanLimitError && (
        <div className="alert alert-warning d-flex align-items-center gap-2 mb-3">
          <IconCrown size={18} className="text-warning flex-shrink-0" />
          <div className="flex-grow-1">
            <strong>Starter plan limit reached.</strong> You've used all 15 active job slots.{' '}
            <Link to="/settings?tab=billing" className="alert-link">Upgrade your plan</Link> to create unlimited jobs.
          </div>
        </div>
      )}
      <div className="card">
        <div className="card-body">
          <JobForm
            clients={clients}
            isSaving={createMutation.isPending}
            onAddClient={() => navigate('/clients/new')}
            onSubmit={(values) => {
              createMutation.mutate(values, {
                onSuccess: (job) => {
                  toast.success('Job created');
                  navigate(`/jobs/${job.id}`);
                },
                onError: (error: Error) => toast.error(error.message),
              });
            }}
          />
        </div>
      </div>
    </>
  );
};

