import { graphqlRequest } from './graphql';

export type DocumentoTipo = 'RT' | 'PC' | 'SOAP' | 'PADRON' | 'CEC';
export type MantencionTipo = 'PREVENTIVA' | 'CORRECTIVA';
export type MantencionEstado =
  | 'PROGRAMADA'
  | 'EN_CURSO'
  | 'COMPLETADA'
  | 'CANCELADA';
export type LicenciaClase = 'A1' | 'A2' | 'A3' | 'A4' | 'A5' | 'B' | 'C' | 'D' | 'E' | 'F';
export type ViajeEstado = 'EN_RUTA' | 'FINALIZADO' | 'CANCELADO';
export type CamionEstadoOperativo = 'DISPONIBLE' | 'EN_TRANSITO' | 'NO_HABILITADO' | 'INACTIVO';

export interface DocumentoFlota {
  id: number;
  idCamion: number;
  tipo: DocumentoTipo;
  fechaEmision: string;
  fechaVencimiento: string;
  vigente: boolean;
}

export interface MantencionFlota {
  id: number;
  idCamion: number;
  tipo: MantencionTipo;
  descripcion: string;
  fechaInicio: string;
  fechaFin: string | null;
  estado: MantencionEstado;
}

export interface CamionFlota {
  id: number;
  patente: string;
  idTipoCamion: number;
  pesoKg: string;
  volumenM3: string;
  activo: boolean;
  habilitado: boolean;
  estadoOperativo: CamionEstadoOperativo;
  restricciones: string[];
  documentos: DocumentoFlota[];
  mantenciones: MantencionFlota[];
}

export interface TipoCamionFlota {
  id: number;
  tipo: string;
}

export interface LicenciaConductor {
  id: number;
  fechaEmision: string;
  fechaVencimiento: string;
  clases: LicenciaClase[];
  tiposCamionHabilitados: string[];
}

export interface ConductorApi {
  id: number;
  rut: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  email: string;
  licencias: LicenciaConductor[];
  habilitado: boolean;
  enViaje: boolean;
}

export interface ConductorInput {
  rut: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  email: string;
  fechaEmisionLicencia: string;
  fechaVencimientoLicencia: string;
  clases: LicenciaClase[];
}

export interface PerfilConductorInput {
  rut: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  email: string;
}

export interface LicenciaInput {
  fechaEmision: string;
  fechaVencimiento: string;
  clases: LicenciaClase[];
}

export interface ViajeApi {
  id: number;
  idConductor: number;
  nombreConductor: string;
  idCamion: number;
  patenteCamion: string;
  idCarga: number;
  fechaInicio: string;
  fechaFin: string;
  estado: ViajeEstado;
}

export interface CargaParaViaje {
  id: number;
  idCentro: number;
  idCamion: number | null;
  estado: 'CREADO' | 'EN_RUTA' | 'ENTREGADA' | 'CANCELADA';
  pedidos: { id: number; estado: string }[];
}

export interface CargaApi {
  id: number;
  idCentro: number;
  idCamion: number | null;
  estado: 'CREADO' | 'EN_RUTA' | 'ENTREGADA' | 'CANCELADA';
  pedidos: {
    id: number;
    idCliente: number;
    pesoKg: string;
    volumenM3: string;
    tipoMercaderia: string;
    estado: string;
  }[];
}

export interface PedidoApi {
  id: number;
  idCliente: number;
  pesoKg: string;
  volumenM3: string;
  ventanaInicio: string;
  ventanaFin: string;
  tipoMercaderia: string;
  estado: 'EN_ESPERA' | 'TRANSITO' | 'ENTREGADO' | 'CANCELADO';
}

export type MercaderiaTipoApi = 'GENERAL' | 'REFRIGERADA' | 'PELIGROSA' | 'FRAGIL';

export interface PedidoInputApi {
  idCliente: number;
  pesoKg: number;
  volumenM3: number;
  ventanaInicio: string;
  ventanaFin: string;
  tipoMercaderia: MercaderiaTipoApi;
}

export interface ClienteApi {
  id: number;
  razon: string;
}

export interface CentroDistribucionApi {
  id: number;
  direccion: string;
  distanciaKm: string;
  distanciaMin: number;
}

export interface CentroDistribucionInputApi {
  direccion: string;
  distanciaKm: number;
  distanciaMin: number;
}

