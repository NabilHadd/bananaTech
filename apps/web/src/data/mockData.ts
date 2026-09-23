import { useState, useEffect } from 'react';

export interface DocumentoCamion {
  id: number;
  tipo: 'RT' | 'PC' | 'SOAP' | 'PADRON' | 'CEC';
  nombre: string;
  fechaEmision: string;
  fechaVencimiento: string;
  vencido: boolean;
}

export interface Camion {
  id: number;
  codigo: string;
  patente: string;
  marca: string;
  modelo: string;
  anio: number;
  tipo: '3/4' | 'Semirremolque' | 'Rampla plana';
  pesoMaxKg: number;
  volumenMaxM3: number;
  rendimientoBaseKmL: number;
  kilometrajeActual: number;
  estado: 'Disponible' | 'En ruta' | 'Bloqueado' | 'En mantención';
  motivoBloqueo?: string;
  activo: boolean;
  documentos: DocumentoCamion[];
}

export interface Conductor {
  id: number;
  rut: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  email: string;
  claseLicencia: 'A1' | 'A2' | 'A3' | 'A4' | 'A5' | 'B';
  fechaEmisionLicencia: string;
  fechaVencimientoLicencia: string;
  licenciaVencida: boolean;
  tiposHabilitados: string[];
  estado: 'Disponible' | 'En viaje' | 'En descanso' | 'Bloqueado';
  motivoBloqueo?: string;
}

export interface CentroDistribucion {
  id: number;
  nombre: string;
  direccion: string;
  distanciaKm: number;
  tiempoEstimadoMin: number;
}

export interface Cliente {
  id: number;
  razon: string;
  rut: string;
  direccion: string;
  mail: string;
  telefono: string;
  centroAsociado: string;
}

export interface Pedido {
  id: number;
  codigo: string;
  clienteId: number;
  clienteNombre: string;
  pesoKg: number;
  volumenM3: number;
  ventanaInicio: string;
  ventanaFin: string;
  tipoMercaderia: 'GENERAL' | 'REFRIGERADA' | 'PELIGROSA' | 'FRAGIL';
  estado: 'EN_ESPERA' | 'TRANSITO' | 'ENTREGADO' | 'CANCELADO';
  destino: string;
}

export interface Carga {
  id: number;
  codigo: string;
  centroDestino: string;
  estado: 'CREADO' | 'EN_RUTA' | 'CANCELADA';
  pedidos: Pedido[];
  pesoTotalKg: number;
  volumenTotalM3: number;
  alertaEspecial?: {
    tipo: 'warning' | 'error';
    titulo: string;
    mensaje: string;
  };
}

export const CENTROS_DISTRIBUCION: CentroDistribucion[] = [
  { id: 1, nombre: 'Coquimbo (Base Principal)', direccion: 'Ruta 5 Norte Km 465, Coquimbo', distanciaKm: 0, tiempoEstimadoMin: 0 },
  { id: 2, nombre: 'Santiago (Pudahuel)', direccion: 'Camino San Pedro 800, Enea, Pudahuel', distanciaKm: 460.5, tiempoEstimadoMin: 300 },
  { id: 3, nombre: 'Antofagasta (La Negra)', direccion: 'Sector Industrial La Negra Lote 14', distanciaKm: 890.0, tiempoEstimadoMin: 720 },
];

export const CLIENTES: Cliente[] = [
  {
    id: 1,
    razon: 'AgroNorte S.A.',
    rut: '76.123.456-7',
    direccion: 'Parcela 15, Valle del Elqui',
    mail: 'logistica@agronorte.cl',
    telefono: '+56 9 1111 2222',
    centroAsociado: 'Coquimbo (Base Principal)'
  },
  {
    id: 2,
    razon: 'Minería San José',
    rut: '77.987.654-3',
    direccion: 'Ruta 5 Norte Km 750',
    mail: 'despachos@msanjose.cl',
    telefono: '+56 9 3333 4444',
    centroAsociado: 'Antofagasta (La Negra)'
  },
  {
    id: 3,
    razon: 'Retail Express',
    rut: '78.555.666-1',
    direccion: 'Av. Apoquindo 1234, Las Condes, Santiago',
    mail: 'cd@retailexpress.cl',
    telefono: '+56 9 5555 6666',
    centroAsociado: 'Santiago (Pudahuel)'
  }
];

