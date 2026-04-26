import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { useClients } from '../../clients/hooks/useClients';
import { JobForm } from '../components/JobForm';
import { useJob, useUpdateJob } from '../hooks/useJobs';

export const EditJobPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: clientsResponse, isLoading: isLoadingClients } = useClients();
  const clients = clientsResponse?.items ?? [];
  const { data: job, isLoading: isLoadingJob } = useJob(id);
  const updateMutation = useUpdateJob();

  if (isLoadingClients || isLoadingJob || !job) return <LoadingSpinner label="Loading job..." />;

  return (
    <div className="card">
      <div className="card-body">
        <JobForm
          clients={clients}
          initialJob={job}
          isSaving={updateMutation.isPending}
          onAddClient={() => navigate('/clients/new')}
          onSubmit={(values) => {
            updateMutation.mutate(
              { id: job.id, payload: values },
              {
                onSuccess: () => {
                  toast.success('Job updated');
                  navigate(`/jobs/${job.id}`);
                },
                onError: (error: Error) => toast.error(error.message),
              },
            );
          }}
        />
      </div>
    </div>
  );
};

