/**
 * Conductores (Épica 2): queries y mutations contra la API GraphQL.
 *
 * Las páginas usan estas funciones y no saben nada de GraphQL. Los campos
 * pedidos calcan las interfaces de `components/features/conductores/types.ts`.
 */
import { graphqlRequest } from './graphql.client';
import type {
  ClaseLicencia,
  Conductor,
  ConductorFiltros,
  ConductorInput,
  HistorialConductor,
  LicenciaInput,
  RegistroConductorInput,
  ResumenPersonal,
} from '../components/features/conductores/types';

// Campos de Conductor que piden el panel, la ficha y las mutations.
export const CONDUCTOR_CAMPOS = /* GraphQL */ `
  fragment ConductorCampos on Conductor {
    id
    rut
    nombres
    apellidos
    telefono
    email
    estado
    motivoBloqueo
    licencias {
      id
      clases
      fechaEmision
      fechaVencimiento
      vigente
      tiposCamionHabilitados
    }
  }
`;

const CLASES_LICENCIA_QUERY = /* GraphQL */ `
  query ClasesLicencia {
    clasesLicencia {
      clase
      descripcion
      tiposCamion
    }
  }
`;

const CONDUCTORES_QUERY = /* GraphQL */ `
  query Conductores($filtros: ConductorFiltros) {
    conductores(filtros: $filtros) {
      ...ConductorCampos
    }
  }
  ${CONDUCTOR_CAMPOS}
`;

const CONDUCTOR_QUERY = /* GraphQL */ `
  query Conductor($id: Int!) {
    conductor(id: $id) {
      ...ConductorCampos
    }
  }
  ${CONDUCTOR_CAMPOS}
`;

const RESUMEN_PERSONAL_QUERY = /* GraphQL */ `
  query ResumenPersonal {
    resumenPersonal {
      total
      disponibles
      enViaje
      enDescanso
      bloqueados
      inactivos
    }
  }
`;

const HISTORIAL_CONDUCTOR_QUERY = /* GraphQL */ `
  query HistorialConductor($idConductor: Int!) {
    historialConductor(idConductor: $idConductor) {
      viajes {
        id
        fechaInicio
        fechaFin
        patente
        origen
        destino
        distanciaKm
        pesoKg
        estado
      }
      totalKm
    }
  }
`;

// Las mutations devuelven el conductor ya evaluado (estado y vigencia recalculados).

const REGISTRAR_CONDUCTOR_MUTATION = /* GraphQL */ `
  mutation RegistrarConductor($input: RegistroConductorInput!) {
    registrarConductor(input: $input) {
      ...ConductorCampos
    }
  }
  ${CONDUCTOR_CAMPOS}
`;

const EDITAR_CONDUCTOR_MUTATION = /* GraphQL */ `
  mutation EditarConductor($id: Int!, $input: ConductorInput!) {
    editarConductor(id: $id, input: $input) {
      ...ConductorCampos
    }
  }
  ${CONDUCTOR_CAMPOS}
`;

const DAR_DE_BAJA_CONDUCTOR_MUTATION = /* GraphQL */ `
  mutation DarDeBajaConductor($id: Int!) {
    darDeBajaConductor(id: $id) {
      ...ConductorCampos
    }
  }
  ${CONDUCTOR_CAMPOS}
`;

const REGISTRAR_LICENCIA_MUTATION = /* GraphQL */ `
  mutation RegistrarLicencia($idConductor: Int!, $input: LicenciaInput!) {
    registrarLicencia(idConductor: $idConductor, input: $input) {
      ...ConductorCampos
    }
  }
  ${CONDUCTOR_CAMPOS}
`;

// --- Queries ---

export async function getClasesLicencia(signal?: AbortSignal): Promise<ClaseLicencia[]> {
  const data = await graphqlRequest<{ clasesLicencia: ClaseLicencia[] }>(CLASES_LICENCIA_QUERY, undefined, signal);
  return data.clasesLicencia;
}

export async function getConductores(filtros: ConductorFiltros, signal?: AbortSignal): Promise<Conductor[]> {
  const data = await graphqlRequest<{ conductores: Conductor[] }>(CONDUCTORES_QUERY, { filtros }, signal);
  return data.conductores;
}

export async function getConductor(id: number, signal?: AbortSignal): Promise<Conductor | null> {
  const data = await graphqlRequest<{ conductor: Conductor | null }>(CONDUCTOR_QUERY, { id }, signal);
  return data.conductor;
}

export async function getResumenPersonal(signal?: AbortSignal): Promise<ResumenPersonal> {
  const data = await graphqlRequest<{ resumenPersonal: ResumenPersonal }>(RESUMEN_PERSONAL_QUERY, undefined, signal);
  return data.resumenPersonal;
}

export async function getHistorialConductor(id: number, signal?: AbortSignal): Promise<HistorialConductor> {
  const data = await graphqlRequest<{ historialConductor: HistorialConductor }>(
    HISTORIAL_CONDUCTOR_QUERY,
    { idConductor: id },
    signal,
  );
  return data.historialConductor;
}

// --- Mutations ---

export async function registrarConductor(input: RegistroConductorInput): Promise<Conductor> {
  const data = await graphqlRequest<{ registrarConductor: Conductor }>(REGISTRAR_CONDUCTOR_MUTATION, { input });
  return data.registrarConductor;
}

export async function editarConductor(id: number, input: ConductorInput): Promise<Conductor> {
  const data = await graphqlRequest<{ editarConductor: Conductor }>(EDITAR_CONDUCTOR_MUTATION, { id, input });
  return data.editarConductor;
}

export async function registrarLicencia(idConductor: number, input: LicenciaInput): Promise<Conductor> {
  const data = await graphqlRequest<{ registrarLicencia: Conductor }>(REGISTRAR_LICENCIA_MUTATION, {
    idConductor,
    input,
  });
  return data.registrarLicencia;
}

export async function darDeBajaConductor(id: number): Promise<Conductor> {
  const data = await graphqlRequest<{ darDeBajaConductor: Conductor }>(DAR_DE_BAJA_CONDUCTOR_MUTATION, { id });
  return data.darDeBajaConductor;
}