export const CAMIONES: Camion[] = [
  {
    id: 1,
    codigo: 'CAM-01',
    patente: 'ABCD-12',
    marca: 'Volvo',
    modelo: 'FH 500',
    anio: 2023,
    tipo: 'Rampla plana',
    pesoMaxKg: 25000,
    volumenMaxM3: 90,
    rendimientoBaseKmL: 2.8,
    kilometrajeActual: 142500,
    estado: 'Disponible',
    activo: true,
    documentos: [
      { id: 1, tipo: 'RT', nombre: 'Revisión Técnica', fechaEmision: '2026-01-01', fechaVencimiento: '2027-01-01', vencido: false },
      { id: 2, tipo: 'PC', nombre: 'Permiso de Circulación', fechaEmision: '2026-03-01', fechaVencimiento: '2027-03-31', vencido: false },
      { id: 3, tipo: 'SOAP', nombre: 'Seguro Obligatorio (SOAP)', fechaEmision: '2026-03-01', fechaVencimiento: '2027-03-31', vencido: false },
    ]
  },
  {
    id: 2,
    codigo: 'CAM-02',
    patente: 'EFGH-34',
    marca: 'Scania',
    modelo: 'R450',
    anio: 2022,
    tipo: 'Semirremolque',
    pesoMaxKg: 28000,
    volumenMaxM3: 110,
    rendimientoBaseKmL: 2.4,
    kilometrajeActual: 210300,
    estado: 'Bloqueado',
    activo: true,
    motivoBloqueo: 'Revisión Técnica vencida (01/06/2025). Asignación bloqueada según RN-05 / RF-103.',
    documentos: [
      { id: 4, tipo: 'RT', nombre: 'Revisión Técnica', fechaEmision: '2024-06-01', fechaVencimiento: '2025-06-01', vencido: true },
      { id: 5, tipo: 'PC', nombre: 'Permiso de Circulación', fechaEmision: '2026-03-01', fechaVencimiento: '2027-03-31', vencido: false },
      { id: 6, tipo: 'SOAP', nombre: 'Seguro Obligatorio (SOAP)', fechaEmision: '2026-03-01', fechaVencimiento: '2027-03-31', vencido: false },
    ]
  },
  {
    id: 3,
    codigo: 'CAM-03',
    patente: 'IJKL-56',
    marca: 'Mercedes-Benz',
    modelo: 'Atego 1018',
    anio: 2021,
    tipo: '3/4',
    pesoMaxKg: 4000,
    volumenMaxM3: 20,
    rendimientoBaseKmL: 6.2,
    kilometrajeActual: 89100,
    estado: 'Disponible',
    activo: true,
    documentos: [
      { id: 7, tipo: 'RT', nombre: 'Revisión Técnica', fechaEmision: '2026-01-01', fechaVencimiento: '2027-01-01', vencido: false },
      { id: 8, tipo: 'PC', nombre: 'Permiso de Circulación', fechaEmision: '2026-03-01', fechaVencimiento: '2027-03-31', vencido: false },
      { id: 9, tipo: 'SOAP', nombre: 'Seguro Obligatorio (SOAP)', fechaEmision: '2026-03-01', fechaVencimiento: '2027-03-31', vencido: false },
    ]
  }
];

