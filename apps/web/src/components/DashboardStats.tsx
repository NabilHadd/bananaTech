import React from 'react';
import { Truck, CheckCircle, AlertTriangle, Users } from 'lucide-react';
import { CAMIONES, CONDUCTORES } from '../data/mockData';

export const DashboardStats: React.FC = () => {
  const totalCamiones = CAMIONES.length;
  const disponiblesCamiones = CAMIONES.filter((c) => c.estado === 'Disponible').length;
  const bloqueadosCamiones = CAMIONES.filter((c) => c.estado === 'Bloqueado' || c.estado === 'En mantención').length;
  const conductoresHabilitados = CONDUCTORES.filter((c) => !c.licenciaVencida).length;

  const stats = [
    {
      label: 'Flota Total',
      value: totalCamiones.toString(),
      subtext: '3 unidades en BD',
      icon: <Truck size={24} />,
      color: 'var(--accent-primary)',
      bg: 'var(--accent-glow)'
    },
    {
      label: 'Camiones Disponibles',
      value: disponiblesCamiones.toString(),
      subtext: 'Documentación al día',
      icon: <CheckCircle size={24} />,
      color: 'var(--status-success)',
      bg: 'var(--status-success-bg)'
    },
    {
      label: 'Camiones Bloqueados',
      value: bloqueadosCamiones.toString(),
      subtext: 'RT vencida (EFGH-34)',
      icon: <AlertTriangle size={24} />,
      color: 'var(--status-error)',
      bg: 'var(--status-error-bg)'
    },
    {
      label: 'Conductores Aptos',
      value: `${conductoresHabilitados} / ${CONDUCTORES.length}`,
      subtext: '1 con licencia vencida',
      icon: <Users size={24} />,
      color: 'var(--status-warning)',
      bg: 'var(--status-warning-bg)'
    },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '1.25rem',
      marginBottom: '1.75rem'
    }}>
      {stats.map((stat, idx) => (
        <div key={idx} className="glass-panel" style={{
          padding: '1.25rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          transition: 'var(--transition)'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: stat.bg,
            color: stat.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            {stat.icon}
          </div>
          <div>
            <div className="text-muted" style={{ fontSize: '0.8125rem', fontWeight: 500 }}>
              {stat.label}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              {stat.value}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.2rem' }}>
              {stat.subtext}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
