import { graphqlRequest } from './graphql.client';

export interface ViajeDashboard {
  id: number;
  patente: string;
  conductor: string;
  destino: string;
  fechaInicio: string;
}

export interface PedidoPendienteDashboard {
  id: number;
  pesoKg: string;
  ventanaFin: string;
}

export interface DocumentoAlertaDashboard {
  id: number;
  patente: string;
  tipo: string;
  fechaVencimiento: string;
  diasRestantes: number;
}

export interface DashboardData {
  actualizadoEn: string;
  viajesEnCurso: ViajeDashboard[];
  pedidosSinPlanificar: PedidoPendienteDashboard[];
  capacidadFlotaKg: string;
  pesoEnRutaKg: string;
  ocupacionFlotaPct: string;
  camionesActivos: number;
  camionesEnRuta: number;
  documentosPorVencer: DocumentoAlertaDashboard[];
}

const DASHBOARD_QUERY = `query Dashboard { dashboard { actualizadoEn viajesEnCurso { id patente conductor destino fechaInicio } pedidosSinPlanificar { id pesoKg ventanaFin } capacidadFlotaKg pesoEnRutaKg ocupacionFlotaPct camionesActivos camionesEnRuta documentosPorVencer { id patente tipo fechaVencimiento diasRestantes } } }`;

export async function getDashboard(signal?: AbortSignal): Promise<DashboardData> {
  const result = await graphqlRequest<{ dashboard: DashboardData }>(DASHBOARD_QUERY, undefined, signal);
  return result.dashboard;
}