export const CONDUCTORES: Conductor[] = [
  {
    id: 1,
    rut: '15.111.222-3',
    nombres: 'Juan',
    apellidos: 'Pérez Gallardo',
    telefono: '+56 9 8888 7777',
    email: 'jperez@tnc.cl',
    claseLicencia: 'A5',
    fechaEmisionLicencia: '2024-01-15',
    fechaVencimientoLicencia: '2028-01-15',
    licenciaVencida: false,
    tiposHabilitados: ['Semirremolque', 'Rampla plana', '3/4'],
    estado: 'Disponible'
  },
  {
    id: 2,
    rut: '16.333.444-5',
    nombres: 'Carlos',
    apellidos: 'Gómez Valenzuela',
    telefono: '+56 9 9999 8888',
    email: 'cgomez@tnc.cl',
    claseLicencia: 'A4',
    fechaEmisionLicencia: '2021-05-10',
    fechaVencimientoLicencia: '2023-05-10',
    licenciaVencida: true,
    tiposHabilitados: ['Semirremolque', 'Rampla plana'],
    estado: 'Bloqueado',
    motivoBloqueo: 'Licencia A4 vencida el 10/05/2023. Asignación bloqueada según RF-203.'
  },
  {
    id: 3,
    rut: '17.555.666-7',
    nombres: 'Luis',
    apellidos: 'Silva Tapia',
    telefono: '+56 9 7777 6666',
    email: 'lsilva@tnc.cl',
    claseLicencia: 'B',
    fechaEmisionLicencia: '2023-08-20',
    fechaVencimientoLicencia: '2027-08-20',
    licenciaVencida: false,
    tiposHabilitados: ['3/4'],
    estado: 'Disponible',
    motivoBloqueo: 'Licencia Clase B sólo autoriza vehículos livianos / 3/4. No apto para articulados (RN-04).'
  }
];

export const PEDIDOS: Pedido[] = [
  {
    id: 1,
    codigo: 'PED-101',
    clienteId: 3,
    clienteNombre: 'Retail Express',
    pesoKg: 15000,
    volumenM3: 50,
    ventanaInicio: '2026-09-20 08:00',
    ventanaFin: '2026-09-20 18:00',
    tipoMercaderia: 'GENERAL',
    estado: 'EN_ESPERA',
    destino: 'Santiago (Pudahuel)'
  },
  {
    id: 2,
    codigo: 'PED-102',
    clienteId: 2,
    clienteNombre: 'Minería San José',
    pesoKg: 25000,
    volumenM3: 15,
    ventanaInicio: '2026-09-21 08:00',
    ventanaFin: '2026-09-22 18:00',
    tipoMercaderia: 'GENERAL',
    estado: 'EN_ESPERA',
    destino: 'Antofagasta (La Negra)'
  },
  {
    id: 3,
    codigo: 'PED-103',
    clienteId: 2,
    clienteNombre: 'Minería San José',
    pesoKg: 10000,
    volumenM3: 30,
    ventanaInicio: '2026-09-23 08:00',
    ventanaFin: '2026-09-24 18:00',
    tipoMercaderia: 'PELIGROSA',
    estado: 'EN_ESPERA',
    destino: 'Antofagasta (La Negra)'
  },
  {
    id: 4,
    codigo: 'PED-104',
    clienteId: 1,
    clienteNombre: 'AgroNorte S.A.',
    pesoKg: 8000,
    volumenM3: 20,
    ventanaInicio: '2026-09-23 08:00',
    ventanaFin: '2026-09-24 18:00',
    tipoMercaderia: 'REFRIGERADA',
    estado: 'EN_ESPERA',
    destino: 'Antofagasta (La Negra)'
  }
];

