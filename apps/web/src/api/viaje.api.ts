/**
 * Viajes (Épica 5: HU5.1): queries y mutations contra la API GraphQL.
 */
import { graphqlRequest } from './graphql.client';
import { CAMION_CAMPOS } from './camion.api';
import { CARGA_CAMPOS } from './carga.api';
import { CONDUCTOR_CAMPOS } from './conductor.api';
import type { Camion, ViajeEstado } from '../components/features/flota/types';
import type { Conductor } from '../components/features/conductores/types';
import type { LlegadaInput, PropuestaViaje, Viaje, ViajeInput } from '../components/features/viajes/types';

const VIAJE_CAMPOS = /* GraphQL */ `
  fragment ViajeCampos on Viaje {
    id
    idConductor
    idCamion
    idCarga
    estado
    origen
    fechaInicio
    fechaFin
    fechaLlegada
    receptor
    observacion
    fechaCancelacion
    conductor {
      ...ConductorCampos
    }
    camion {
      ...CamionCampos
    }
    carga {
      ...CargaCampos
    }
  }
  ${CONDUCTOR_CAMPOS}
  ${CAMION_CAMPOS}
  ${CARGA_CAMPOS}
`;

const VIAJES_QUERY = /* GraphQL */ `
  query Viajes($filtros: ViajeFiltros) {
    viajes(filtros: $filtros) {
      ...ViajeCampos
    }
  }
  ${VIAJE_CAMPOS}
`;

const CAMIONES_PARA_VIAJE_QUERY = /* GraphQL */ `
  query CamionesParaViaje($idCarga: Int!, $idConductor: Int) {
    camionesParaViaje(idCarga: $idCarga, idConductor: $idConductor) {
      ...CamionCampos
    }
  }
  ${CAMION_CAMPOS}
`;

const CONDUCTORES_PARA_VIAJE_QUERY = /* GraphQL */ `
  query ConductoresParaViaje($idCarga: Int!, $idCamion: Int) {
    conductoresParaViaje(idCarga: $idCarga, idCamion: $idCamion) {
      ...ConductorCampos
    }
  }
  ${CONDUCTOR_CAMPOS}
`;

const PROPONER_VIAJE_QUERY = /* GraphQL */ `
  query ProponerViaje($idCarga: Int!) {
    proponerViaje(idCarga: $idCarga) {
      fechaInicio
      fechaFin
      carga {
        ...CargaCampos
      }
      camion {
        ...CamionCampos
      }
      conductor {
        ...ConductorCampos
      }
      ocupacion {
        idCamion
        patente
        pesoTotalKg
        volumenTotalM3
        capacidadPesoKg
        capacidadVolumenM3
        porcentajePeso
        porcentajeVolumen
        factorLimitante
        excede
      }
    }
  }
  ${CARGA_CAMPOS}
  ${CAMION_CAMPOS}
  ${CONDUCTOR_CAMPOS}
`;

const AGREGAR_VIAJE_MUTATION = /* GraphQL */ `
  mutation AgregarViaje($input: ViajeInput!) {
    agregarViaje(input: $input) {
      ...ViajeCampos
    }
  }
  ${VIAJE_CAMPOS}
`;

const FINALIZAR_VIAJE_MUTATION = /* GraphQL */ `
  mutation FinalizarViaje($id: Int!, $input: LlegadaInput!) {
    finalizarViaje(id: $id, input: $input) {
      ...ViajeCampos
    }
  }
  ${VIAJE_CAMPOS}
`;

const CANCELAR_VIAJE_MUTATION = /* GraphQL */ `
  mutation CancelarViaje($id: Int!) {
    cancelarViaje(id: $id) {
      ...ViajeCampos
    }
  }
  ${VIAJE_CAMPOS}
`;

// --- Queries ---

export async function getViajes(estado: ViajeEstado | '', signal?: AbortSignal): Promise<Viaje[]> {
  const data = await graphqlRequest<{ viajes: Viaje[] }>(
    VIAJES_QUERY,
    { filtros: { estado: estado || null } },
    signal,
  );
  return data.viajes;
}

/** Camiones que pueden llevar la carga; con `idConductor`, sólo los que su licencia habilita. */
export async function getCamionesParaViaje(
  idCarga: number,
  idConductor: number | null,
  signal?: AbortSignal,
): Promise<Camion[]> {
  const data = await graphqlRequest<{ camionesParaViaje: Camion[] }>(
    CAMIONES_PARA_VIAJE_QUERY,
    { idCarga, idConductor },
    signal,
  );
  return data.camionesParaViaje;
}

/** Conductores que pueden hacer el viaje; con `idCamion`, sólo los habilitados para ese camión. */
export async function getConductoresParaViaje(
  idCarga: number,
  idCamion: number | null,
  signal?: AbortSignal,
): Promise<Conductor[]> {
  const data = await graphqlRequest<{ conductoresParaViaje: Conductor[] }>(
    CONDUCTORES_PARA_VIAJE_QUERY,
    { idCarga, idCamion },
    signal,
  );
  return data.conductoresParaViaje;
}

/** Motor de asignación (HU5.1). Si no hay combinación posible, el error explica la causa. */
export async function proponerViaje(idCarga: number, signal?: AbortSignal): Promise<PropuestaViaje> {
  const data = await graphqlRequest<{ proponerViaje: PropuestaViaje }>(
    PROPONER_VIAJE_QUERY,
    { idCarga },
    signal,
  );
  return data.proponerViaje;
}

// --- Mutations ---

export async function agregarViaje(input: ViajeInput): Promise<Viaje> {
  const data = await graphqlRequest<{ agregarViaje: Viaje }>(AGREGAR_VIAJE_MUTATION, { input });
  return data.agregarViaje;
}

/** Registra la llegada: la carga queda Finalizada y sus pedidos Entregado (HU5.2). */
export async function finalizarViaje(id: number, input: LlegadaInput): Promise<Viaje> {
  const data = await graphqlRequest<{ finalizarViaje: Viaje }>(FINALIZAR_VIAJE_MUTATION, { id, input });
  return data.finalizarViaje;
}

/** Cancela un viaje en ruta: la carga vuelve a Confirmada (HU5.3). */
export async function cancelarViaje(id: number): Promise<Viaje> {
  const data = await graphqlRequest<{ cancelarViaje: Viaje }>(CANCELAR_VIAJE_MUTATION, { id });
  return data.cancelarViaje;
}
