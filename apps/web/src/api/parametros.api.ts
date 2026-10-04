import { graphqlRequest } from './graphql.client';

export interface ParametroNegocio {
  clave: string;
  valor: string;
  unidad: string;
}

export interface AuditoriaParametro {
  id: number;
  clave: string;
  valorAnterior: string;
  valorNuevo: string;
  cambiadoPor: string;
  cambiadoEn: string;
}

const PARAMETROS_QUERY = `query Parametros { parametros { clave valor unidad } }`;
const HISTORIAL_QUERY = `query HistorialParametros { historialParametros { id clave valorAnterior valorNuevo cambiadoPor cambiadoEn } }`;

export async function getParametros(): Promise<ParametroNegocio[]> {
  return (await graphqlRequest<{ parametros: ParametroNegocio[] }>(PARAMETROS_QUERY)).parametros;
}

export async function getHistorialParametros(): Promise<AuditoriaParametro[]> {
  return (await graphqlRequest<{ historialParametros: AuditoriaParametro[] }>(HISTORIAL_QUERY)).historialParametros;
}

export async function actualizarParametro(clave: string, valor: number): Promise<ParametroNegocio> {
  const query = `mutation ActualizarParametro($clave: String!, $valor: Decimal!) { actualizarParametro(clave: $clave, valor: $valor) { clave valor unidad } }`;
  return (await graphqlRequest<{ actualizarParametro: ParametroNegocio }>(query, { clave, valor: String(valor) })).actualizarParametro;
}