export const CARGAS: Carga[] = [
  {
    id: 1,
    codigo: 'CRG-01',
    centroDestino: 'Santiago (Pudahuel)',
    estado: 'CREADO',
    pedidos: [PEDIDOS[0]],
    pesoTotalKg: 15000,
    volumenTotalM3: 50,
  },
  {
    id: 2,
    codigo: 'CRG-02',
    centroDestino: 'Antofagasta (La Negra)',
    estado: 'CREADO',
    pedidos: [PEDIDOS[1]],
    pesoTotalKg: 25000,
    volumenTotalM3: 15,
    alertaEspecial: {
      tipo: 'warning',
      titulo: 'Carga Pesada (25.000 kg)',
      mensaje: 'Excede la capacidad del camión 3/4 (4.000 kg). Requiere asignación de Rampla Plana o Semirremolque.'
    }
  },
  {
    id: 3,
    codigo: 'CRG-03',
    centroDestino: 'Antofagasta (La Negra)',
    estado: 'CANCELADA',
    pedidos: [PEDIDOS[2], PEDIDOS[3]],
    pesoTotalKg: 18000,
    volumenTotalM3: 50,
    alertaEspecial: {
      tipo: 'error',
      titulo: 'Incompatibilidad de Carga (Regla RN-07)',
      mensaje: 'No está permitido mezclar sustancias Peligrosas (PED-103) con productos Refrigerados / Alimentos (PED-104) en un mismo camión.'
    }
  }
];

export const PARAMETROS_SISTEMA = {
  precioDieselLitro: 1050,
  viaticoDia: 35000,
  costoKmDesgaste: 180,
  descansoMinimoHoras: 12,
  baseOperaciones: 'Coquimbo (Patio Principal)',
};

/**
 * Validador de Documentos según HU 1.2 y Regla RN-05:
 * Ningún camión con Revisión Técnica (RT), Permiso de Circulación (PC) o SOAP vencido
 * puede ser asignado a un viaje.
 */
export function validarDocumentosCamion(camion: Camion, fechaReferencia: string = '2026-09-22') {
  const docsObligatorios = ['RT', 'PC', 'SOAP'];
  const refDate = new Date(fechaReferencia);

  const docsVencidos = camion.documentos.filter((doc) => {
    if (!docsObligatorios.includes(doc.tipo)) return false;
    const expDate = new Date(doc.fechaVencimiento);
    return expDate < refDate || doc.vencido;
  });

  if (docsVencidos.length > 0) {
    const detalleDocs = docsVencidos
      .map((d) => `${d.nombre} (${d.tipo}) vencida el ${d.fechaVencimiento}`)
      .join(', ');
    return {
      habilitado: false,
      motivo: `Camión excluido por RN-05: ${detalleDocs}`,
      docsVencidos
    };
  }

  return {
    habilitado: true,
    motivo: undefined,
    docsVencidos: []
  };
}

// Store reactivo para sincronizar camiones en toda la aplicación
let currentCamiones: Camion[] = [...CAMIONES];
const listeners = new Set<(camiones: Camion[]) => void>();

export function getCamiones(): Camion[] {
  return currentCamiones;
}

export function updateCamiones(updater: (prev: Camion[]) => Camion[]) {
  currentCamiones = updater(currentCamiones);
  listeners.forEach((l) => l([...currentCamiones]));
}

