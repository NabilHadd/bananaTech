/**
 * Forma de los datos de conductores tal como los entrega la API.
 *
 * Los campos derivados (`estado`, `motivoBloqueo`, `vigente`, los tipos de
 * camión habilitados, el resumen del panel) los calcula el backend: el
 * frontend sólo los muestra.
 */
import type { ViajeEstado } from '../flota/types';

export type EstadoConductor = 'DISPONIBLE' | 'EN_VIAJE' | 'EN_DESCANSO' | 'BLOQUEADO' | 'INACTIVO';

export type LicenciaClase = 'A1' | 'A2' | 'A3' | 'A4' | 'A5' | 'B' | 'C' | 'D' | 'E' | 'F';

/** Entrada del catálogo de clases, con los tipos de camión que habilita (RN-04). */
export interface ClaseLicencia {
  clase: LicenciaClase;
  descripcion: string | null;
  tiposCamion: string[];
}

export interface Licencia {
  id: number;
  clases: LicenciaClase[];
  fechaEmision: string;
  fechaVencimiento: string;
  /** Es la licencia actual y no ha vencido; las anteriores quedan como historial. */
  vigente: boolean;
  tiposCamionHabilitados: string[];
}

export interface Conductor {
  id: number;
  rut: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  email: string;
  estado: EstadoConductor;
  /** Motivo por el que el conductor no puede asignarse; `null` si está disponible. */
  motivoBloqueo: string | null;
  /** Historial de licencias, la actual primero. */
  licencias: Licencia[];
}

/** Indicador disponibles / total del panel de personal (HU2.1). `total` excluye a los dados de baja. */
export interface ResumenPersonal {
  total: number;
  disponibles: number;
  enViaje: number;
  enDescanso: number;
  bloqueados: number;
  inactivos: number;
}

export interface ViajeConductor {
  id: number;
  fechaInicio: string;
  fechaFin: string;
  patente: string;
  origen: string;
  destino: string;
  distanciaKm: number;
  pesoKg: number;
  estado: ViajeEstado;
}

export interface HistorialConductor {
  viajes: ViajeConductor[];
  totalKm: number;
}

/** Filtros del panel de personal (HU2.1). Los aplica la API. */
export interface ConductorFiltros {
  busqueda: string;
  clase: LicenciaClase | null;
  estado: EstadoConductor | null;
}

/** Datos del formulario de registro / edición de conductor (HU2.2). */
export interface ConductorInput {
  rut: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  email: string;
}

/** Datos del formulario de licencia: registro inicial o renovación (HU2.2). */
export interface LicenciaInput {
  clases: LicenciaClase[];
  fechaEmision: string;
  fechaVencimiento: string;
}

/** Registro de un conductor nuevo: sus datos más su licencia. */
export interface RegistroConductorInput extends ConductorInput {
  licencia: LicenciaInput;
}
