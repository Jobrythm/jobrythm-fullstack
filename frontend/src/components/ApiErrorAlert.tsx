interface ApiErrorAlertProps {
  error: string;
  onDismiss?: () => void;
}

export const ApiErrorAlert = ({ error, onDismiss }: ApiErrorAlertProps) => {
  return (
    <div className="alert alert-danger alert-dismissible" role="alert">
      <div>{error}</div>
      {onDismiss ? <button type="button" className="btn-close" onClick={onDismiss} /> : null}
    </div>
  );
};

