"""Acceso a datos de clientes: sólo consultas, sin reglas de negocio ni commit."""

from sqlalchemy.orm import selectinload
from sqlmodel import col, or_, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models import CentroDistribucion, Cliente


class CentroDistribucionRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def obtener_por_direccion(self, direccion: str) -> CentroDistribucion | None:
        stmt = select(CentroDistribucion).where(CentroDistribucion.direccion == direccion)
        return (await self.session.exec(stmt)).first()

    async def obtener(self, id: int) -> CentroDistribucion | None:
        return await self.session.get(CentroDistribucion, id)

    async def listar(self, *, busqueda: str | None = None) -> list[CentroDistribucion]:
        stmt = select(CentroDistribucion).order_by(CentroDistribucion.direccion)
        if busqueda:
            stmt = stmt.where(col(CentroDistribucion.direccion).ilike(f"%{busqueda}%"))
        return list((await self.session.exec(stmt)).all())

    async def obtener_por_ids(self, ids: list[int]) -> list[CentroDistribucion]:
        if not ids:
            return []
        stmt = select(CentroDistribucion).where(col(CentroDistribucion.id).in_(ids))
        return list((await self.session.exec(stmt)).all())

    def agregar(self, centro: CentroDistribucion) -> None:
        self.session.add(centro)


class ClienteRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    def _con_relaciones(self):
        return (
            select(Cliente)
            .options(selectinload(Cliente.centros))
            .execution_options(populate_existing=True)
        )

    async def listar(self, *, busqueda: str | None = None) -> list[Cliente]:
        stmt = self._con_relaciones().order_by(Cliente.razon)
        if busqueda:
            patron = f"%{busqueda}%"
            stmt = stmt.where(
                or_(
                    col(Cliente.razon).ilike(patron),
                    col(Cliente.rut).ilike(patron),
                    col(Cliente.mail).ilike(patron),
                    col(Cliente.telefono).ilike(patron),
                    col(Cliente.direccion).ilike(patron),
                )
            )
        return list((await self.session.exec(stmt)).all())

    async def obtener(self, id: int) -> Cliente | None:
        stmt = self._con_relaciones().where(Cliente.id == id)
        return (await self.session.exec(stmt)).first()

    async def existe_rut(self, rut: str, *, excepto_id: int | None = None) -> bool:
        stmt = select(Cliente.id).where(Cliente.rut == rut)
        if excepto_id is not None:
            stmt = stmt.where(Cliente.id != excepto_id)
        return (await self.session.exec(stmt)).first() is not None

    async def existe_mail(self, mail: str, *, excepto_id: int | None = None) -> bool:
        stmt = select(Cliente.id).where(Cliente.mail == mail)
        if excepto_id is not None:
            stmt = stmt.where(Cliente.id != excepto_id)
        return (await self.session.exec(stmt)).first() is not None

    async def existe_telefono(self, telefono: str, *, excepto_id: int | None = None) -> bool:
        stmt = select(Cliente.id).where(Cliente.telefono == telefono)
        if excepto_id is not None:
            stmt = stmt.where(Cliente.id != excepto_id)
        return (await self.session.exec(stmt)).first() is not None

    def agregar(self, cliente: Cliente) -> None:
        self.session.add(cliente)