export interface HistorialEntregadoApi {
  viajesEliminados: number;
  cargasEliminadas: number;
}

export interface CrearViajeInput {
  idConductor: number;
  idCamion: number;
  idCarga: number;
  fechaInicio: string;
  fechaFin: string;
}

export interface CamionInput {
  patente: string;
  idTipoCamion: number;
  pesoKg: number;
  volumenM3: number;
}

export interface DocumentoInput {
  tipo: DocumentoTipo;
  fechaEmision: string;
  fechaVencimiento: string;
}

export interface MantencionInput {
  tipo: MantencionTipo;
  descripcion: string;
  fechaInicio: string;
  fechaFin: string | null;
}

const CAMION_FIELDS = `
  id patente idTipoCamion pesoKg volumenM3 activo habilitado estadoOperativo restricciones
  documentos { id idCamion tipo fechaEmision fechaVencimiento vigente }
  mantenciones { id idCamion tipo descripcion fechaInicio fechaFin estado }
`;

export async function getFleet(): Promise<{
  camiones: CamionFlota[];
  tiposCamion: TipoCamionFlota[];
}> {
  return graphqlRequest(`query Fleet {
    camiones { ${CAMION_FIELDS} }
    tiposCamion { id tipo }
  }`);
}

export async function createTruck(input: CamionInput): Promise<CamionFlota> {
  const result = await graphqlRequest<{ crearCamion: CamionFlota }>(
    `mutation CreateTruck($input: CamionInput!) {
      crearCamion(input: $input) { ${CAMION_FIELDS} }
    }`,
    { input },
  );
  return result.crearCamion;
}

export async function updateTruck(
  id: number,
  input: CamionInput,
): Promise<CamionFlota> {
  const result = await graphqlRequest<{ actualizarCamion: CamionFlota }>(
    `mutation UpdateTruck($id: Int!, $input: CamionInput!) {
      actualizarCamion(id: $id, input: $input) { ${CAMION_FIELDS} }
    }`,
    { id, input },
  );
  return result.actualizarCamion;
}

export async function setTruckActive(
  id: number,
  activo: boolean,
): Promise<CamionFlota> {
  const result = await graphqlRequest<{ cambiarEstadoCamion: CamionFlota }>(
    `mutation SetTruckActive($id: Int!, $activo: Boolean!) {
      cambiarEstadoCamion(id: $id, activo: $activo) { ${CAMION_FIELDS} }
    }`,
    { id, activo },
  );
  return result.cambiarEstadoCamion;
}

export async function deleteTruck(id: number): Promise<boolean> {
  const result = await graphqlRequest<{ eliminarCamion: boolean }>(
    `mutation DeleteTruck($id: Int!) { eliminarCamion(id: $id) }`,
    { id },
  );
  return result.eliminarCamion;
}

const CONDUCTOR_FIELDS = `
  id rut nombres apellidos telefono email habilitado enViaje
  licencias { id fechaEmision fechaVencimiento clases tiposCamionHabilitados }
`;

export async function getDrivers(): Promise<ConductorApi[]> {
  const result = await graphqlRequest<{ conductores: ConductorApi[] }>(
    `query Drivers { conductores { ${CONDUCTOR_FIELDS} } }`,
  );
  return result.conductores;
}

export async function createDriver(input: ConductorInput): Promise<ConductorApi> {
  const result = await graphqlRequest<{ crearConductor: ConductorApi }>(
    `mutation CreateDriver($input: ConductorInput!) {
      crearConductor(input: $input) { ${CONDUCTOR_FIELDS} }
    }`,
    { input },
  );
  return result.crearConductor;
}

export async function updateDriver(
  id: number,
  input: PerfilConductorInput,
): Promise<ConductorApi> {
  const result = await graphqlRequest<{ actualizarConductor: ConductorApi }>(
    `mutation UpdateDriver($id: Int!, $input: PerfilConductorInput!) {
      actualizarConductor(id: $id, input: $input) { ${CONDUCTOR_FIELDS} }
    }`,
    { id, input },
  );
  return result.actualizarConductor;
}

