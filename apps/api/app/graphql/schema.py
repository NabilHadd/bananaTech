import strawberry
from strawberry.tools import merge_types

from app.bananas.resolvers import BananaMutation, BananaQuery
from app.farms.resolvers import FarmQuery

# Composition root: el único archivo que sabe qué features existen (≈ AppModule)
Query = merge_types("Query", (BananaQuery, FarmQuery))
Mutation = merge_types("Mutation", (BananaMutation,))

schema = strawberry.Schema(query=Query, mutation=Mutation)
