import strawberry

from app.bananas.types import BananaType


@strawberry.input
class CreateBananaInput:
    """≈ DTO de entrada (@InputType de Nest)."""

    name: str
    farm_id: strawberry.ID
    ripeness: int = 0


@strawberry.type
class BananaQuery:
    @strawberry.field
    async def bananas(
        self, info: strawberry.Info, min_ripeness: int = 0
    ) -> list[BananaType]:
        bananas = await info.context.bananas.list_all(min_ripeness=min_ripeness)
        return [BananaType.from_model(b) for b in bananas]

    @strawberry.field
    async def banana(
        self, info: strawberry.Info, id: strawberry.ID
    ) -> BananaType | None:
        banana = await info.context.bananas.get(str(id))
        return BananaType.from_model(banana) if banana else None


@strawberry.type
class BananaMutation:
    @strawberry.mutation
    async def create_banana(
        self, info: strawberry.Info, data: CreateBananaInput
    ) -> BananaType:
        banana = await info.context.bananas.create(
            name=data.name, farm_id=str(data.farm_id), ripeness=data.ripeness
        )
        return BananaType.from_model(banana)
