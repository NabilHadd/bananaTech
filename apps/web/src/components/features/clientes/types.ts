/**
 * Forma de los datos de clientes tal como los entrega la API (Épica 3: HU3.1).
 */

export interface CentroDistribucion {
  id: number;
  direccion: string;
  distanciaKm: number;
  distanciaMin: number;
}

export interface CentroNuevoInput {
  direccion: string;
  distanciaKm: number;
  distanciaMin: number;
}

export interface Cliente {
  id: number;
  razon: string;
  rut: string;
  direccion: string | null;
  mail: string | null;
  telefono: string | null;
  centros: CentroDistribucion[];
}

export interface ClienteInput {
  razon: string;
  rut: string;
  direccion?: string | null;
  mail?: string | null;
  telefono?: string | null;
  centrosIds?: number[] | null;
  centrosNuevos?: CentroNuevoInput[] | null;
}

export interface ClienteFiltros {
  busqueda: string;
}
