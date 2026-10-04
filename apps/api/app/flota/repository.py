"""Acceso a datos de la flota: sólo consultas, sin reglas de negocio ni commit."""

from decimal import Decimal

from sqlalchemy.orm import selectinload
from sqlmodel import col, or_, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models import Camion, Carga, CentroDistribucion, TipoCamion, Viaje


class TipoCamionRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def listar(self) -> list[TipoCamion]:
        stmt = select(TipoCamion).order_by(TipoCamion.tipo)
        return list((await self.session.exec(stmt)).all())

    async def obtener(self, id: int) -> TipoCamion | None:
        return await self.session.get(TipoCamion, id)


class CamionRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    def _con_relaciones(self):
        # En async no hay carga perezosa: todo lo que vaya a leer la capa
        # GraphQL (tipo y documentos) se trae aquí. populate_existing refresca
        # un camión que ya estaba en la sesión (p. ej. recién editado).
        return (
            select(Camion)
            .options(selectinload(Camion.tipo_camion), selectinload(Camion.documentos))
            .execution_options(populate_existing=True)
        )

    async def listar(
        self,
        *,
        busqueda: str | None = None,
        id_tipo_camion: int | None = None,
        capacidad_min_kg: Decimal | None = None,
    ) -> list[Camion]:
        stmt = self._con_relaciones().order_by(Camion.patente)
        if busqueda:
            patron = f"%{busqueda}%"
            stmt = stmt.join(
                TipoCamion, col(TipoCamion.id) == Camion.id_tipo_camion
            ).where(
                or_(
                    col(Camion.patente).ilike(patron),
                    col(Camion.marca).ilike(patron),
                    col(Camion.modelo).ilike(patron),
                    col(TipoCamion.tipo).ilike(patron),
                )
            )
        if id_tipo_camion is not None:
            stmt = stmt.where(Camion.id_tipo_camion == id_tipo_camion)
        if capacidad_min_kg is not None:
            stmt = stmt.where(Camion.peso_kg >= capacidad_min_kg)
        return list((await self.session.exec(stmt)).all())

    async def obtener(self, id: int) -> Camion | None:
        stmt = self._con_relaciones().where(Camion.id == id)
        return (await self.session.exec(stmt)).first()

    async def existe_patente(
        self, patente: str, *, excepto_id: int | None = None
    ) -> bool:
        stmt = select(Camion.id).where(Camion.patente == patente)
        if excepto_id is not None:
            stmt = stmt.where(Camion.id != excepto_id)
        return (await self.session.exec(stmt)).first() is not None

    def agregar(self, camion: Camion) -> None:
        self.session.add(camion)


class ViajeCamionRepository:
    """Viajes vistos desde el camión (historial de la HU1.3 y estado En viaje).

    La gestión de viajes es de la E05; aquí sólo se leen.
    """

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def listar_por_camion(self, id_camion: int) -> list[Viaje]:
        stmt = (
            select(Viaje)
            .where(Viaje.id_camion == id_camion)
            .options(
                selectinload(Viaje.conductor),
                selectinload(Viaje.carga).selectinload(Carga.pedidos),
            )
            .order_by(col(Viaje.fecha_inicio).desc())
        )
        return list((await self.session.exec(stmt)).all())

    async def en_ruta_por_camion(
        self, id_camion: int | None = None
    ) -> dict[int, Viaje]:
        """Viaje en curso de cada camión: no cancelado y sin llegada registrada.

        Con `id_camion`, sólo el de ese camión. Trae el conductor para el motivo.
        """
        stmt = (
            select(Viaje)
            .where(
                col(Viaje.fecha_llegada).is_(None),
                col(Viaje.fecha_cancelacion).is_(None),
            )
            .options(selectinload(Viaje.conductor))
        )
        if id_camion is not None:
            stmt = stmt.where(Viaje.id_camion == id_camion)
        return {v.id_camion: v for v in (await self.session.exec(stmt)).all()}

    async def centros_por_id(self, ids: set[int]) -> dict[int, CentroDistribucion]:
        # Carga no declara la relación con su centro, así que se buscan aparte.
        if not ids:
            return {}
        stmt = select(CentroDistribucion).where(col(CentroDistribucion.id).in_(ids))
        return {c.id: c for c in (await self.session.exec(stmt)).all()}
