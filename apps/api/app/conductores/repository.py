"""Acceso a datos de conductores: sólo consultas, sin reglas de negocio ni commit."""

from datetime import datetime

from sqlalchemy import func
from sqlalchemy.orm import selectinload
from sqlmodel import col, or_, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.flota.repository import ViajeRepository
from app.models import (
    Carga,
    CargaEstado,
    ClaseLicencia,
    Conductor,
    Licencia,
    LicenciaClase,
    Viaje,
)


class ClaseLicenciaRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def listar(self) -> list[ClaseLicencia]:
        stmt = (
            select(ClaseLicencia)
            .options(selectinload(ClaseLicencia.tipos_camion))
            .order_by(ClaseLicencia.clase)
        )
        return list((await self.session.exec(stmt)).all())

    async def por_clases(self, clases: list[LicenciaClase]) -> list[ClaseLicencia]:
        stmt = select(ClaseLicencia).where(col(ClaseLicencia.clase).in_(clases))
        return list((await self.session.exec(stmt)).all())


class ConductorRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    def _con_relaciones(self):
        # En async no hay carga perezosa: licencias, sus clases y los tipos de
        # camión que habilita cada clase se traen aquí. populate_existing
        # refresca un conductor que ya estaba en la sesión (p. ej. recién editado).
        return (
            select(Conductor)
            .options(
                selectinload(Conductor.licencias)
                .selectinload(Licencia.clases)
                .selectinload(ClaseLicencia.tipos_camion)
            )
            .execution_options(populate_existing=True)
        )

    async def listar(self, *, busqueda: str | None = None) -> list[Conductor]:
        stmt = self._con_relaciones().order_by(Conductor.apellidos, Conductor.nombres)
        if busqueda:
            patron = f"%{busqueda}%"
            stmt = stmt.where(
                or_(
                    func.concat(Conductor.nombres, " ", Conductor.apellidos).ilike(
                        patron
                    ),
                    col(Conductor.rut).ilike(patron),
                    # Permite buscar el RUT escrito sin puntos.
                    func.replace(Conductor.rut, ".", "").ilike(patron),
                    col(Conductor.email).ilike(patron),
                )
            )
        return list((await self.session.exec(stmt)).all())

    async def obtener(self, id: int) -> Conductor | None:
        stmt = self._con_relaciones().where(Conductor.id == id)
        return (await self.session.exec(stmt)).first()

    async def existe_rut(self, rut: str, *, excepto_id: int | None = None) -> bool:
        stmt = select(Conductor.id).where(Conductor.rut == rut)
        if excepto_id is not None:
            stmt = stmt.where(Conductor.id != excepto_id)
        return (await self.session.exec(stmt)).first() is not None

    def agregar(self, conductor: Conductor) -> None:
        self.session.add(conductor)


class ViajeConductorRepository(ViajeRepository):
    """Viajes vistos desde el conductor (historial y disponibilidad de la HU2.1).

    Reutiliza `centros_por_id` del repositorio de la flota. La gestión de
    viajes es de la E05; aquí sólo se leen.
    """

    async def listar_por_conductor(self, id_conductor: int) -> list[Viaje]:
        stmt = (
            select(Viaje)
            .where(Viaje.id_conductor == id_conductor)
            .options(
                selectinload(Viaje.camion),
                selectinload(Viaje.carga).selectinload(Carga.pedidos),
            )
            .order_by(col(Viaje.fecha_inicio).desc())
        )
        return list((await self.session.exec(stmt)).all())

    async def listar_con_fin_desde(self, desde: datetime) -> list[Viaje]:
        """Viajes que siguen en curso o terminaron después de `desde`.

        Basta para saber quién está en viaje o todavía en descanso.
        """
        stmt = (
            select(Viaje)
            .where(Viaje.fecha_fin >= desde)
            .options(selectinload(Viaje.camion), selectinload(Viaje.carga))
        )
        return list((await self.session.exec(stmt)).all())

    async def tiene_viajes_pendientes(self, id_conductor: int, ahora: datetime) -> bool:
        """Si tiene viajes no cancelados que aún no terminan (en curso o planificados)."""
        stmt = (
            select(Viaje.id)
            .join(Carga, col(Carga.id) == Viaje.id_carga)
            .where(
                Viaje.id_conductor == id_conductor,
                Viaje.fecha_fin > ahora,
                Carga.estado != CargaEstado.CANCELADA,
            )
        )
        return (await self.session.exec(stmt)).first() is not None
