interface LoadingSpinnerProps {
  label?: string;
}

export const LoadingSpinner = ({ label = 'Loading...' }: LoadingSpinnerProps) => {
  return (
    <div className="d-flex align-items-center justify-content-center py-5">
      <div className="spinner-border text-primary me-2" role="status" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
};

