const GRAPHQL_URL =
  import.meta.env.VITE_API_URL ?? 'http://localhost:8000/graphql';

type GraphQLErrorResponse = {
  message: string;
};

type GraphQLResponse<T> = {
  data?: T;
  errors?: GraphQLErrorResponse[];
};

export async function graphqlRequest<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });

  const result = (await response.json()) as GraphQLResponse<T>;
  if (!response.ok || result.errors?.length || !result.data) {
    throw new Error(
      result.errors?.map((error) => error.message).join('; ') ??
        `Error HTTP ${response.status} al consultar GraphQL`,
    );
  }

  return result.data;
}
