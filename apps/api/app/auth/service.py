from dataclasses import dataclass

from sqlmodel.ext.asyncio.session import AsyncSession

from app.auth.inputs import LoginInput
from app.auth.repository import AuthRepository
from app.core.auth import create_token, verify_password


@dataclass(frozen=True)
class LoginUsuarioData:
    id: int
    username: str
    role: str


@dataclass(frozen=True)
class LoginResult:
    token: str
    user: LoginUsuarioData


class AuthService:
    def __init__(self, session: AsyncSession, repository: AuthRepository) -> None:
        self.session = session
        self.repository = repository

    async def iniciar_sesion(self, input: LoginInput) -> LoginResult | None:
        usuario = await self.repository.usuario_por_nombre(input.username)
        if usuario is None or not usuario.activo:
            return None
        if not verify_password(input.password, usuario.password_hash):
            return None
        return LoginResult(
            token=create_token(usuario),
            user=LoginUsuarioData(id=usuario.id, username=usuario.username, role=usuario.rol),
        )