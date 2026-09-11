from strawberry.fastapi import BaseContext

from app.bananas.repository import BananaRepository
from app.bananas.service import BananaService
from app.farms.repository import FarmRepository
from app.farms.service import FarmService


class Context(BaseContext):
    """Lo que reciben los resolvers en `info.context`.

    Hereda de BaseContext porque Strawberry le inyecta ahí `request`,
    `response` y `background_tasks` (útiles para auth y cookies más adelante).
    """

    def __init__(self, bananas: BananaService, farms: FarmService) -> None:
        super().__init__()
        self.bananas = bananas
        self.farms = farms


def build_context() -> Context:
    """Aquí se arma el grafo de dependencias. Esto es el container de Nest, a mano."""
    farms = FarmService(FarmRepository())
    bananas = BananaService(BananaRepository(), farms)
    return Context(bananas=bananas, farms=farms)
