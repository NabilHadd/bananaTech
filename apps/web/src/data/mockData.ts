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
  tipo: '3/4' | 'Semirremolque' | 'Rampla plana';
  pesoMaxKg: number;
  volumenMaxM3: number;
  rendimientoKmLEstimado: number;
  kilometraje: number;
  estado: 'Disponible' | 'En ruta' | 'Bloqueado' | 'En mantención';
  motivoBloqueo?: string;
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
    tipo: 'Rampla plana',
    pesoMaxKg: 25000,
    volumenMaxM3: 90,
    rendimientoKmLEstimado: 2.8,
    kilometraje: 142500,
    estado: 'Disponible',
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
    tipo: 'Semirremolque',
    pesoMaxKg: 28000,
    volumenMaxM3: 110,
    rendimientoKmLEstimado: 2.4,
    kilometraje: 210300,
    estado: 'Bloqueado',
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
    tipo: '3/4',
    pesoMaxKg: 4000,
    volumenMaxM3: 20,
    rendimientoKmLEstimado: 6.2,
    kilometraje: 89100,
    estado: 'Disponible',
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
