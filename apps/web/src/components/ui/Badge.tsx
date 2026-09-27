import React from 'react';

export type BadgeTone = 'success' | 'warning' | 'error' | 'neutral';

interface BadgeProps {
  tone: BadgeTone;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ tone, icon, children }) => (
  <span className={`badge badge-${tone}`} style={{ gap: '0.3rem' }}>
    {icon}
    {children}
  </span>
);
