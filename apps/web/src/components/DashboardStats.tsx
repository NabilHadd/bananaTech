import React from 'react';
import { Truck, Activity, CheckCircle, AlertTriangle } from 'lucide-react';

export const DashboardStats: React.FC = () => {
  const stats = [
    { label: 'Flota Total', value: '32', icon: <Truck />, color: 'var(--accent-primary)', bg: 'var(--accent-glow)' },
    { label: 'En Ruta', value: '18', icon: <Activity />, color: 'var(--status-success)', bg: 'var(--status-success-bg)' },
    { label: 'Disponibles', value: '12', icon: <CheckCircle />, color: 'var(--status-warning)', bg: 'var(--status-warning-bg)' },
    { label: 'En Mantención', value: '2', icon: <AlertTriangle />, color: 'var(--status-error)', bg: 'var(--status-error-bg)' },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '1.5rem',
      marginBottom: '2rem'
    }}>
      {stats.map((stat, idx) => (
        <div key={idx} className="glass-panel" style={{
          padding: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: stat.bg,
            color: stat.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {stat.icon}
          </div>
          <div>
            <div className="text-muted" style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              {stat.label}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {stat.value}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
