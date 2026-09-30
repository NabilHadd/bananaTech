import React from 'react';
import { AlertTriangle, Boxes, MapPin } from 'lucide-react';
import { DataTable } from '../../common/DataTable';
import type { Column } from '../../common/DataTable';
import { MercaderiaBadge } from '../pedidos/PedidoBadges';
import { EstadoCargaBadge } from './CargaBadges';
import { codigoCarga, formatearNumero } from './cargas.constants';
import type { Carga } from './types';

interface CargaTableProps {
  cargas: Carga[];
  onSelect?: (carga: Carga) => void;
  empty: React.ReactNode;
}

const muted = { fontSize: '0.75rem', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' } as const;
const strong = { fontWeight: 600, color: 'var(--text-primary)' } as const;

export const CargaTable: React.FC<CargaTableProps> = ({ cargas, onSelect, empty }) => {
  const columns: Column<Carga>[] = [
    {
      key: 'carga',
      header: 'Carga',
      render: (c) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            className="conductor-avatar"
            style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.35))',
              color: 'var(--accent-primary)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
            }}
          >
            <Boxes size={16} />
          </div>
          <div>
            <div style={strong}>{codigoCarga(c.id)}</div>
            <div style={muted}>
              {c.pedidos.length} pedido{c.pedidos.length === 1 ? '' : 's'}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'destino',
      header: 'Destino',
      render: (c) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8125rem' }}>
            <MapPin size={13} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
            <span>{c.centro?.direccion ?? `Centro #${c.idCentro}`}</span>
          </div>
          {c.centro && (
            <div style={{ ...muted, marginTop: '0.25rem' }}>
              <span className="doc-chip" style={{ fontSize: '0.7rem' }}>
                {c.centro.distanciaKm} km · {c.centro.distanciaMin} min
              </span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'mercaderia',
      header: 'Mercadería',
      render: (c) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', alignItems: 'center' }}>
          {[...new Set(c.pedidos.map((p) => p.tipoMercaderia))].map((t) => (
            <MercaderiaBadge key={t} tipo={t} />
          ))}
          {c.incompatibilidad && (
            <span title={c.incompatibilidad} style={{ display: 'flex', color: 'var(--status-error)' }}>
              <AlertTriangle size={14} />
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'totales',
      header: 'Peso y volumen',
      render: (c) => (
        <div style={muted}>
          <strong style={{ color: 'var(--text-primary)' }}>{formatearNumero(c.pesoTotalKg)}</strong> kg ·{' '}
          <strong style={{ color: 'var(--text-primary)' }}>{formatearNumero(c.volumenTotalM3)}</strong> m³
        </div>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (c) => <EstadoCargaBadge estado={c.estado} />,
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={cargas}
      rowKey={(c) => c.id}
      onRowClick={onSelect}
      isRowMuted={(c) => c.estado === 'CANCELADA'}
      empty={empty}
    />
  );
};
