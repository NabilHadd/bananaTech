import React from 'react';
import { CheckCircle2, Coffee, Navigation, ShieldAlert } from 'lucide-react';
import type { ResumenPersonal } from './types';

/** Indicador del panel de personal: disponibles / total y desglose por estado (HU2.1). */
export const ResumenPersonalPanel: React.FC<{ resumen: ResumenPersonal | null }> = ({ resumen }) => {
  const valor = (n: number | undefined) => (resumen ? n : '–');

  const kpis = [
    {
      label: 'Disponibles',
      icon: <CheckCircle2 size={14} color="var(--status-success)" />,
      value: valor(resumen?.disponibles),
      unit: `/ ${valor(resumen?.total)} conductores`,
    },
    { label: 'En viaje', icon: <Navigation size={14} color="var(--status-warning)" />, value: valor(resumen?.enViaje) },
    { label: 'En descanso', icon: <Coffee size={14} color="var(--text-tertiary)" />, value: valor(resumen?.enDescanso) },
    { label: 'Bloqueados', icon: <ShieldAlert size={14} color="var(--status-error)" />, value: valor(resumen?.bloqueados) },
  ];

  return (
    <div className="glass-panel" style={{ overflow: 'hidden' }}>
      <div className="kpi-strip" style={{ borderBottom: 'none' }}>
        {kpis.map((k) => (
          <div key={k.label} className="kpi">
            <div className="kpi-label">{k.icon} {k.label}</div>
            <div className="kpi-value">
              {k.value} {k.unit && <span className="kpi-unit">{k.unit}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
