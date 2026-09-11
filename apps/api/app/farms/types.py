from typing import TYPE_CHECKING, Annotated

import strawberry

from app.farms.models import Farm

if TYPE_CHECKING:
    from app.bananas.types import BananaType


@strawberry.type(name="Farm")
class FarmType:
    """Tipo expuesto en el schema GraphQL (≈ @ObjectType de Nest)."""

    id: strawberry.ID
    name: str
    country: str

    @classmethod
    def from_model(cls, farm: Farm) -> "FarmType":
        return cls(id=strawberry.ID(farm.id), name=farm.name, country=farm.country)

    @strawberry.field
    async def bananas(
        self, info: strawberry.Info
    ) -> list[Annotated["BananaType", strawberry.lazy("app.bananas.types")]]:
        # Solo se ejecuta si el cliente pide este campo
        from app.bananas.types import BananaType

        bananas = await info.context.bananas.list_by_farm(str(self.id))
        return [BananaType.from_model(b) for b in bananas]
