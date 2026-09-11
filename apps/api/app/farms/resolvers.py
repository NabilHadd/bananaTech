import strawberry

from app.farms.types import FarmType


@strawberry.type
class FarmQuery:
    """≈ @Resolver() de Nest. Solo traduce entre GraphQL y el servicio."""

    @strawberry.field
    async def farms(self, info: strawberry.Info) -> list[FarmType]:
        farms = await info.context.farms.list_all()
        return [FarmType.from_model(f) for f in farms]

    @strawberry.field
    async def farm(self, info: strawberry.Info, id: strawberry.ID) -> FarmType | None:
        farm = await info.context.farms.get(str(id))
        return FarmType.from_model(farm) if farm else None
