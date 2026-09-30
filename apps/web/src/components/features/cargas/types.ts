import type { CentroDistribucion } from '../clientes/types';
import type { Pedido } from '../pedidos/types';

/**
 * Forma de las cargas tal como las entrega la API (Épica 4).
 *
 * Los totales, la incompatibilidad y la ocupación los calcula el backend: el
 * frontend sólo los muestra.
 */

export type CargaEstado = 'CREADA' | 'CONFIRMADA' | 'EN_RUTA' | 'FINALIZADA' | 'CANCELADA';

export type FactorLimitante = 'PESO' | 'VOLUMEN';

export interface Carga {
  id: number;
  idCentro: number;
  estado: CargaEstado;
  centro: CentroDistribucion | null;
  pedidos: Pedido[];
  pesoTotalKg: number;
  volumenTotalM3: number;
  /** Motivo por el que sus pedidos no pueden viajar juntos (HU4.2); `null` si pueden. */
  incompatibilidad: string | null;
}

/** Ocupación de una carga si la llevara un camión (HU4.3). */
export interface OcupacionCarga {
  idCamion: number;
  patente: string;
  pesoTotalKg: number;
  volumenTotalM3: number;
  capacidadPesoKg: number;
  capacidadVolumenM3: number;
  porcentajePeso: number;
  porcentajeVolumen: number;
  factorLimitante: FactorLimitante;
  excede: boolean;
}
