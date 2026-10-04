from datetime import datetime

from sqlalchemy import func
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.seguridad import Parametro, ParametroAuditoria, Usuario
from app.models.viaje import Viaje


class AdministracionRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def listar_usuarios(self) -> list[Usuario]:
        result = await self.session.exec(select(Usuario).order_by(Usuario.username))
        return list(result.all())

    async def obtener_usuario(self, id: int) -> Usuario | None:
        return await self.session.get(Usuario, id)

    async def usuario_por_nombre(self, username: str) -> Usuario | None:
        result = await self.session.exec(select(Usuario).where(Usuario.username == username))
        return result.first()

    async def contar_administradores_activos(self) -> int:
        result = await self.session.exec(
            select(func.count()).select_from(Usuario).where(
                Usuario.rol == "ADMINISTRADOR", Usuario.activo.is_(True)
            )
        )
        return result.one()

    async def listar_parametros(self, claves: set[str]) -> list[Parametro]:
        result = await self.session.exec(
            select(Parametro).where(Parametro.clave.in_(claves)).order_by(Parametro.clave)
        )
        return list(result.all())

    async def obtener_parametro(self, clave: str) -> Parametro | None:
        return await self.session.get(Parametro, clave)

    async def historial_parametros(
        self, claves: set[str], clave: str | None = None
    ) -> list[tuple[ParametroAuditoria, str]]:
        statement = (
            select(ParametroAuditoria, ParametroAuditoria.cambiado_por_username)
            .where(ParametroAuditoria.clave.in_(claves))
            .order_by(ParametroAuditoria.cambiado_en.desc())
        )
        if clave is not None:
            statement = statement.where(ParametroAuditoria.clave == clave)
        result = await self.session.exec(statement)
        return list(result.all())

    async def listar_viajes_periodo(self, desde: datetime, hasta: datetime) -> list[Viaje]:
        result = await self.session.exec(
            select(Viaje)
            .where(Viaje.fecha_inicio >= desde, Viaje.fecha_inicio < hasta)
            .order_by(Viaje.fecha_inicio)
        )
        return list(result.all())

    def agregar_usuario(self, usuario: Usuario) -> None:
        self.session.add(usuario)

    async def eliminar_usuario(self, usuario: Usuario) -> None:
        await self.session.delete(usuario)

    def agregar_auditoria(self, auditoria: ParametroAuditoria) -> None:
        self.session.add(auditoria)