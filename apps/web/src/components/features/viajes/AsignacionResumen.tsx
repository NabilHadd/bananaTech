import React from 'react';
import { Truck, User } from 'lucide-react';
import { InfoTile } from '../../ui/InfoTile';
import { formatearNumero } from '../cargas/cargas.constants';
import type { Conductor } from '../conductores/types';
import type { Camion } from '../flota/types';
import { nombreConductor } from './viajes.constants';

const detalle = { fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 400 } as const;
const accent = 'var(--accent-primary)';

/** Camión y conductor de un viaje, propuesto o ya generado. */
export const AsignacionResumen: React.FC<{ camion: Camion; conductor: Conductor }> = ({ camion, conductor }) => (
  <div className="info-grid">
    <InfoTile
      label="Camión"
      icon={<Truck size={14} color={accent} />}
      value={
        <span>
          {camion.patente}
          <div style={detalle}>
            {camion.tipo} · {formatearNumero(camion.pesoMaxKg)} kg · {formatearNumero(camion.volumenMaxM3)} m³
          </div>
        </span>
      }
    />
    <InfoTile
      label="Conductor"
      icon={<User size={14} color={accent} />}
      value={
        <span>
          {nombreConductor(conductor)}
          <div style={detalle}>
            {conductor.rut} · licencia {conductor.licencias[0]?.clases.join(', ') ?? '—'}
          </div>
        </span>
      }
    />
  </div>
);
