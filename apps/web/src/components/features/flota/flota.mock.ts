/**
 * DATOS TEMPORALES: reemplazan a `api/camion.api.ts` mientras no exista.
 *
 * Simulan lo que devolverá la API con los campos derivados ya calculados
 * (estado, vigencia de documentos, totales del historial). Borrar este archivo
 * cuando la página consuma el backend.
 */
import type { Camion, CamionFiltros, HistorialCamion, TipoCamion } from './types';

export const TIPOS_CAMION_MOCK: TipoCamion[] = [
  { id: 1, nombre: 'Rampla plana' },
  { id: 2, nombre: 'Semirremolque' },
  { id: 3, nombre: '3/4' },
];

export const CAMIONES_MOCK: Camion[] = [
  {
    id: 1,
    patente: 'ABCD-12',
    marca: 'Volvo',
    modelo: 'FH 500',
    anio: 2023,
    idTipoCamion: 1,
    tipo: 'Rampla plana',
    pesoMaxKg: 25000,
    volumenMaxM3: 90,
    rendimientoBaseKmL: 2.8,
    kilometrajeActual: 142500,
    estado: 'DISPONIBLE',
    motivoBloqueo: null,
    documentos: [
      { id: 1, tipo: 'RT', fechaEmision: '2026-01-01', fechaVencimiento: '2027-01-01', vigente: true },
      { id: 2, tipo: 'PC', fechaEmision: '2026-03-01', fechaVencimiento: '2027-03-31', vigente: true },
      { id: 3, tipo: 'SOAP', fechaEmision: '2026-03-01', fechaVencimiento: '2027-03-31', vigente: true },
    ],
  },
  {
    id: 2,
    patente: 'EFGH-34',
    marca: 'Scania',
    modelo: 'R450',
    anio: 2022,
    idTipoCamion: 2,
    tipo: 'Semirremolque',
    pesoMaxKg: 28000,
    volumenMaxM3: 110,
    rendimientoBaseKmL: 2.4,
    kilometrajeActual: 210300,
    estado: 'BLOQUEADO',
    motivoBloqueo: 'Revisión Técnica (RT) vencida el 2025-06-01.',
    documentos: [
      { id: 4, tipo: 'RT', fechaEmision: '2024-06-01', fechaVencimiento: '2025-06-01', vigente: false },
      { id: 5, tipo: 'PC', fechaEmision: '2026-03-01', fechaVencimiento: '2027-03-31', vigente: true },
      { id: 6, tipo: 'SOAP', fechaEmision: '2026-03-01', fechaVencimiento: '2027-03-31', vigente: true },
    ],
  },
  {
    id: 3,
    patente: 'IJKL-56',
    marca: 'Mercedes-Benz',
    modelo: 'Atego 1018',
    anio: 2021,
    idTipoCamion: 3,
    tipo: '3/4',
    pesoMaxKg: 4000,
    volumenMaxM3: 20,
    rendimientoBaseKmL: 6.2,
    kilometrajeActual: 89100,
    estado: 'DISPONIBLE',
    motivoBloqueo: null,
    documentos: [
      { id: 7, tipo: 'RT', fechaEmision: '2026-01-01', fechaVencimiento: '2027-01-01', vigente: true },
      { id: 8, tipo: 'PC', fechaEmision: '2026-03-01', fechaVencimiento: '2027-03-31', vigente: true },
      { id: 9, tipo: 'SOAP', fechaEmision: '2026-03-01', fechaVencimiento: '2027-03-31', vigente: true },
    ],
  },
  {
    id: 4,
    patente: 'MNOP-78',
    marca: 'Volvo',
    modelo: 'FMX 460',
    anio: 2018,
    idTipoCamion: 1,
    tipo: 'Rampla plana',
    pesoMaxKg: 24000,
    volumenMaxM3: 85,
    rendimientoBaseKmL: 2.6,
    kilometrajeActual: 398200,
    estado: 'INACTIVO',
    motivoBloqueo: 'Camión dado de baja.',
    documentos: [
      { id: 10, tipo: 'RT', fechaEmision: '2025-02-01', fechaVencimiento: '2026-02-01', vigente: false },
      { id: 11, tipo: 'PC', fechaEmision: '2025-03-01', fechaVencimiento: '2026-03-31', vigente: false },
      { id: 12, tipo: 'SOAP', fechaEmision: '2025-03-01', fechaVencimiento: '2026-03-31', vigente: false },
    ],
  },
];

