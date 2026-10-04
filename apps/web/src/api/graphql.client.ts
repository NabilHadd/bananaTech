import { clearAuthSession, getAuthSession } from './auth';

/**
 * Cliente GraphQL compartido.
 *
 * Cada entidad tendrá su propio `<entidad>.api.ts` en esta carpeta, con sus
 * queries y mutations, y todas ejecutan la petición a través de `graphqlRequest`.
 */

const GRAPHQL_URL: string =
  import.meta.env.VITE_API_URL ?? 'http://localhost:8000/graphql';

interface GraphQLErrorPayload {
  message: string;
}

interface GraphQLResponse<T> {
  data?: T | null;
  errors?: GraphQLErrorPayload[];
}

/**
 * Error al hablar con la API: de red, HTTP o de negocio.
 *
 * Los rechazos de reglas de negocio (p. ej. patente duplicada) llegan en el
 * campo `errors` de GraphQL con HTTP 200; su `message` es el que se muestra.
 */
export class ApiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function graphqlRequest<TData>(
  query: string,
  variables?: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<TData> {
  let response: Response;
  try {
    response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(getAuthSession() ? { Authorization: `Bearer ${getAuthSession()!.token}` } : {}),
      },
      body: JSON.stringify({ query, variables }),
      signal,
    });
  } catch (error) {
    // Una petición cancelada no es un error que haya que mostrar.
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError('No se pudo conectar con la API');
  }

  if (response.status === 401) {
    clearAuthSession();
    window.dispatchEvent(new Event('auth-expired'));
  }

  let body: GraphQLResponse<TData>;
  try {
    body = (await response.json()) as GraphQLResponse<TData>;
  } catch {
    // Un proxy caído o un 502 devuelven HTML, no JSON.
    throw new ApiError(`Respuesta inválida de la API (HTTP ${response.status})`, response.status);
  }

  if (body.errors?.length) {
    throw new ApiError(body.errors.map((e) => e.message).join('; '), response.status);
  }
  if (!response.ok || body.data == null) {
    throw new ApiError(`Error HTTP ${response.status} al consultar la API`, response.status);
  }
  return body.data;
}
