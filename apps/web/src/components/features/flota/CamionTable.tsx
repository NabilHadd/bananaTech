import React from 'react';
import { Check, Eye, Truck } from 'lucide-react';
import { DataTable } from '../../common/DataTable';
import type { Column } from '../../common/DataTable';
import { Button } from '../../ui/Button';
import { EstadoCamionBadge } from './FlotaBadges';
import { DOCUMENTOS_OBLIGATORIOS } from './flota.constants';
import type { Camion } from './types';

interface CamionTableProps {
  camiones: Camion[];
  onSelect: (camion: Camion) => void;
  empty: React.ReactNode;
}

const muted = { fontSize: '0.75rem', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' } as const;
const strong = { fontWeight: 600, color: 'var(--text-primary)' } as const;

/** Todos sus documentos vigentes y ninguno obligatorio faltante. El detalle está en la ficha. */
const documentosAlDia = (c: Camion) =>
  c.documentos.every((d) => d.vigente) &&
  DOCUMENTOS_OBLIGATORIOS.every((tipo) => c.documentos.some((d) => d.tipo === tipo));

export const CamionTable: React.FC<CamionTableProps> = ({ camiones, onSelect, empty }) => {
  const columns: Column<Camion>[] = [
    {
      key: 'patente',
      header: 'Patente',
      render: (c) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className={`camion-avatar estado-${c.estado.toLowerCase()}`}>
            <Truck size={18} />
          </div>
          <span style={{ ...strong, letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{c.patente}</span>
        </div>
      ),
    },
    {
      key: 'modelo',
      header: 'Marca / Modelo / Año',
      render: (c) => (
        <>
          <div style={strong}>{c.marca} {c.modelo}</div>
          <div style={muted}>Año {c.anio}</div>
        </>
      ),
    },
    {
      key: 'tipo',
      header: 'Tipo',
      render: (c) => <span className="chip">{c.tipo}</span>,
    },
    {
      key: 'capacidad',
      header: 'Capacidad Máxima',
      render: (c) => (
        <>
          <div style={strong}>{c.pesoMaxKg.toLocaleString('es-CL')} kg</div>
          <div style={muted}>Volumen: {c.volumenMaxM3} m³</div>
        </>
      ),
    },
    {
      key: 'rendimiento',
      header: 'Rendimiento & Km',
      render: (c) => (
        <>
          <div style={strong}>{c.rendimientoBaseKmL.toFixed(1)} km/L</div>
          <div style={muted}>{c.kilometrajeActual.toLocaleString('es-CL')} km</div>
        </>
      ),
    },
    {
      key: 'documentos',
      header: 'Documentos',
      render: (c) => {
        const alDia = documentosAlDia(c);
        return (
          <span
            className={`doc-status${alDia ? '' : ' alerta'}`}
            title={alDia ? 'Documentación al día' : 'Documentos vencidos o faltantes: ver detalle en la ficha'}
            aria-label={alDia ? 'Documentación al día' : 'Documentos vencidos o faltantes'}
          >
            {alDia ? <Check size={14} strokeWidth={3} /> : '!'}
          </span>
        );
      },
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (c) => <EstadoCamionBadge estado={c.estado} />,
    },
    {
      key: 'acciones',
      header: 'Acciones',
      render: (c) => (
        <Button
          size="sm"
          icon={<Eye size={13} />}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(c);
          }}
          title="Ver ficha técnica, documentos e historial de viajes"
        >
          Ficha
        </Button>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={camiones}
      rowKey={(c) => c.id}
      onRowClick={onSelect}
      isRowMuted={(c) => c.estado === 'INACTIVO'}
      empty={empty}
    />
  );
};
