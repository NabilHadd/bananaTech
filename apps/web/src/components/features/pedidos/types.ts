import type { CentroDistribucion, Cliente } from '../clientes/types';

export type MercaderiaTipo = 'GENERAL' | 'REFRIGERADA' | 'PELIGROSA' | 'FRAGIL';

export type PedidoEstado = 'EN_ESPERA' | 'TRANSITO' | 'ENTREGADO' | 'CANCELADO';

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
  fechaEntrega?: string | null;
  receptor?: string | null;
  observaciones?: string | null;
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

export interface EntregaPedidoInput {
  idPedido: number;
  fechaEntrega: string;
  receptor: string;
  observaciones?: string | null;
}

export interface PedidoFiltros {
  busqueda: string;
  estado: PedidoEstado | '';
  tipoMercaderia: MercaderiaTipo | '';
  idCliente?: number;
  fecha: string;
}