export function subscribeCamiones(listener: (camiones: Camion[]) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useCamionesState() {
  const [camiones, setCamiones] = useState<Camion[]>(currentCamiones);

  useEffect(() => {
    return subscribeCamiones(setCamiones);
  }, []);

  return [camiones, updateCamiones] as const;
}

/**
 * Renueva o registra un documento para un camión.
 * Si todos los documentos obligatorios quedan vigentes,
 * desbloquea automáticamente el camión (HU 1.2 / RN-05).
 */
export function renovarDocumentoCamion(
  camionId: number,
  tipoDoc: 'RT' | 'PC' | 'SOAP' | 'PADRON' | 'CEC',
  fechaEmision: string,
  fechaVencimiento: string
): { exito: boolean; mensaje: string; nuevoEstado: string } {
  const refDate = new Date('2026-09-22');
  const isVencido = new Date(fechaVencimiento) < refDate;

  let truckPatente = '';
  let finalEstado = 'Disponible';

  updateCamiones((prev) =>
    prev.map((c) => {
      if (c.id !== camionId) return c;
      truckPatente = c.patente;

      let docFound = false;
      const updatedDocs = c.documentos.map((d) => {
        if (d.tipo === tipoDoc) {
          docFound = true;
          return {
            ...d,
            fechaEmision,
            fechaVencimiento,
            vencido: isVencido
          };
        }
        return d;
      });

      if (!docFound) {
        const nombresMap: Record<string, string> = {
          RT: 'Revisión Técnica',
          PC: 'Permiso de Circulación',
          SOAP: 'Seguro Obligatorio (SOAP)',
          PADRON: 'Padrón del Vehículo',
          CEC: 'Certificado Emisión Contaminantes'
        };
        updatedDocs.push({
          id: Date.now(),
          tipo: tipoDoc,
          nombre: nombresMap[tipoDoc] || tipoDoc,
          fechaEmision,
          fechaVencimiento,
          vencido: isVencido
        });
      }

      // Revalidación según HU 1.2
      const val = validarDocumentosCamion({ ...c, documentos: updatedDocs });
      const nuevoEstado = !val.habilitado
        ? 'Bloqueado'
        : c.estado === 'Bloqueado'
          ? 'Disponible'
          : c.estado;

      finalEstado = nuevoEstado;

      return {
        ...c,
        documentos: updatedDocs,
        estado: nuevoEstado,
        motivoBloqueo: val.motivo
      };
    })
  );

  return {
    exito: true,
    mensaje: `Documento ${tipoDoc} actualizado para camión ${truckPatente}. Estado actual: ${finalEstado}.`,
    nuevoEstado: finalEstado
  };
}

export interface ViajeHistorial {
  id: number;
  codigoViaje: string;
  camionId: number;
  camionPatente: string;
  conductorId: number;
  conductorNombre: string;
  origen: string;
  destino: string;
  distanciaKm: number;
  cargaCodigo: string;
  pesoKg: number;
  volumenM3?: number;
  fechaSalida: string;
  fechaLlegada: string;
  estado: 'COMPLETADO' | 'EN_RUTA' | 'PROGRAMADO' | 'CANCELADO';
  consumoRealLitros?: number;
}

export const HISTORIAL_VIAJES_INICIAL: ViajeHistorial[] = [
  {
    id: 1,
    codigoViaje: 'VIAJE-2026-088',
    camionId: 1,
    camionPatente: 'ABCD-12',
    conductorId: 1,
    conductorNombre: 'Juan Pérez Gallardo',
    origen: 'Coquimbo (Base Principal)',
    destino: 'Santiago (Pudahuel)',
    distanciaKm: 460.5,
    cargaCodigo: 'CRG-01',
    pesoKg: 15000,
    volumenM3: 50,
    fechaSalida: '2026-09-10 07:30',
    fechaLlegada: '2026-09-10 13:45',
    estado: 'COMPLETADO',
    consumoRealLitros: 164.5
  },
  {
    id: 2,
    codigoViaje: 'VIAJE-2026-092',
    camionId: 1,
    camionPatente: 'ABCD-12',
    conductorId: 1,
    conductorNombre: 'Juan Pérez Gallardo',
    origen: 'Coquimbo (Base Principal)',
    destino: 'Antofagasta (La Negra)',
    distanciaKm: 890.0,
    cargaCodigo: 'CRG-04',
    pesoKg: 22000,
    volumenM3: 75,
    fechaSalida: '2026-09-15 06:00',
    fechaLlegada: '2026-09-15 19:30',
    estado: 'COMPLETADO',
    consumoRealLitros: 317.8
  },
  {
    id: 3,
    codigoViaje: 'VIAJE-2026-085',
    camionId: 2,
    camionPatente: 'EFGH-34',
    conductorId: 2,
    conductorNombre: 'Carlos Gómez Valenzuela',
    origen: 'Coquimbo (Base Principal)',
    destino: 'Antofagasta (La Negra)',
    distanciaKm: 890.0,
    cargaCodigo: 'CRG-02',
    pesoKg: 25000,
    volumenM3: 85,
    fechaSalida: '2026-08-28 05:30',
    fechaLlegada: '2026-08-28 19:00',
    estado: 'COMPLETADO',
    consumoRealLitros: 370.8
  },
  {
    id: 4,
    codigoViaje: 'VIAJE-2026-090',
    camionId: 2,
    camionPatente: 'EFGH-34',
    conductorId: 2,
    conductorNombre: 'Carlos Gómez Valenzuela',
    origen: 'Coquimbo (Base Principal)',
    destino: 'Santiago (Pudahuel)',
    distanciaKm: 460.5,
    cargaCodigo: 'CRG-06',
    pesoKg: 20000,
    volumenM3: 65,
    fechaSalida: '2026-09-12 08:00',
    fechaLlegada: '2026-09-12 14:30',
    estado: 'COMPLETADO',
    consumoRealLitros: 191.9
  },
  {
    id: 5,
    codigoViaje: 'VIAJE-2026-091',
    camionId: 3,
    camionPatente: 'IJKL-56',
    conductorId: 3,
    conductorNombre: 'Luis Silva Tapia',
    origen: 'Coquimbo (Base Principal)',
    destino: 'Vicuña (Valle del Elqui)',
    distanciaKm: 85.0,
    cargaCodigo: 'CRG-05',
    pesoKg: 3200,
    volumenM3: 14,
    fechaSalida: '2026-09-14 09:00',
    fechaLlegada: '2026-09-14 11:30',
    estado: 'COMPLETADO',
    consumoRealLitros: 13.7
  },
  {
    id: 6,
    codigoViaje: 'VIAJE-2026-095',
    camionId: 3,
    camionPatente: 'IJKL-56',
    conductorId: 3,
    conductorNombre: 'Luis Silva Tapia',
    origen: 'Coquimbo (Base Principal)',
    destino: 'La Serena Industrial',
    distanciaKm: 35.0,
    cargaCodigo: 'CRG-07',
    pesoKg: 2800,
    volumenM3: 12,
    fechaSalida: '2026-09-18 10:00',
    fechaLlegada: '2026-09-18 11:15',
    estado: 'COMPLETADO',
    consumoRealLitros: 5.6
  }
];

let currentViajes: ViajeHistorial[] = [...HISTORIAL_VIAJES_INICIAL];
const viajesListeners = new Set<(viajes: ViajeHistorial[]) => void>();

export function getViajesHistorial(): ViajeHistorial[] {
  return currentViajes;
}

export function updateViajesHistorial(updater: (prev: ViajeHistorial[]) => ViajeHistorial[]) {
  currentViajes = updater(currentViajes);
  viajesListeners.forEach((l) => l([...currentViajes]));
}

export function subscribeViajesHistorial(listener: (viajes: ViajeHistorial[]) => void) {
  viajesListeners.add(listener);
  return () => {
    viajesListeners.delete(listener);
  };
}

export function useViajesHistorialState() {
  const [viajes, setViajes] = useState<ViajeHistorial[]>(currentViajes);

  useEffect(() => {
    return subscribeViajesHistorial(setViajes);
  }, []);

  return [viajes, updateViajesHistorial] as const;
}

export function getHistorialViajesCamion(camionId: number, patente?: string): ViajeHistorial[] {
  return currentViajes.filter(
    (v) => v.camionId === camionId || (patente && v.camionPatente.toUpperCase() === patente.toUpperCase())
  );
}

export function registrarNuevoViaje(nuevoViaje: Omit<ViajeHistorial, 'id'>) {
  const viajeConId: ViajeHistorial = {
    ...nuevoViaje,
    id: Date.now()
  };
  updateViajesHistorial((prev) => [viajeConId, ...prev]);
  return viajeConId;
}

