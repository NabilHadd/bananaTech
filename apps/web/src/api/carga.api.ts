/**
 * Cargas (Épica 4: HU4.1, HU4.2 y HU4.3): queries y mutations contra la API GraphQL.
 */
import { graphqlRequest } from './graphql.client';
import { getPedidos, PEDIDO_CAMPOS } from './pedido.api';
import { FILTROS_PEDIDOS_VACIOS } from '../components/features/pedidos/pedidos.constants';
import type { Carga, CargaEstado, OcupacionCarga } from '../components/features/cargas/types';
import type { Pedido } from '../components/features/pedidos/types';

const CARGA_CAMPOS = /* GraphQL */ `
  fragment CargaCampos on Carga {
    id
    idCentro
    estado
    pesoTotalKg
    volumenTotalM3
    incompatibilidad
    centro {
      id
      direccion
      distanciaKm
      distanciaMin
    }
    pedidos {
      ...PedidoCampos
    }
  }
  ${PEDIDO_CAMPOS}
`;

const CARGAS_QUERY = /* GraphQL */ `
  query Cargas($estado: CargaEstado) {
    cargas(estado: $estado) {
      ...CargaCampos
    }
  }
  ${CARGA_CAMPOS}
`;

const OCUPACION_QUERY = /* GraphQL */ `
  query OcupacionCarga($idCarga: Int!, $idCamion: Int!) {
    ocupacionCarga(idCarga: $idCarga, idCamion: $idCamion) {
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
`;

const CREAR_CARGA_MUTATION = /* GraphQL */ `
  mutation CrearCarga($idPedidos: [Int!]!) {
    crearCarga(idPedidos: $idPedidos) {
      ...CargaCampos
    }
  }
  ${CARGA_CAMPOS}
`;

const AGREGAR_PEDIDOS_MUTATION = /* GraphQL */ `
  mutation AgregarPedidosACarga($idCarga: Int!, $idPedidos: [Int!]!) {
    agregarPedidosACarga(idCarga: $idCarga, idPedidos: $idPedidos) {
      ...CargaCampos
    }
  }
  ${CARGA_CAMPOS}
`;

const QUITAR_PEDIDO_MUTATION = /* GraphQL */ `
  mutation QuitarPedidoDeCarga($idCarga: Int!, $idPedido: Int!) {
    quitarPedidoDeCarga(idCarga: $idCarga, idPedido: $idPedido) {
      ...CargaCampos
    }
  }
  ${CARGA_CAMPOS}
`;

const CONFIRMAR_CARGA_MUTATION = /* GraphQL */ `
  mutation ConfirmarCarga($id: Int!) {
    confirmarCarga(id: $id) {
      ...CargaCampos
    }
  }
  ${CARGA_CAMPOS}
`;

const CANCELAR_CARGA_MUTATION = /* GraphQL */ `
  mutation CancelarCarga($id: Int!) {
    cancelarCarga(id: $id) {
      ...CargaCampos
    }
  }
  ${CARGA_CAMPOS}
`;

export async function getCargas(estado: CargaEstado | '', signal?: AbortSignal): Promise<Carga[]> {
  const data = await graphqlRequest<{ cargas: Carga[] }>(
    CARGAS_QUERY,
    { estado: estado || null },
    signal,
  );
  return data.cargas;
}

/** Pedidos que pueden entrar a una carga: Creada y sin otra carga activa. */
export async function getPedidosLibres(signal?: AbortSignal): Promise<Pedido[]> {
  const pedidos = await getPedidos({ ...FILTROS_PEDIDOS_VACIOS, estado: 'CREADA' }, signal);
  return pedidos.filter((p) => p.idCargaActiva === null);
}

export async function getOcupacionCarga(
  idCarga: number,
  idCamion: number,
  signal?: AbortSignal,
): Promise<OcupacionCarga> {
  const data = await graphqlRequest<{ ocupacionCarga: OcupacionCarga }>(
    OCUPACION_QUERY,
    { idCarga, idCamion },
    signal,
  );
  return data.ocupacionCarga;
}

export async function crearCarga(idPedidos: number[]): Promise<Carga> {
  const data = await graphqlRequest<{ crearCarga: Carga }>(CREAR_CARGA_MUTATION, { idPedidos });
  return data.crearCarga;
}

export async function agregarPedidosACarga(idCarga: number, idPedidos: number[]): Promise<Carga> {
  const data = await graphqlRequest<{ agregarPedidosACarga: Carga }>(
    AGREGAR_PEDIDOS_MUTATION,
    { idCarga, idPedidos },
  );
  return data.agregarPedidosACarga;
}

export async function quitarPedidoDeCarga(idCarga: number, idPedido: number): Promise<Carga> {
  const data = await graphqlRequest<{ quitarPedidoDeCarga: Carga }>(
    QUITAR_PEDIDO_MUTATION,
    { idCarga, idPedido },
  );
  return data.quitarPedidoDeCarga;
}

export async function confirmarCarga(id: number): Promise<Carga> {
  const data = await graphqlRequest<{ confirmarCarga: Carga }>(CONFIRMAR_CARGA_MUTATION, { id });
  return data.confirmarCarga;
}

export async function cancelarCarga(id: number): Promise<Carga> {
  const data = await graphqlRequest<{ cancelarCarga: Carga }>(CANCELAR_CARGA_MUTATION, { id });
  return data.cancelarCarga;
}
