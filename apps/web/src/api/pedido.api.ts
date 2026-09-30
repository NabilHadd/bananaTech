/**
 * Pedidos (Épica 3: HU3.2 y HU3.3): queries y mutations contra la API GraphQL.
 *
 * El estado no se cambia desde aquí salvo la cancelación: Tránsito y Entregado
 * los aplica el viaje de su carga.
 */
import { graphqlRequest } from './graphql.client';
import type { Pedido, PedidoFiltros, PedidoInput } from '../components/features/pedidos/types';

export const PEDIDO_CAMPOS = /* GraphQL */ `
  fragment PedidoCampos on Pedido {
    id
    idCliente
    idCentro
    pesoKg
    volumenM3
    ventanaInicio
    ventanaFin
    tipoMercaderia
    estado
    idCargaActiva
    cliente {
      id
      razon
      rut
      telefono
      mail
    }
    centro {
      id
      direccion
      distanciaKm
      distanciaMin
    }
  }
`;

const PEDIDOS_QUERY = /* GraphQL */ `
  query Pedidos($filtros: PedidoFiltros) {
    pedidos(filtros: $filtros) {
      ...PedidoCampos
    }
  }
  ${PEDIDO_CAMPOS}
`;

const PEDIDO_QUERY = /* GraphQL */ `
  query Pedido($id: Int!) {
    pedido(id: $id) {
      ...PedidoCampos
    }
  }
  ${PEDIDO_CAMPOS}
`;

const CREAR_PEDIDO_MUTATION = /* GraphQL */ `
  mutation CrearPedido($input: PedidoInput!) {
    crearPedido(input: $input) {
      ...PedidoCampos
    }
  }
  ${PEDIDO_CAMPOS}
`;

const CANCELAR_PEDIDO_MUTATION = /* GraphQL */ `
  mutation CancelarPedido($id: Int!) {
    cancelarPedido(id: $id) {
      ...PedidoCampos
    }
  }
  ${PEDIDO_CAMPOS}
`;

export async function getPedidos(
  filtros?: PedidoFiltros,
  signal?: AbortSignal,
): Promise<Pedido[]> {
  const queryFiltros = filtros
    ? {
        busqueda: filtros.busqueda.trim() || null,
        estado: filtros.estado || null,
        tipoMercaderia: filtros.tipoMercaderia || null,
        idCliente: filtros.idCliente || null,
        fecha: filtros.fecha || null,
      }
    : null;

  const data = await graphqlRequest<{ pedidos: Pedido[] }>(
    PEDIDOS_QUERY,
    { filtros: queryFiltros },
    signal,
  );
  return data.pedidos;
}

export async function getPedido(
  id: number,
  signal?: AbortSignal,
): Promise<Pedido | null> {
  const data = await graphqlRequest<{ pedido: Pedido | null }>(
    PEDIDO_QUERY,
    { id },
    signal,
  );
  return data.pedido;
}

export async function crearPedido(input: PedidoInput): Promise<Pedido> {
  const data = await graphqlRequest<{ crearPedido: Pedido }>(
    CREAR_PEDIDO_MUTATION,
    { input },
  );
  return data.crearPedido;
}

export async function cancelarPedido(id: number): Promise<Pedido> {
  const data = await graphqlRequest<{ cancelarPedido: Pedido }>(
    CANCELAR_PEDIDO_MUTATION,
    { id },
  );
  return data.cancelarPedido;
}
