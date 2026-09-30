/**
 * Clientes (Épica 3: HU3.1): queries y mutations contra la API GraphQL.
 *
 * Las páginas usan estas funciones y no saben nada de GraphQL.
 */
import { graphqlRequest } from './graphql.client';
import type {
  CentroDistribucion,
  Cliente,
  ClienteFiltros,
  ClienteInput,
} from '../components/features/clientes/types';

const CLIENTE_CAMPOS = /* GraphQL */ `
  fragment ClienteCampos on Cliente {
    id
    razon
    rut
    direccion
    mail
    telefono
    centros {
      id
      direccion
      distanciaKm
      distanciaMin
    }
  }
`;

const CLIENTES_QUERY = /* GraphQL */ `
  query Clientes($filtros: ClienteFiltros) {
    clientes(filtros: $filtros) {
      ...ClienteCampos
    }
  }
  ${CLIENTE_CAMPOS}
`;

const CENTROS_QUERY = /* GraphQL */ `
  query CentrosDistribucion($busqueda: String) {
    centrosDistribucion(busqueda: $busqueda) {
      id
      direccion
      distanciaKm
      distanciaMin
    }
  }
`;

const CLIENTE_QUERY = /* GraphQL */ `
  query Cliente($id: Int!) {
    cliente(id: $id) {
      ...ClienteCampos
    }
  }
  ${CLIENTE_CAMPOS}
`;

const REGISTRAR_CLIENTE_MUTATION = /* GraphQL */ `
  mutation RegistrarCliente($input: ClienteInput!) {
    registrarCliente(input: $input) {
      ...ClienteCampos
    }
  }
  ${CLIENTE_CAMPOS}
`;

const EDITAR_CLIENTE_MUTATION = /* GraphQL */ `
  mutation EditarCliente($id: Int!, $input: ClienteInput!) {
    editarCliente(id: $id, input: $input) {
      ...ClienteCampos
    }
  }
  ${CLIENTE_CAMPOS}
`;

// --- Queries ---

export async function getClientes(
  filtros?: ClienteFiltros,
  signal?: AbortSignal,
): Promise<Cliente[]> {
  const data = await graphqlRequest<{ clientes: Cliente[] }>(
    CLIENTES_QUERY,
    { filtros: filtros?.busqueda ? { busqueda: filtros.busqueda } : null },
    signal,
  );
  return data.clientes;
}

export async function getCentrosDistribucion(
  busqueda?: string,
  signal?: AbortSignal,
): Promise<CentroDistribucion[]> {
  const data = await graphqlRequest<{ centrosDistribucion: CentroDistribucion[] }>(
    CENTROS_QUERY,
    { busqueda: busqueda || null },
    signal,
  );
  return data.centrosDistribucion;
}

export async function getCliente(
  id: number,
  signal?: AbortSignal,
): Promise<Cliente | null> {
  const data = await graphqlRequest<{ cliente: Cliente | null }>(
    CLIENTE_QUERY,
    { id },
    signal,
  );
  return data.cliente;
}

// --- Mutations ---

export async function registrarCliente(
  input: ClienteInput,
): Promise<Cliente> {
  const data = await graphqlRequest<{ registrarCliente: Cliente }>(
    REGISTRAR_CLIENTE_MUTATION,
    { input },
  );
  return data.registrarCliente;
}

export async function editarCliente(
  id: number,
  input: ClienteInput,
): Promise<Cliente> {
  const data = await graphqlRequest<{ editarCliente: Cliente }>(
    EDITAR_CLIENTE_MUTATION,
    { id, input },
  );
  return data.editarCliente;
}
