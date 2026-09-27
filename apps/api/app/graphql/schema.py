import strawberry

from app.graphql.mutations import Mutation
from app.graphql.queries import Query

# Punto de entrada del esquema GraphQL. Las operaciones se separan por responsabilidad.
schema = strawberry.Schema(query=Query, mutation=Mutation)
