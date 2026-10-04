import { graphqlRequest } from './graphql.client';

export interface UsuarioAdmin {
  id: number;
  username: string;
  rol: 'ADMINISTRADOR' | 'PLANIFICADOR';
  activo: boolean;
}

const USUARIOS_QUERY = `query Usuarios { usuarios { id username rol activo } }`;

export async function getUsuarios(): Promise<UsuarioAdmin[]> {
  return (await graphqlRequest<{ usuarios: UsuarioAdmin[] }>(USUARIOS_QUERY)).usuarios;
}

export async function crearUsuario(username: string, password: string, rol: UsuarioAdmin['rol']): Promise<UsuarioAdmin> {
  const query = `mutation CrearUsuario($username: String!, $password: String!, $rol: String!) { crearUsuario(username: $username, password: $password, rol: $rol) { id username rol activo } }`;
  return (await graphqlRequest<{ crearUsuario: UsuarioAdmin }>(query, { username, password, rol })).crearUsuario;
}

export async function cambiarEstadoUsuario(id: number, activo: boolean): Promise<UsuarioAdmin> {
  const query = `mutation CambiarEstado($id: Int!, $activo: Boolean!) { cambiarEstadoUsuario(id: $id, activo: $activo) { id username rol activo } }`;
  return (await graphqlRequest<{ cambiarEstadoUsuario: UsuarioAdmin }>(query, { id, activo })).cambiarEstadoUsuario;
}

export async function eliminarUsuario(id: number): Promise<boolean> {
  const query = `mutation EliminarUsuario($id: Int!) { eliminarUsuario(id: $id) }`;
  return (await graphqlRequest<{ eliminarUsuario: boolean }>(query, { id })).eliminarUsuario;
}