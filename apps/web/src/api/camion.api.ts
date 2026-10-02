/**
 * Flota (Épica 1): queries y mutations de camiones contra la API GraphQL.
 *
 * Las páginas usan estas funciones y no saben nada de GraphQL. Los campos
 * pedidos calcan las interfaces de `components/features/flota/types.ts`.
 */
import { graphqlRequest } from './graphql.client';
import type {
  Camion,
  CamionFiltros,
  CamionInput,
  DocumentoInput,
  HistorialCamion,
  RegistroCamionInput,
  TipoCamion,
} from '../components/features/flota/types';

// Campos de Camion que piden el listado, la ficha y las mutations.
export const CAMION_CAMPOS = /* GraphQL */ `
  fragment CamionCampos on Camion {
    id
    patente
    marca
    modelo
    anio
    idTipoCamion
    tipo
    pesoMaxKg
    volumenMaxM3
    rendimientoBaseKmL
    kilometrajeActual
    estado
    motivoBloqueo
    documentos {
      id
      tipo
      fechaEmision
      fechaVencimiento
      vigente
    }
  }
`;

const HISTORIAL_CAMPOS = /* GraphQL */ `
  fragment HistorialCampos on HistorialCamion {
    viajes {
      id
      fechaInicio
      fechaFin
      origen
      destino
      distanciaKm
      conductor
      pesoKg
      ocupacionPct
      estado
    }
    totalKm
    totalKg
  }
`;

const TIPOS_CAMION_QUERY = /* GraphQL */ `
  query TiposCamion {
    tiposCamion {
      id
      nombre
    }
  }
`;

const CAMIONES_QUERY = /* GraphQL */ `
  query Camiones($filtros: CamionFiltros) {
    camiones(filtros: $filtros) {
      ...CamionCampos
    }
  }
  ${CAMION_CAMPOS}
`;

const CAMION_QUERY = /* GraphQL */ `
  query Camion($id: Int!) {
    camion(id: $id) {
      ...CamionCampos
    }
  }
  ${CAMION_CAMPOS}
`;

const HISTORIAL_QUERY = /* GraphQL */ `
  query HistorialCamion($idCamion: Int!) {
    historialCamion(idCamion: $idCamion) {
      ...HistorialCampos
    }
  }
  ${HISTORIAL_CAMPOS}
`;

// Las mutations devuelven el camión ya evaluado (estado y vigencias recalculados).

const REGISTRAR_CAMION_MUTATION = /* GraphQL */ `
  mutation RegistrarCamion($input: RegistroCamionInput!) {
    registrarCamion(input: $input) {
      ...CamionCampos
    }
  }
  ${CAMION_CAMPOS}
`;

const EDITAR_CAMION_MUTATION = /* GraphQL */ `
  mutation EditarCamion($id: Int!, $input: CamionInput!) {
    editarCamion(id: $id, input: $input) {
      ...CamionCampos
    }
  }
  ${CAMION_CAMPOS}
`;

const DAR_DE_BAJA_CAMION_MUTATION = /* GraphQL */ `
  mutation DarDeBajaCamion($id: Int!) {
    darDeBajaCamion(id: $id) {
      ...CamionCampos
    }
  }
  ${CAMION_CAMPOS}
`;

const REGISTRAR_DOCUMENTO_MUTATION = /* GraphQL */ `
  mutation RegistrarDocumento($idCamion: Int!, $input: DocumentoInput!) {
    registrarDocumento(idCamion: $idCamion, input: $input) {
      ...CamionCampos
    }
  }
  ${CAMION_CAMPOS}
`;

// --- Queries ---

export async function getTiposCamion(signal?: AbortSignal): Promise<TipoCamion[]> {
  const data = await graphqlRequest<{ tiposCamion: TipoCamion[] }>(
    TIPOS_CAMION_QUERY,
    undefined,
    signal,
  );
  return data.tiposCamion;
}

export async function getCamiones(
  filtros: CamionFiltros,
  signal?: AbortSignal,
): Promise<Camion[]> {
  const data = await graphqlRequest<{ camiones: Camion[] }>(
    CAMIONES_QUERY,
    { filtros },
    signal,
  );
  return data.camiones;
}

export async function getCamion(
  id: number,
  signal?: AbortSignal,
): Promise<Camion | null> {
  const data = await graphqlRequest<{ camion: Camion | null }>(
    CAMION_QUERY,
    { id },
    signal,
  );
  return data.camion;
}

export async function getHistorialCamion(
  id: number,
  signal?: AbortSignal,
): Promise<HistorialCamion> {
  const data = await graphqlRequest<{ historialCamion: HistorialCamion }>(
    HISTORIAL_QUERY,
    { idCamion: id },
    signal,
  );
  return data.historialCamion;
}

// --- Mutations ---

export async function registrarCamion(input: RegistroCamionInput): Promise<Camion> {
  const data = await graphqlRequest<{ registrarCamion: Camion }>(REGISTRAR_CAMION_MUTATION, { input });
  return data.registrarCamion;
}

export async function editarCamion(id: number, input: CamionInput): Promise<Camion> {
  const data = await graphqlRequest<{ editarCamion: Camion }>(EDITAR_CAMION_MUTATION, { id, input });
  return data.editarCamion;
}

export async function darDeBajaCamion(id: number): Promise<Camion> {
  const data = await graphqlRequest<{ darDeBajaCamion: Camion }>(DAR_DE_BAJA_CAMION_MUTATION, { id });
  return data.darDeBajaCamion;
}

export async function registrarDocumento(idCamion: number, input: DocumentoInput): Promise<Camion> {
  const data = await graphqlRequest<{ registrarDocumento: Camion }>(REGISTRAR_DOCUMENTO_MUTATION, {
    idCamion,
    input,
  });
  return data.registrarDocumento;
}
