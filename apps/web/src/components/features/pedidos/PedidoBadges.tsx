import React from 'react';
import { AlertTriangle, CheckCircle2, Clock, Package, Snowflake, Truck, XCircle } from 'lucide-react';
import { Badge } from '../../ui/Badge';
import type { BadgeTone } from '../../ui/Badge';
import type { MercaderiaTipo, PedidoEstado } from './types';

const ESTADO_PEDIDO_TONE: Record<PedidoEstado, BadgeTone> = {
  CREADA: 'warning',
  TRANSITO: 'warning',
  ENTREGADO: 'success',
  CANCELADO: 'neutral',
};

const ESTADO_PEDIDO_LABEL: Record<PedidoEstado, string> = {
  CREADA: 'Creada',
  TRANSITO: 'En tránsito',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
};

const ESTADO_PEDIDO_ICON: Record<PedidoEstado, React.ReactNode> = {
  CREADA: <Clock size={12} />,
  TRANSITO: <Truck size={12} />,
  ENTREGADO: <CheckCircle2 size={12} />,
  CANCELADO: <XCircle size={12} />,
};

export const EstadoPedidoBadge: React.FC<{ estado: PedidoEstado }> = ({ estado }) => (
  <Badge tone={ESTADO_PEDIDO_TONE[estado]} icon={ESTADO_PEDIDO_ICON[estado]}>
    {ESTADO_PEDIDO_LABEL[estado]}
  </Badge>
);

const MERCADERIA_LABEL: Record<MercaderiaTipo, string> = {
  GENERAL: 'General',
  REFRIGERADA: 'Refrigerada',
  PELIGROSA: 'Peligrosa',
  FRAGIL: 'Frágil',
};

const MERCADERIA_ICON: Record<MercaderiaTipo, React.ReactNode> = {
  GENERAL: <Package size={12} />,
  REFRIGERADA: <Snowflake size={12} />,
  PELIGROSA: <AlertTriangle size={12} />,
  FRAGIL: <Package size={12} />,
};

export const MercaderiaBadge: React.FC<{ tipo: MercaderiaTipo }> = ({ tipo }) => {
  return (
    <span
      className="doc-chip"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
        fontSize: '0.75rem',
        fontWeight: 500,
      }}
    >
      {MERCADERIA_ICON[tipo]}
      {MERCADERIA_LABEL[tipo]}
    </span>
  );
};
