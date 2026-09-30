from typing import Annotated

from fastapi import Depends
from sqlmodel.ext.asyncio.session import AsyncSession
from strawberry.fastapi import BaseContext

from app.clientes.repository import CentroDistribucionRepository, ClienteRepository
from app.clientes.service import ClientesService
from app.conductores.repository import (
    ClaseLicenciaRepository,
    ConductorRepository,
    ViajeConductorRepository,
)
from app.conductores.service import ConductoresService
from app.core.db import get_session
from app.flota.repository import CamionRepository, TipoCamionRepository, ViajeRepository
from app.flota.service import FlotaService
from app.pedidos.repository import PedidoRepository
from app.pedidos.service import PedidosService


class Context(BaseContext):
    """Lo que reciben los resolvers en `info.context`.

    Hereda de BaseContext porque Strawberry le inyecta ahí `request`,
    `response` y `background_tasks` (útiles para auth y cookies más adelante).
    """

    def __init__(self, session: AsyncSession) -> None:
        super().__init__()
        self.session = session
        # Service y repositorios comparten la sesión: un commit del service
        # confirma todo lo que hicieron los repositorios en este request.
        cliente_repo = ClienteRepository(session)
        centro_repo = CentroDistribucionRepository(session)
        self.flota = FlotaService(
            session,
            CamionRepository(session),
            TipoCamionRepository(session),
            ViajeRepository(session),
        )
        self.conductores = ConductoresService(
            session,
            ConductorRepository(session),
            ClaseLicenciaRepository(session),
            ViajeConductorRepository(session),
        )
        self.clientes = ClientesService(
            session,
            cliente_repo,
            centro_repo,
        )
        self.pedidos = PedidosService(
            session,
            PedidoRepository(session),
            cliente_repo,
            centro_repo,
        )


async def build_context(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> Context:
    """Aquí se arma el grafo de dependencias: una sesión por request."""
    return Context(session)
