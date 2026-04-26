import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { useClients } from '../../clients/hooks/useClients';
import { JobForm } from '../components/JobForm';
import { useCreateJob } from '../hooks/useJobs';

export const NewJobPage = () => {
  const navigate = useNavigate();
  const { data: clientsResponse, isLoading } = useClients();
  const clients = clientsResponse?.items ?? [];
  const createMutation = useCreateJob();

  if (isLoading) return <LoadingSpinner label="Loading clients..." />;

  return (
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
  );
};

