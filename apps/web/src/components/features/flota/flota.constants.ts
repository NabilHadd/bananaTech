import type { SelectOption } from '../../ui/Select';
import type { CamionFiltros, DocumentoTipo, EstadoCamion, ViajeEstado } from './types';

// Etiquetas y opciones de presentación. Ninguna decide reglas de negocio.

export const ESTADO_CAMION_LABEL: Record<EstadoCamion, string> = {
  DISPONIBLE: 'Disponible',
  BLOQUEADO: 'Bloqueado',
  INACTIVO: 'Inactivo',
};

export const DOCUMENTO_LABEL: Record<DocumentoTipo, string> = {
  RT: 'Revisión Técnica',
  PC: 'Permiso de Circulación',
  SOAP: 'Seguro Obligatorio (SOAP)',
  PADRON: 'Padrón del Vehículo',
  CEC: 'Certificado de Emisión de Contaminantes',
};

export const DOCUMENTO_TIPOS: DocumentoTipo[] = ['RT', 'PC', 'SOAP', 'PADRON', 'CEC'];

/**
 * Documentos que pide el formulario de registro de camión. Sólo define qué
 * campos se muestran: la exigencia real la valida el backend.
 */
export const DOCUMENTOS_OBLIGATORIOS: DocumentoTipo[] = ['RT', 'PC', 'SOAP'];

export const VIAJE_ESTADO_LABEL: Record<ViajeEstado, string> = {
  EN_RUTA: 'En ruta',
  FINALIZADO: 'Finalizado',
  CANCELADO: 'Cancelado',
};

export const FILTROS_VACIOS: CamionFiltros = {
  busqueda: '',
  idTipoCamion: null,
  estado: null,
  capacidadMinKg: null,
};

export const ESTADO_OPCIONES: SelectOption[] = [
  { value: '', label: 'Todos los estados' },
  { value: 'DISPONIBLE', label: 'Disponible', sublabel: 'Habilitado para asignación' },
  { value: 'BLOQUEADO', label: 'Bloqueado', sublabel: 'Documentación vencida' },
  { value: 'INACTIVO', label: 'Inactivo', sublabel: 'Dado de baja' },
];

export const CAPACIDAD_OPCIONES: SelectOption[] = [
  { value: '', label: 'Cualquier capacidad' },
  { value: '5000', label: '≥ 5.000 kg', sublabel: 'Mediano / Pesado' },
  { value: '15000', label: '≥ 15.000 kg', sublabel: 'Alta capacidad' },
  { value: '25000', label: '≥ 25.000 kg', sublabel: 'Gran tonelaje' },
];
