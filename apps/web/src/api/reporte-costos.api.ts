import { graphqlRequest } from './graphql.client';

export interface ViajeCosto {
  id: number;
  fechaInicio: string;
  estado: string;
  ingresosClp: string;
  dieselClp: string;
  peajesClp: string;
  operacionClp: string;
  viaticosClp: string;
  margenClp: string;
}

export interface ReporteCostos {
  anio: number;
  mes: number;
  cantidadViajes: number;
  ingresosClp: string;
  dieselClp: string;
  peajesClp: string;
  operacionClp: string;
  viaticosClp: string;
  costosTotalesClp: string;
  margenClp: string;
  viajes: ViajeCosto[];
}

const REPORTE_QUERY = `query ReporteCostos($anio: Int!, $mes: Int!) { reporteCostos(anio: $anio, mes: $mes) { anio mes cantidadViajes ingresosClp dieselClp peajesClp operacionClp viaticosClp costosTotalesClp margenClp viajes { id fechaInicio estado ingresosClp dieselClp peajesClp operacionClp viaticosClp margenClp } } }`;

export async function getReporteCostos(anio: number, mes: number): Promise<ReporteCostos> {
  return (await graphqlRequest<{ reporteCostos: ReporteCostos }>(REPORTE_QUERY, { anio, mes })).reporteCostos;
}