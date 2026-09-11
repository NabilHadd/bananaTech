from app.bananas.models import Banana
from app.bananas.repository import BananaRepository
from app.core.errors import DomainError
from app.farms.service import FarmService

MAX_RIPENESS = 5


class BananaService:
    """Lógica de negocio. Recibe sus dependencias por constructor."""

    def __init__(self, repository: BananaRepository, farms: FarmService) -> None:
        self._repository = repository
        self._farms = farms

    async def list_all(self, min_ripeness: int = 0) -> list[Banana]:
        bananas = await self._repository.list_all()
        return [b for b in bananas if b.ripeness >= min_ripeness]

    async def list_by_farm(self, farm_id: str) -> list[Banana]:
        return await self._repository.list_by_farm(farm_id)

    async def get(self, banana_id: str) -> Banana | None:
        return await self._repository.get(banana_id)

    async def create(self, name: str, farm_id: str, ripeness: int) -> Banana:
        # Las reglas de negocio viven aquí, no en el resolver
        if not name.strip():
            raise DomainError("El nombre no puede estar vacío")
        if not 0 <= ripeness <= MAX_RIPENESS:
            raise DomainError(f"La madurez debe estar entre 0 y {MAX_RIPENESS}")
        if not await self._farms.exists(farm_id):
            raise DomainError(f"La finca {farm_id} no existe")

        return await self._repository.add(
            Banana(id="", name=name.strip(), ripeness=ripeness, farm_id=farm_id)
        )