export async function updateDriverLicense(
  id: number,
  input: LicenciaInput,
): Promise<ConductorApi> {
  const result = await graphqlRequest<{ actualizarLicencia: ConductorApi }>(
    `mutation UpdateDriverLicense($id: Int!, $input: LicenciaInput!) {
      actualizarLicencia(id: $id, input: $input) { ${CONDUCTOR_FIELDS} }
    }`,
    { id, input },
  );
  return result.actualizarLicencia;
}

export async function deleteDriver(id: number): Promise<boolean> {
  const result = await graphqlRequest<{ eliminarConductor: boolean }>(
    `mutation DeleteDriver($id: Int!) { eliminarConductor(id: $id) }`,
    { id },
  );
  return result.eliminarConductor;
}

export async function getTripPlanning(): Promise<{
  conductores: ConductorApi[];
  camiones: CamionFlota[];
  cargas: CargaParaViaje[];
  viajes: ViajeApi[];
}> {
  return graphqlRequest(`query TripPlanning {
    conductores { ${CONDUCTOR_FIELDS} }
    camiones { ${CAMION_FIELDS} }
    cargas(estado: CREADO) { id idCentro idCamion estado pedidos { id estado } }
    viajes { id idConductor nombreConductor idCamion patenteCamion idCarga fechaInicio fechaFin estado }
  }`);
}

export async function getLoads(): Promise<CargaApi[]> {
  const result = await graphqlRequest<{ cargas: CargaApi[] }>(`query Loads {
    cargas {
      id idCentro idCamion estado
      pedidos { id idCliente pesoKg volumenM3 tipoMercaderia estado }
    }
  }`);
  return result.cargas;
}

export async function getOrders(): Promise<PedidoApi[]> {
  const result = await graphqlRequest<{ pedidos: PedidoApi[] }>(`query Orders {
    pedidos {
      id idCliente pesoKg volumenM3 ventanaInicio ventanaFin tipoMercaderia estado
    }
  }`);
  return result.pedidos;
}

export async function getClients(): Promise<ClienteApi[]> {
  const result = await graphqlRequest<{ clientes: ClienteApi[] }>(`query Clients {
    clientes { id razon }
  }`);
  return result.clientes;
}

export async function createOrder(input: PedidoInputApi): Promise<PedidoApi> {
  const result = await graphqlRequest<{ crearPedido: PedidoApi }>(
    `mutation CreateOrder($input: PedidoInput!) {
      crearPedido(input: $input) {
        id idCliente pesoKg volumenM3 ventanaInicio ventanaFin tipoMercaderia estado
      }
    }`,
    { input },
  );
  return result.crearPedido;
}

export async function updateOrder(
  id: number,
  input: PedidoInputApi,
): Promise<PedidoApi> {
  const result = await graphqlRequest<{ actualizarPedido: PedidoApi }>(
    `mutation UpdateOrder($id: Int!, $input: PedidoInput!) {
      actualizarPedido(id: $id, input: $input) {
        id idCliente pesoKg volumenM3 ventanaInicio ventanaFin tipoMercaderia estado
      }
    }`,
    { id, input },
  );
  return result.actualizarPedido;
}

export async function deleteOrder(id: number): Promise<boolean> {
  const result = await graphqlRequest<{ eliminarPedido: boolean }>(
    `mutation DeleteOrder($id: Int!) { eliminarPedido(id: $id) }`,
    { id },
  );
  return result.eliminarPedido;
}

export async function getDistributionCenters(): Promise<CentroDistribucionApi[]> {
  const result = await graphqlRequest<{
    centrosDistribucion: CentroDistribucionApi[];
  }>(`query DistributionCenters {
    centrosDistribucion { id direccion distanciaKm distanciaMin }
  }`);
  return result.centrosDistribucion;
}

export async function createDistributionCenter(
  input: CentroDistribucionInputApi,
): Promise<CentroDistribucionApi> {
  const result = await graphqlRequest<{
    crearCentroDistribucion: CentroDistribucionApi;
  }>(
    `mutation CreateDistributionCenter($input: CentroDistribucionInput!) {
      crearCentroDistribucion(input: $input) {
        id direccion distanciaKm distanciaMin
      }
    }`,
    { input },
  );
  return result.crearCentroDistribucion;
}

export async function deleteDistributionCenter(id: number): Promise<boolean> {
  const result = await graphqlRequest<{ eliminarCentroDistribucion: boolean }>(
    `mutation DeleteDistributionCenter($id: Int!) {
      eliminarCentroDistribucion(id: $id)
    }`,
    { id },
  );
  return result.eliminarCentroDistribucion;
}

