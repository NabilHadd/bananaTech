import type { CentroDistribucion, Cliente } from '../clientes/types';

export type MercaderiaTipo = 'GENERAL' | 'REFRIGERADA' | 'PELIGROSA' | 'FRAGIL';

export type PedidoEstado = 'CREADA' | 'TRANSITO' | 'ENTREGADO' | 'CANCELADO';

export interface Pedido {
  id: number;
  idCliente: number;
  idCentro: number;
  pesoKg: number;
  volumenM3: number;
  ventanaInicio: string;
  ventanaFin: string;
  tipoMercaderia: MercaderiaTipo;
  estado: PedidoEstado;
  /** Carga Creada, Confirmada o En ruta que contiene al pedido; `null` si está libre. */
  idCargaActiva: number | null;
  cliente?: Cliente | null;
  centro?: CentroDistribucion | null;
}

export interface PedidoInput {
  idCliente: number;
  idCentro: number;
  pesoKg: number;
  volumenM3: number;
  ventanaInicio: string;
  ventanaFin: string;
  tipoMercaderia: MercaderiaTipo;
}

export interface PedidoFiltros {
  busqueda: string;
  estado: PedidoEstado | '';
  tipoMercaderia: MercaderiaTipo | '';
  idCliente?: number;
  fecha: string;
}
