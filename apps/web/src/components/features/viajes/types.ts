import type { Carga, OcupacionCarga } from '../cargas/types';
import type { Conductor } from '../conductores/types';
import type { Camion, ViajeEstado } from '../flota/types';

/**
 * Forma de los viajes tal como los entrega la API (Épica 5).
 *
 * El estado del viaje, la propuesta del motor y qué camiones y conductores
 * son compatibles los calcula el backend: el frontend sólo los muestra.
 */

export interface Viaje {
  id: number;
  idConductor: number;
  idCamion: number;
  idCarga: number;
  estado: ViajeEstado;
  origen: string;
  fechaInicio: string;
  /** Término previsto: salida más el tiempo de viaje al centro. */
  fechaFin: string;
  /** Llegada real; `null` mientras está en ruta. */
  fechaLlegada: string | null;
  receptor: string | null;
  observacion: string | null;
  /** Cuándo se canceló; `null` si no se canceló. */
  fechaCancelacion: string | null;
  conductor: Conductor;
  camion: Camion;
  carga: Carga;
}

/** Asignación que propone el motor (HU5.1); no se guarda hasta generar el viaje. */
export interface PropuestaViaje {
  carga: Carga;
  camion: Camion;
  conductor: Conductor;
  ocupacion: OcupacionCarga;
  fechaInicio: string;
  fechaFin: string;
}

/** Datos de la llegada al centro, al finalizar el viaje (HU5.2). */
export interface LlegadaInput {
  fechaLlegada: string;
  receptor: string;
  observacion: string | null;
}

/** Carga, camión y conductor de un viaje nuevo (HU5.1). */
export interface ViajeInput {
  idCarga: number;
  idCamion: number;
  idConductor: number;
}
