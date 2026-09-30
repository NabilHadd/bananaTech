"""Acceso a datos de cargas (HU4.1–4.3)."""

from sqlalchemy.orm import selectinload
from sqlmodel import col, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models import Camion
from app.models.cliente import Cliente
from app.models.pedido import Carga, CargaEstado, Pedido


class CargaRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    def _con_relaciones(self):
        # Todo lo que lee la capa GraphQL: el centro y los pedidos con su
        # cliente, su centro y sus cargas (para saber cuál los retiene).
        # Sin populate_existing, a diferencia de los otros repositorios: las
        # cargas de cada pedido incluyen a esta misma carga, y re-poblarla
        # borraría sus pedidos recién cargados. La sesión es una por request,
        # así que lo que ya está en ella es lo último que se escribió.
        pedidos = selectinload(Carga.pedidos)
        return select(Carga).options(
            selectinload(Carga.centro),
            pedidos.selectinload(Pedido.cliente).selectinload(Cliente.centros),
            pedidos.selectinload(Pedido.centro),
            pedidos.selectinload(Pedido.cargas),
        )

    async def listar(self, *, estado: CargaEstado | None = None) -> list[Carga]:
        stmt = self._con_relaciones().order_by(col(Carga.id).desc())
        if estado:
            stmt = stmt.where(Carga.estado == estado)
        return list((await self.session.exec(stmt)).all())

    async def obtener(self, id: int) -> Carga | None:
        stmt = self._con_relaciones().where(Carga.id == id)
        return (await self.session.exec(stmt)).first()

    async def pedidos_por_id(self, ids: list[int]) -> list[Pedido]:
        """Pedidos buscados por id, con sus cargas, para validar que estén libres (HU4.1)."""
        stmt = (
            select(Pedido)
            .where(col(Pedido.id).in_(ids))
            .options(selectinload(Pedido.cargas))
        )
        return list((await self.session.exec(stmt)).all())

    async def camiones_activos(self) -> list[Camion]:
        """Para saber si algún camión de la flota puede llevar la carga (HU4.2)."""
        stmt = select(Camion).where(col(Camion.activo).is_(True))
        return list((await self.session.exec(stmt)).all())

    def agregar(self, carga: Carga) -> None:
        self.session.add(carga)
