import React from 'react';
import { MapPin, Navigation, User } from 'lucide-react';
import { DataTable } from '../../common/DataTable';
import type { Column } from '../../common/DataTable';
import { EmptyState } from '../../common/EmptyState';
import { ViajeEstadoBadge } from './FlotaBadges';
import type { ViajeCamion } from './types';

const muted = { fontSize: '0.7rem', color: 'var(--text-tertiary)' } as const;

const columns: Column<ViajeCamion>[] = [
  {
    key: 'fecha',
    header: 'Salida',
    render: (v) => (
      <>
        <div style={{ fontSize: '0.85rem' }}>{v.fechaInicio}</div>
        <div style={muted}>Llegada: {v.fechaFin}</div>
      </>
    ),
  },
  {
    key: 'ruta',
    header: 'Ruta',
    render: (v) => (
      <>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}>
          <MapPin size={13} color="var(--accent-primary)" />
          <strong>{v.origen}</strong>
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: '1.1rem' }}>➔ {v.destino}</div>
      </>
    ),
  },
  { key: 'distancia', header: 'Distancia', render: (v) => <strong>{v.distanciaKm} km</strong> },
  {
    key: 'conductor',
    header: 'Conductor',
    render: (v) => (
      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}>
        <User size={13} color="var(--text-tertiary)" />
        {v.conductor}
      </span>
    ),
  },
  {
    key: 'carga',
    header: 'Carga',
    render: (v) => (
      <>
        <div style={{ fontWeight: 600 }}>{v.pesoKg.toLocaleString('es-CL')} kg</div>
        <div style={muted}>Ocupación: {v.ocupacionPct}%</div>
      </>
    ),
  },
  { key: 'estado', header: 'Estado', render: (v) => <ViajeEstadoBadge estado={v.estado} /> },
];

export const ViajesTable: React.FC<{ viajes: ViajeCamion[] }> = ({ viajes }) =>
  viajes.length === 0 ? (
    <EmptyState
      icon={<Navigation size={32} />}
      title="Este camión aún no registra viajes"
      description="Cuando se le asigne un viaje aparecerá en este historial."
    />
  ) : (
    <DataTable columns={columns} rows={viajes} rowKey={(v) => v.id} bordered />
  );
