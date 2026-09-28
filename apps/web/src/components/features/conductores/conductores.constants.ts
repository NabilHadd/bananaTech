import type { SelectOption } from '../../ui/Select';
import type { ConductorFiltros, EstadoConductor } from './types';

// Etiquetas y opciones de presentación. Ninguna decide reglas de negocio.

export const ESTADO_CONDUCTOR_LABEL: Record<EstadoConductor, string> = {
  DISPONIBLE: 'Disponible',
  EN_VIAJE: 'En viaje',
  EN_DESCANSO: 'En descanso',
  BLOQUEADO: 'Bloqueado',
  INACTIVO: 'Inactivo',
};

export const FILTROS_VACIOS: ConductorFiltros = {
  busqueda: '',
  clase: null,
  estado: null,
};

export const ESTADO_OPCIONES: SelectOption[] = [
  { value: '', label: 'Todos los estados' },
  { value: 'DISPONIBLE', label: 'Disponible', sublabel: 'Habilitado para asignación' },
  { value: 'EN_VIAJE', label: 'En viaje', sublabel: 'Con un viaje en curso' },
  { value: 'EN_DESCANSO', label: 'En descanso', sublabel: 'Cumpliendo el descanso mínimo' },
  { value: 'BLOQUEADO', label: 'Bloqueado', sublabel: 'Licencia vencida o sin licencia' },
  { value: 'INACTIVO', label: 'Inactivo', sublabel: 'Dado de baja' },
];