export const HISTORIAL_MOCK: Record<number, HistorialCamion> = {
  1: {
    totalKm: 1350.5,
    totalKg: 37000,
    viajes: [
      { id: 2, fechaInicio: '2026-09-15 06:00', fechaFin: '2026-09-15 19:30', origen: 'Coquimbo (Base Principal)', destino: 'Antofagasta (La Negra)', distanciaKm: 890, conductor: 'Juan Pérez Gallardo', pesoKg: 22000, ocupacionPct: 88, estado: 'FINALIZADO' },
      { id: 1, fechaInicio: '2026-09-10 07:30', fechaFin: '2026-09-10 13:45', origen: 'Coquimbo (Base Principal)', destino: 'Santiago (Pudahuel)', distanciaKm: 460.5, conductor: 'Juan Pérez Gallardo', pesoKg: 15000, ocupacionPct: 60, estado: 'FINALIZADO' },
    ],
  },
  2: {
    totalKm: 1350.5,
    totalKg: 45000,
    viajes: [
      { id: 4, fechaInicio: '2026-09-12 08:00', fechaFin: '2026-09-12 14:30', origen: 'Coquimbo (Base Principal)', destino: 'Santiago (Pudahuel)', distanciaKm: 460.5, conductor: 'Carlos Gómez Valenzuela', pesoKg: 20000, ocupacionPct: 71, estado: 'FINALIZADO' },
      { id: 3, fechaInicio: '2026-08-28 05:30', fechaFin: '2026-08-28 19:00', origen: 'Coquimbo (Base Principal)', destino: 'Antofagasta (La Negra)', distanciaKm: 890, conductor: 'Carlos Gómez Valenzuela', pesoKg: 25000, ocupacionPct: 89, estado: 'FINALIZADO' },
    ],
  },
  3: {
    totalKm: 120,
    totalKg: 6000,
    viajes: [
      { id: 6, fechaInicio: '2026-09-18 10:00', fechaFin: '2026-09-18 11:15', origen: 'Coquimbo (Base Principal)', destino: 'La Serena Industrial', distanciaKm: 35, conductor: 'Luis Silva Tapia', pesoKg: 2800, ocupacionPct: 70, estado: 'FINALIZADO' },
      { id: 5, fechaInicio: '2026-09-14 09:00', fechaFin: '2026-09-14 11:30', origen: 'Coquimbo (Base Principal)', destino: 'Vicuña (Valle del Elqui)', distanciaKm: 85, conductor: 'Luis Silva Tapia', pesoKg: 3200, ocupacionPct: 80, estado: 'FINALIZADO' },
    ],
  },
};

export const HISTORIAL_VACIO: HistorialCamion = { viajes: [], totalKm: 0, totalKg: 0 };

/** Sustituye al filtrado que hará la query `camiones(filtros)` en el backend. */
export function filtrarCamionesMock(camiones: Camion[], filtros: CamionFiltros): Camion[] {
  const busqueda = filtros.busqueda.trim().toLowerCase();
  return camiones.filter(
    (c) =>
      (busqueda === '' ||
        [c.patente, c.marca, c.modelo, c.tipo].some((campo) => campo.toLowerCase().includes(busqueda))) &&
      (filtros.idTipoCamion === null || c.idTipoCamion === filtros.idTipoCamion) &&
      (filtros.estado === null || c.estado === filtros.estado) &&
      (filtros.capacidadMinKg === null || c.pesoMaxKg >= filtros.capacidadMinKg),
  );
}
