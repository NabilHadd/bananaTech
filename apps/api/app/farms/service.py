from app.farms.models import Farm
from app.farms.repository import FarmRepository


class FarmService:
    """Lógica de negocio de fincas."""

    def __init__(self, repository: FarmRepository) -> None:
        self._repository = repository

    async def list_all(self) -> list[Farm]:
        return await self._repository.list_all()

    async def get(self, farm_id: str) -> Farm | None:
        return await self._repository.get(farm_id)

    async def exists(self, farm_id: str) -> bool:
        return await self._repository.get(farm_id) is not None
