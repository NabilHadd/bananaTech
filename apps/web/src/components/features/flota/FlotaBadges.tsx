import React from 'react';
import { AlertTriangle, CheckCircle2, Navigation, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Badge } from '../../ui/Badge';
import type { BadgeTone } from '../../ui/Badge';
import { ESTADO_CAMION_LABEL, VIAJE_ESTADO_LABEL } from './flota.constants';
import type { EstadoCamion, ViajeEstado } from './types';

const ESTADO_CAMION_TONE: Record<EstadoCamion, BadgeTone> = {
  DISPONIBLE: 'success',
  EN_VIAJE: 'warning',
  BLOQUEADO: 'error',
  INACTIVO: 'neutral',
};

const ESTADO_CAMION_ICON: Record<EstadoCamion, React.ReactNode> = {
  DISPONIBLE: <CheckCircle2 size={12} />,
  EN_VIAJE: <Navigation size={12} />,
  BLOQUEADO: <ShieldAlert size={12} />,
  INACTIVO: null,
};

export const EstadoCamionBadge: React.FC<{ estado: EstadoCamion }> = ({ estado }) => (
  <Badge tone={ESTADO_CAMION_TONE[estado]} icon={ESTADO_CAMION_ICON[estado]}>
    {ESTADO_CAMION_LABEL[estado]}
  </Badge>
);

export const VigenciaBadge: React.FC<{ vigente: boolean }> = ({ vigente }) =>
  vigente ? (
    <Badge tone="success" icon={<ShieldCheck size={12} />}>Vigente</Badge>
  ) : (
    <Badge tone="error" icon={<AlertTriangle size={12} />}>Vencido</Badge>
  );

const VIAJE_ESTADO_TONE: Record<ViajeEstado, BadgeTone> = {
  EN_RUTA: 'warning',
  FINALIZADO: 'success',
  CANCELADO: 'neutral',
};

export const ViajeEstadoBadge: React.FC<{ estado: ViajeEstado }> = ({ estado }) => (
  <Badge tone={VIAJE_ESTADO_TONE[estado]}>{VIAJE_ESTADO_LABEL[estado]}</Badge>
);
