import React from 'react';
import { AlertTriangle, CheckCircle2, Coffee, Navigation, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Badge } from '../../ui/Badge';
import type { BadgeTone } from '../../ui/Badge';
import { ESTADO_CONDUCTOR_LABEL } from './conductores.constants';
import type { EstadoConductor } from './types';

const ESTADO_CONDUCTOR_TONE: Record<EstadoConductor, BadgeTone> = {
  DISPONIBLE: 'success',
  EN_VIAJE: 'warning',
  EN_DESCANSO: 'info',
  BLOQUEADO: 'error',
  INACTIVO: 'neutral',
};

const ESTADO_CONDUCTOR_ICON: Record<EstadoConductor, React.ReactNode> = {
  DISPONIBLE: <CheckCircle2 size={12} />,
  EN_VIAJE: <Navigation size={12} />,
  EN_DESCANSO: <Coffee size={12} />,
  BLOQUEADO: <ShieldAlert size={12} />,
  INACTIVO: null,
};

export const EstadoConductorBadge: React.FC<{ estado: EstadoConductor }> = ({ estado }) => (
  <Badge tone={ESTADO_CONDUCTOR_TONE[estado]} icon={ESTADO_CONDUCTOR_ICON[estado]}>
    {ESTADO_CONDUCTOR_LABEL[estado]}
  </Badge>
);

/** Sólo la licencia más reciente puede estar vigente; las anteriores quedan reemplazadas. */
export const LicenciaBadge: React.FC<{ vigente: boolean; actual: boolean }> = ({ vigente, actual }) =>
  vigente ? (
    <Badge tone="success" icon={<ShieldCheck size={12} />}>Vigente</Badge>
  ) : actual ? (
    <Badge tone="error" icon={<AlertTriangle size={12} />}>Vencida</Badge>
  ) : (
    <Badge tone="neutral">Reemplazada</Badge>
  );
