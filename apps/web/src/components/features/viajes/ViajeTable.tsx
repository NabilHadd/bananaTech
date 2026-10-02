import React from 'react';
import { MapPin, Navigation, Truck, User } from 'lucide-react';
import { DataTable } from '../../common/DataTable';
import type { Column } from '../../common/DataTable';
import { codigoCarga, formatearNumero } from '../cargas/cargas.constants';
import { ViajeEstadoBadge } from '../flota/FlotaBadges';
import type { Viaje } from './types';
import { codigoViaje, formatearFecha, nombreConductor } from './viajes.constants';

interface ViajeTableProps {
  viajes: Viaje[];
  onSelect?: (viaje: Viaje) => void;
  empty: React.ReactNode;
}

const muted = { fontSize: '0.75rem', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' } as const;
const strong = { fontWeight: 600, color: 'var(--text-primary)' } as const;
const fila = { display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8125rem' } as const;

export const ViajeTable: React.FC<ViajeTableProps> = ({ viajes, onSelect, empty }) => {
  const columns: Column<Viaje>[] = [
    {
      key: 'viaje',
      header: 'Viaje',
      render: (v) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="conductor-avatar" style={{ color: 'var(--accent-primary)' }}>
            <Navigation size={16} />
          </div>
          <div>
            <div style={strong}>{codigoViaje(v.id)}</div>
            <div style={muted}>Carga {codigoCarga(v.idCarga)}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'ruta',
      header: 'Ruta',
      render: (v) => (
        <div>
          <div style={fila}>
            <MapPin size={13} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
            <span>{v.origen}</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: '1.1rem' }}>
            ➔ {v.carga.centro?.direccion ?? `Centro #${v.carga.idCentro}`}
          </div>
        </div>
      ),
    },
    {
      key: 'asignacion',
      header: 'Camión y conductor',
      render: (v) => (
        <div>
          <div style={fila}>
            <Truck size={13} color="var(--text-tertiary)" />
            <strong>{v.camion.patente}</strong>
            <span style={{ color: 'var(--text-tertiary)' }}>· {v.camion.tipo}</span>
          </div>
          <div style={{ ...fila, marginTop: '0.2rem' }}>
            <User size={13} color="var(--text-tertiary)" />
            {nombreConductor(v.conductor)}
          </div>
        </div>
      ),
    },
    {
      key: 'horario',
      header: 'Salida',
      render: (v) => (
        <div>
          <div style={{ fontSize: '0.8125rem' }}>{formatearFecha(v.fechaInicio)}</div>
          <div style={muted}>
            {v.fechaCancelacion
              ? `Cancelado: ${formatearFecha(v.fechaCancelacion)}`
              : v.fechaLlegada
                ? `Llegó: ${formatearFecha(v.fechaLlegada)}`
                : `Llegada prevista: ${formatearFecha(v.fechaFin)}`}
          </div>
        </div>
      ),
    },
    {
      key: 'carga',
      header: 'Carga',
      render: (v) => (
        <div style={muted}>
          <strong style={{ color: 'var(--text-primary)' }}>{formatearNumero(v.carga.pesoTotalKg)}</strong> kg ·{' '}
          <strong style={{ color: 'var(--text-primary)' }}>{formatearNumero(v.carga.volumenTotalM3)}</strong> m³
        </div>
      ),
    },
    { key: 'estado', header: 'Estado', render: (v) => <ViajeEstadoBadge estado={v.estado} /> },
  ];

  return (
    <DataTable
      columns={columns}
      rows={viajes}
      rowKey={(v) => v.id}
      onRowClick={onSelect}
      isRowMuted={(v) => v.estado === 'CANCELADO'}
      empty={empty}
    />
  );
};
