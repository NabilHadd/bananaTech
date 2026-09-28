from typing import Annotated

from fastapi import Depends
from sqlmodel.ext.asyncio.session import AsyncSession
from strawberry.fastapi import BaseContext

from app.core.db import get_session
from app.flota.repository import CamionRepository, TipoCamionRepository, ViajeRepository
from app.flota.service import FlotaService


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
        self.flota = FlotaService(
            session,
            CamionRepository(session),
            TipoCamionRepository(session),
            ViajeRepository(session),
        )


async def build_context(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> Context:
    """Aquí se arma el grafo de dependencias: una sesión por request."""
    return Context(session)
