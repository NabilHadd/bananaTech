import type { MercaderiaTipo, PedidoEstado, PedidoFiltros, PedidoInput } from './types';

export const MERCADERIA_OPCIONES: { valor: MercaderiaTipo; label: string }[] = [
  { valor: 'GENERAL', label: 'General' },
  { valor: 'REFRIGERADA', label: 'Refrigerada' },
  { valor: 'PELIGROSA', label: 'Peligrosa' },
  { valor: 'FRAGIL', label: 'Frágil' },
];

export const ESTADO_PEDIDO_OPCIONES: { valor: PedidoEstado; label: string }[] = [
  { valor: 'EN_ESPERA', label: 'En espera (Creado)' },
  { valor: 'TRANSITO', label: 'En tránsito' },
  { valor: 'ENTREGADO', label: 'Entregado' },
  { valor: 'CANCELADO', label: 'Cancelado' },
];

export const FILTROS_PEDIDOS_VACIOS: PedidoFiltros = {
  busqueda: '',
  estado: '',
  tipoMercaderia: '',
  fecha: '',
};

export const FILTROS_INICIALES_PEDIDOS: PedidoFiltros = {
  ...FILTROS_PEDIDOS_VACIOS,
  estado: 'EN_ESPERA',
};

export const PEDIDO_VACIO: PedidoInput = {
  idCliente: 0,
  idCentro: 0,
  pesoKg: 0,
  volumenM3: 0,
  ventanaInicio: '',
  ventanaFin: '',
  tipoMercaderia: 'GENERAL',
};
