/**
 * Forma de los datos de flota tal como los entregará la API.
 *
 * Los campos derivados (`estado`, `motivoBloqueo`, `vigente`, los totales del
 * historial) los calcula el backend: el frontend sólo los muestra.
 */

export type EstadoCamion = 'DISPONIBLE' | 'EN_VIAJE' | 'BLOQUEADO' | 'INACTIVO';

export type DocumentoTipo = 'RT' | 'PC' | 'SOAP' | 'PADRON' | 'CEC';

export type ViajeEstado = 'EN_RUTA' | 'FINALIZADO' | 'CANCELADO';

export interface TipoCamion {
  id: number;
  nombre: string;
}

export interface DocumentoCamion {
  id: number;
  tipo: DocumentoTipo;
  fechaEmision: string;
  fechaVencimiento: string;
  vigente: boolean;
}

export interface Camion {
  id: number;
  patente: string;
  marca: string;
  modelo: string;
  anio: number;
  idTipoCamion: number;
  tipo: string;
  pesoMaxKg: number;
  volumenMaxM3: number;
  rendimientoBaseKmL: number;
  kilometrajeActual: number;
  estado: EstadoCamion;
  /** Motivo por el que el camión no puede asignarse; `null` si está disponible. */
  motivoBloqueo: string | null;
  documentos: DocumentoCamion[];
}

export interface ViajeCamion {
  id: number;
  fechaInicio: string;
  fechaFin: string;
  origen: string;
  destino: string;
  distanciaKm: number;
  conductor: string;
  pesoKg: number;
  /** Porcentaje de la capacidad en peso del camión usado en el viaje. */
  ocupacionPct: number;
  estado: ViajeEstado;
}

export interface HistorialCamion {
  viajes: ViajeCamion[];
  totalKm: number;
  totalKg: number;
}

/** Filtros del listado de flota (HU1.3). Los aplica la API. */
export interface CamionFiltros {
  busqueda: string;
  idTipoCamion: number | null;
  estado: EstadoCamion | null;
  capacidadMinKg: number | null;
}

/** Datos del formulario de registro / edición de camión (HU1.1). */
export interface CamionInput {
  patente: string;
  marca: string;
  modelo: string;
  anio: number;
  idTipoCamion: number;
  pesoMaxKg: number;
  volumenMaxM3: number;
  rendimientoBaseKmL: number;
  kilometrajeActual: number;
}

/** Datos del formulario de registro / renovación de documento (HU1.2). */
export interface DocumentoInput {
  tipo: DocumentoTipo;
  fechaEmision: string;
  fechaVencimiento: string;
}

/** Registro de un camión nuevo: sus datos más los documentos obligatorios. */
export interface RegistroCamionInput extends CamionInput {
  documentos: DocumentoInput[];
}
