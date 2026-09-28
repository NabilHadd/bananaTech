import React from 'react';
import { MapPin, Navigation, Truck } from 'lucide-react';
import { DataTable } from '../../common/DataTable';
import type { Column } from '../../common/DataTable';
import { EmptyState } from '../../common/EmptyState';
import { ViajeEstadoBadge } from '../flota/FlotaBadges';
import type { ViajeConductor } from './types';

const muted = { fontSize: '0.7rem', color: 'var(--text-tertiary)' } as const;

/** La API entrega ISO (`2026-09-10T07:30:00`); se muestra como `2026-09-10 07:30`. */
const formatearFecha = (iso: string) => iso.slice(0, 16).replace('T', ' ');

const columns: Column<ViajeConductor>[] = [
  {
    key: 'fecha',
    header: 'Salida',
    render: (v) => (
      <>
        <div style={{ fontSize: '0.85rem' }}>{formatearFecha(v.fechaInicio)}</div>
        <div style={muted}>Llegada: {formatearFecha(v.fechaFin)}</div>
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
    key: 'camion',
    header: 'Camión',
    render: (v) => (
      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', letterSpacing: '0.04em' }}>
        <Truck size={13} color="var(--text-tertiary)" />
        {v.patente}
      </span>
    ),
  },
  { key: 'carga', header: 'Carga', render: (v) => <strong>{v.pesoKg.toLocaleString('es-CL')} kg</strong> },
  { key: 'estado', header: 'Estado', render: (v) => <ViajeEstadoBadge estado={v.estado} /> },
];

export const ViajesConductorTable: React.FC<{ viajes: ViajeConductor[] }> = ({ viajes }) =>
  viajes.length === 0 ? (
    <EmptyState
      icon={<Navigation size={32} />}
      title="Este conductor aún no registra viajes"
      description="Cuando se le asigne un viaje aparecerá en este historial."
    />
  ) : (
    <DataTable columns={columns} rows={viajes} rowKey={(v) => v.id} bordered />
  );
