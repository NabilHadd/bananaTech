from itertools import count

from app.bananas.models import Banana

_SEED: dict[str, Banana] = {
    "1": Banana(id="1", name="Cavendish", ripeness=3, farm_id="1"),
    "2": Banana(id="2", name="Plátano macho", ripeness=1, farm_id="2"),
    "3": Banana(id="3", name="Baby banana", ripeness=5, farm_id="1"),
}
_next_id = count(len(_SEED) + 1)


class BananaRepository:
    async def list_all(self) -> list[Banana]:
        return list(_SEED.values())

    async def list_by_farm(self, farm_id: str) -> list[Banana]:
        return [b for b in _SEED.values() if b.farm_id == farm_id]

    async def get(self, banana_id: str) -> Banana | None:
        return _SEED.get(banana_id)

    async def add(self, banana: Banana) -> Banana:
        banana.id = str(next(_next_id))
        _SEED[banana.id] = banana
        return banana
