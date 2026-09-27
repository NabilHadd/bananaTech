import asyncio
from typing import Annotated

from fastapi import Depends
from sqlmodel.ext.asyncio.session import AsyncSession
from strawberry.fastapi import BaseContext

from app.core.db import get_session


class Context(BaseContext):
    """Lo que reciben los resolvers en `info.context`.

    Hereda de BaseContext porque Strawberry le inyecta ahí `request`,
    `response` y `background_tasks` (útiles para auth y cookies más adelante).
    """

    def __init__(self, session: AsyncSession) -> None:
        super().__init__()
        self.session = session
        self.session_lock = asyncio.Lock()


async def build_context(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> Context:
    """Construye el contexto GraphQL con una sesión de base de datos."""
    return Context(session=session)
