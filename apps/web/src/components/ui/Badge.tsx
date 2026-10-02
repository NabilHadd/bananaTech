import React from 'react';

/**
 * Dentro de una sección, cada estado usa un tono distinto. Entre secciones se
 * repite el significado: info = recién creado, progress = confirmado,
 * warning = en curso, success = terminado o disponible, error = bloqueado,
 * neutral = cancelado, inactivo o en pausa.
 */
export type BadgeTone = 'success' | 'warning' | 'error' | 'neutral' | 'info' | 'progress';

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
