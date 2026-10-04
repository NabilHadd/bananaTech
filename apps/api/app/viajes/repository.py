"""Acceso a datos de viajes (E05): sólo consultas, sin reglas de negocio ni commit."""

from sqlalchemy.orm import selectinload
from sqlmodel import col, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models import Camion, ClaseLicencia, Cliente, Conductor, Licencia
from app.models.pedido import Carga, Pedido
from app.models.viaje import Viaje


class ViajeRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def listar(self) -> list[Viaje]:
        stmt = self._con_relaciones().order_by(col(Viaje.fecha_inicio).desc())
        return list((await self.session.exec(stmt)).all())

    async def obtener(self, id: int) -> Viaje | None:
        stmt = self._con_relaciones().where(Viaje.id == id)
        return (await self.session.exec(stmt)).first()

    async def bloquear(self, *, id_carga: int, id_camion: int, id_conductor: int) -> None:
        """SELECT … FOR UPDATE de la carga, el camión y el conductor del viaje.

        Quedan bloqueados hasta el commit o rollback: otra transacción que
        quiera bloquear alguno espera. Siempre en este orden, para que dos
        transacciones no se esperen mutuamente (deadlock).
        """
        for modelo, id in ((Carga, id_carga), (Camion, id_camion), (Conductor, id_conductor)):
            await self.session.exec(
                select(modelo.id).where(modelo.id == id).with_for_update()
            )

    async def bloquear_viaje(self, id: int) -> None:
        """SELECT … FOR UPDATE del viaje: finalizarlo y cancelarlo se excluyen."""
        await self.session.exec(select(Viaje.id).where(Viaje.id == id).with_for_update())

    def _con_relaciones(self):
        # En async no hay carga perezosa: se trae todo lo que leen
        # ConductorType, CamionType y CargaType (ver sus _con_relaciones).
        camion = selectinload(Viaje.camion)
        carga = selectinload(Viaje.carga)
        pedidos = carga.selectinload(Carga.pedidos)
        return select(Viaje).options(
            selectinload(Viaje.conductor)
            .selectinload(Conductor.licencias)
            .selectinload(Licencia.clases)
            .selectinload(ClaseLicencia.tipos_camion),
            camion.selectinload(Camion.tipo_camion),
            camion.selectinload(Camion.documentos),
            carga.selectinload(Carga.centro),
            pedidos.selectinload(Pedido.cliente).selectinload(Cliente.centros),
            pedidos.selectinload(Pedido.centro),
            pedidos.selectinload(Pedido.cargas),
        )

    def agregar(self, viaje: Viaje) -> None:
        self.session.add(viaje)
