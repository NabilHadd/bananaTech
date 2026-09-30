import React from 'react';
import { CheckCircle2, Clock, PackageCheck, Truck, XCircle } from 'lucide-react';
import { Badge } from '../../ui/Badge';
import type { BadgeTone } from '../../ui/Badge';
import { ESTADO_CARGA_OPCIONES } from './cargas.constants';
import type { CargaEstado } from './types';

const ESTADO_CARGA_TONE: Record<CargaEstado, BadgeTone> = {
  CREADA: 'warning',
  CONFIRMADA: 'success',
  EN_RUTA: 'warning',
  FINALIZADA: 'success',
  CANCELADA: 'neutral',
};

const ESTADO_CARGA_ICON: Record<CargaEstado, React.ReactNode> = {
  CREADA: <Clock size={12} />,
  CONFIRMADA: <PackageCheck size={12} />,
  EN_RUTA: <Truck size={12} />,
  FINALIZADA: <CheckCircle2 size={12} />,
  CANCELADA: <XCircle size={12} />,
};

export const EstadoCargaBadge: React.FC<{ estado: CargaEstado }> = ({ estado }) => (
  <Badge tone={ESTADO_CARGA_TONE[estado]} icon={ESTADO_CARGA_ICON[estado]}>
    {ESTADO_CARGA_OPCIONES.find((e) => e.valor === estado)?.label ?? estado}
  </Badge>
);
