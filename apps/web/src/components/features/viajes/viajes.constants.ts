import type { SelectOption } from '../../ui/Select';
import type { Carga } from '../cargas/types';
import { codigoCarga, formatearNumero } from '../cargas/cargas.constants';
import type { Conductor } from '../conductores/types';
import type { Camion } from '../flota/types';

export const codigoViaje = (id: number) => `#VIA-${String(id).padStart(4, '0')}`;

/** La API entrega ISO sin zona (`2026-09-10T07:30:00.123`); se muestra como `2026-09-10 07:30`. */
export const formatearFecha = (iso: string) => iso.slice(0, 16).replace('T', ' ');

/** `720` → `12 h`; `95` → `1 h 35 min`. */
export const formatearDuracion = (minutos: number) => {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
};

export const nombreConductor = (c: Conductor) => `${c.nombres} ${c.apellidos}`;

export const ESTADO_VIAJE_OPCIONES: SelectOption[] = [
  { value: '', label: 'Todos los estados' },
  { value: 'EN_RUTA', label: 'En ruta', sublabel: 'Sin llegada registrada' },
  { value: 'FINALIZADO', label: 'Finalizado', sublabel: 'Llegó al centro' },
  { value: 'CANCELADO', label: 'Cancelado', sublabel: 'Su carga se canceló' },
];

export const opcionCarga = (c: Carga): SelectOption => ({
  value: String(c.id),
  label: `${codigoCarga(c.id)} → ${c.centro?.direccion ?? `centro #${c.idCentro}`}`,
  sublabel: `${c.pedidos.length} pedido(s) · ${formatearNumero(c.pesoTotalKg)} kg · ${formatearNumero(c.volumenTotalM3)} m³`,
});

export const opcionCamion = (c: Camion): SelectOption => ({
  value: String(c.id),
  label: c.patente,
  sublabel: `${c.tipo} · ${formatearNumero(c.pesoMaxKg)} kg · ${formatearNumero(c.volumenMaxM3)} m³`,
});

export const opcionConductor = (c: Conductor): SelectOption => ({
  value: String(c.id),
  label: nombreConductor(c),
  sublabel: `${c.rut} · licencia ${c.licencias[0]?.clases.join(', ') ?? '—'}`,
});
