from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.seguridad import Usuario


class AuthRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def usuario_por_nombre(self, username: str) -> Usuario | None:
        result = await self.session.exec(select(Usuario).where(Usuario.username == username))
        return result.first()