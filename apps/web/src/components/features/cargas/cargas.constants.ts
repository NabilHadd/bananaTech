import type { CargaEstado } from './types';

export const ESTADO_CARGA_OPCIONES: { valor: CargaEstado; label: string }[] = [
  { valor: 'CREADA', label: 'Creada' },
  { valor: 'CONFIRMADA', label: 'Confirmada' },
  { valor: 'EN_RUTA', label: 'En ruta' },
  { valor: 'FINALIZADA', label: 'Finalizada' },
  { valor: 'CANCELADA', label: 'Cancelada' },
];

export const codigoCarga = (id: number) => `#CAR-${String(id).padStart(4, '0')}`;
export const codigoPedido = (id: number) => `#PED-${String(id).padStart(4, '0')}`;

export const formatearNumero = (n: number) => n.toLocaleString('es-CL', { maximumFractionDigits: 2 });
