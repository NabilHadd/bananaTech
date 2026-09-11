from typing import TYPE_CHECKING, Annotated

import strawberry

from app.bananas.models import Banana

if TYPE_CHECKING:
    from app.farms.types import FarmType


@strawberry.type(name="Banana")
class BananaType:
    id: strawberry.ID
    name: str
    ripeness: int
    # Private = existe en Python pero no se expone en el schema
    farm_id: strawberry.Private[str]

    @classmethod
    def from_model(cls, banana: Banana) -> "BananaType":
        return cls(
            id=strawberry.ID(banana.id),
            name=banana.name,
            ripeness=banana.ripeness,
            farm_id=banana.farm_id,
        )

    @strawberry.field
    async def farm(
        self, info: strawberry.Info
    ) -> Annotated["FarmType", strawberry.lazy("app.farms.types")]:
        from app.farms.types import FarmType

        farm = await info.context.farms.get(self.farm_id)
        if farm is None:
            raise ValueError(f"Finca {self.farm_id} no encontrada")
        return FarmType.from_model(farm)
