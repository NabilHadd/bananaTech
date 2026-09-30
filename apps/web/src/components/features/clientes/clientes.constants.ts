import type { ClienteFiltros, ClienteInput } from './types';

export const FILTROS_CLIENTES_VACIOS: ClienteFiltros = {
  busqueda: '',
};

export const CLIENTE_VACIO: ClienteInput = {
  razon: '',
  rut: '',
  direccion: '',
  mail: '',
  telefono: '',
  centrosIds: [],
  centrosNuevos: [],
};