export async function clearDeliveredHistory(): Promise<HistorialEntregadoApi> {
  const result = await graphqlRequest<{
    limpiarHistorialEntregado: HistorialEntregadoApi;
  }>(`mutation ClearDeliveredHistory {
    limpiarHistorialEntregado { viajesEliminados cargasEliminadas }
  }`);
  return result.limpiarHistorialEntregado;
}

export async function consolidateLoads(): Promise<CargaApi[]> {
  const result = await graphqlRequest<{ consolidarCargas: CargaApi[] }>(
    `mutation ConsolidateLoads {
      consolidarCargas {
        id idCentro idCamion estado
        pedidos { id idCliente pesoKg volumenM3 tipoMercaderia estado }
      }
    }`,
  );
  return result.consolidarCargas;
}

export async function createTrip(input: CrearViajeInput): Promise<ViajeApi> {
  const result = await graphqlRequest<{ crearViaje: ViajeApi }>(
    `mutation CreateTrip($input: CrearViajeInput!) {
      crearViaje(input: $input) {
        id idConductor nombreConductor idCamion patenteCamion idCarga fechaInicio fechaFin estado
      }
    }`,
    { input },
  );
  return result.crearViaje;
}

export async function closeTrip(id: number, estado: ViajeEstado): Promise<ViajeApi> {
  const result = await graphqlRequest<{ cerrarViaje: ViajeApi }>(
    `mutation CloseTrip($id: Int!, $estado: ViajeEstado!) {
      cerrarViaje(id: $id, estado: $estado) {
        id idConductor nombreConductor idCamion patenteCamion idCarga fechaInicio fechaFin estado
      }
    }`,
    { id, estado },
  );
  return result.cerrarViaje;
}

export async function registerDocument(
  idCamion: number,
  input: DocumentoInput,
): Promise<DocumentoFlota> {
  const result = await graphqlRequest<{ registrarDocumento: DocumentoFlota }>(
    `mutation RegisterDocument($idCamion: Int!, $input: DocumentoInput!) {
      registrarDocumento(idCamion: $idCamion, input: $input) {
        id idCamion tipo fechaEmision fechaVencimiento vigente
      }
    }`,
    { idCamion, input },
  );
  return result.registrarDocumento;
}

export async function updateDocument(
  id: number,
  input: DocumentoInput,
): Promise<DocumentoFlota> {
  const result = await graphqlRequest<{ actualizarDocumento: DocumentoFlota }>(
    `mutation UpdateDocument($id: Int!, $input: DocumentoInput!) {
      actualizarDocumento(id: $id, input: $input) {
        id idCamion tipo fechaEmision fechaVencimiento vigente
      }
    }`,
    { id, input },
  );
  return result.actualizarDocumento;
}

export async function deleteDocument(id: number): Promise<boolean> {
  const result = await graphqlRequest<{ eliminarDocumento: boolean }>(
    `mutation DeleteDocument($id: Int!) { eliminarDocumento(id: $id) }`,
    { id },
  );
  return result.eliminarDocumento;
}

export async function scheduleMaintenance(
  idCamion: number,
  input: MantencionInput,
): Promise<MantencionFlota> {
  const result = await graphqlRequest<{ programarMantencion: MantencionFlota }>(
    `mutation ScheduleMaintenance($idCamion: Int!, $input: MantencionInput!) {
      programarMantencion(idCamion: $idCamion, input: $input) {
        id idCamion tipo descripcion fechaInicio fechaFin estado
      }
    }`,
    { idCamion, input },
  );
  return result.programarMantencion;
}

export async function setMaintenanceState(
  id: number,
  estado: MantencionEstado,
  fechaFin?: string,
): Promise<MantencionFlota> {
  const result = await graphqlRequest<{
    cambiarEstadoMantencion: MantencionFlota;
  }>(
    `mutation SetMaintenanceState(
      $id: Int!, $estado: MantencionEstado!, $fechaFin: DateTime
    ) {
      cambiarEstadoMantencion(id: $id, estado: $estado, fechaFin: $fechaFin) {
        id idCamion tipo descripcion fechaInicio fechaFin estado
      }
    }`,
    { id, estado, fechaFin },
  );
  return result.cambiarEstadoMantencion;
}
