import React from 'react';
import { Calendar } from 'lucide-react';
import { MercaderiaBadge } from '../pedidos/PedidoBadges';
import type { Pedido } from '../pedidos/types';
import { codigoPedido, formatearNumero } from './cargas.constants';

interface PedidosSeleccionablesProps {
  pedidos: Pedido[];
  seleccion: number[];
  onToggle: (id: number) => void;
}

const fecha = (iso: string) =>
  new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(
    new Date(iso),
  );

/** Lista de pedidos libres con casilla, para armar o ampliar una carga (HU4.1). */
export const PedidosSeleccionables: React.FC<PedidosSeleccionablesProps> = ({ pedidos, seleccion, onToggle }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
    {pedidos.map((p) => {
      const seleccionado = seleccion.includes(p.id);
      return (
        <label
          key={p.id}
          className={`clase-option${seleccionado ? ' selected' : ''}`}
          style={{ alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.8rem' }}
        >
          <input type="checkbox" checked={seleccionado} onChange={() => onToggle(p.id)} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <strong>{codigoPedido(p.id)}</strong>
            <span style={{ color: 'var(--text-secondary)' }}> · {p.cliente?.razon ?? `Cliente #${p.idCliente}`}</span>
            <span className="clase-option-detalle" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Calendar size={12} /> Entrega desde {fecha(p.ventanaInicio)}
            </span>
          </span>
          <MercaderiaBadge tipo={p.tipoMercaderia} />
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', minWidth: '130px', textAlign: 'right' }}>
            {formatearNumero(p.pesoKg)} kg · {formatearNumero(p.volumenM3)} m³
          </span>
        </label>
      );
    })}
  </div>
);
