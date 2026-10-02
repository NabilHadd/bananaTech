import React from 'react';
import { Building2, Calendar, MapPin, Package } from 'lucide-react';
import { DataTable } from '../../common/DataTable';
import type { Column } from '../../common/DataTable';
import { EstadoPedidoBadge, MercaderiaBadge } from './PedidoBadges';
import type { Pedido } from './types';

interface PedidoTableProps {
  pedidos: Pedido[];
  onSelect?: (pedido: Pedido) => void;
  empty: React.ReactNode;
}

const muted = { fontSize: '0.75rem', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' } as const;
const strong = { fontWeight: 600, color: 'var(--text-primary)' } as const;

function formatearFecha(iso: string): string {
  if (!iso) return '-';
  const fecha = new Date(iso);
  if (isNaN(fecha.getTime())) return iso;
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(fecha);
}

export const PedidoTable: React.FC<PedidoTableProps> = ({
  pedidos,
  onSelect,
  empty,
}) => {
  const columns: Column<Pedido>[] = [
    {
      key: 'pedido',
      header: 'Pedido',
      render: (p) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            className="conductor-avatar"
            style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.35))',
              color: 'var(--accent-primary)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
            }}
          >
            <Package size={16} />
          </div>
          <div>
            <div style={strong}>#PED-{String(p.id).padStart(4, '0')}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'cliente',
      header: 'Cliente',
      render: (p) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              flexShrink: 0,
            }}
          >
            <Building2 size={14} />
          </div>
          <div>
            <div style={strong}>{p.cliente?.razon ?? `Cliente #${p.idCliente}`}</div>
            <div style={muted}>{p.cliente ? `RUT ${p.cliente.rut}` : 'Sin datos'}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'destino',
      header: 'Destino',
      render: (p) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8125rem' }}>
            <MapPin size={13} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
            <span>{p.centro?.direccion ?? `Centro #${p.idCentro}`}</span>
          </div>
          {p.centro && (
            <div style={{ ...muted, marginTop: '0.25rem' }}>
              <span className="doc-chip" style={{ fontSize: '0.7rem' }}>
                {p.centro.distanciaKm} km · {p.centro.distanciaMin} min
              </span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'carga',
      header: 'Carga',
      render: (p) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
            <MercaderiaBadge tipo={p.tipoMercaderia} />
          </div>
          <div style={muted}>
            <strong style={{ color: 'var(--text-primary)' }}>{p.pesoKg.toLocaleString('es-CL')}</strong> kg ·{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{p.volumenM3}</strong> m³
          </div>
        </div>
      ),
    },
    {
      key: 'ventana',
      header: 'Ventana de Entrega',
      render: (p) => (
        <div style={{ fontSize: '0.8125rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)' }}>
            <Calendar size={12} color="var(--text-tertiary)" />
            <span>Desde: {formatearFecha(p.ventanaInicio)}</span>
          </div>
          <div style={{ ...muted, marginTop: '0.15rem', paddingLeft: '1rem' }}>
            Hasta: {formatearFecha(p.ventanaFin)}
          </div>
        </div>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (p) => <EstadoPedidoBadge estado={p.estado} />,
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={pedidos}
      rowKey={(p) => p.id}
      onRowClick={onSelect}
      empty={empty}
    />
  );
};
