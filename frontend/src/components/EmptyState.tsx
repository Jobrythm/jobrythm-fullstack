import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => {
  return (
    <div className="empty">
      <div className="empty-img">{icon}</div>
      <p className="empty-title">{title}</p>
      <p className="empty-subtitle text-secondary">{description}</p>
      {action ? <div className="empty-action">{action}</div> : null}
    </div>
  );
};

