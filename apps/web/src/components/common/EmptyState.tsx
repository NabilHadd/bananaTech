import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => (
  <div className="empty-state">
    {icon && <div className="empty-state-icon">{icon}</div>}
    <div className="empty-state-title">{title}</div>
    {description && <p className="empty-state-description">{description}</p>}
    {action}
  </div>
);
