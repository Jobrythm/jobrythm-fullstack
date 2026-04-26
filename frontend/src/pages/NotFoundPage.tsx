import { Link } from 'react-router-dom';

export const NotFoundPage = () => {
  return (
    <div className="page page-center">
      <div className="container-tight py-4 text-center">
        <h1 className="display-1">404</h1>
        <p className="h3">Page not found</p>
        <p className="text-secondary">The page you requested does not exist.</p>
        <Link className="btn btn-primary" to="/dashboard">
          Go to dashboard
        </Link>
      </div>
    </div>
  );
};

