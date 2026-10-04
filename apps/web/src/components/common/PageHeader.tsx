import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  icon: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  eyebrow?: string;
  className?: string;
}

export function PageHeader({
  title,
  icon,
  description,
  actions,
  eyebrow,
  className,
}: PageHeaderProps) {
  return (
    <header className={`page-header${className ? ` ${className}` : ''}`}>
      <div>
        {eyebrow && <span className="page-header-eyebrow">{eyebrow}</span>}
        <h1 className="page-header-title"><span className="page-header-icon">{icon}</span>{title}</h1>
        {description && <p className="text-muted">{description}</p>}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </header>
  );
}