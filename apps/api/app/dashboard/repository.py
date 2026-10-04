from datetime import datetime

from sqlalchemy.orm import selectinload
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.camion import Camion, Documento
from app.models.pedido import Carga, CargaEstado, Pedido, PedidoEstado
from app.models.viaje import Viaje


class DashboardRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def listar_viajes_en_curso(self) -> list[Viaje]:
        result = await self.session.exec(
            select(Viaje)
            .join(Carga, Viaje.id_carga == Carga.id)
            .where(Viaje.fecha_llegada.is_(None), Carga.estado == CargaEstado.EN_RUTA)
            .options(
                selectinload(Viaje.carga).selectinload(Carga.pedidos),
                selectinload(Viaje.carga).selectinload(Carga.centro),
                selectinload(Viaje.camion),
                selectinload(Viaje.conductor),
            )
            .order_by(Viaje.fecha_inicio)
        )
        return list(result.all())

    async def listar_pedidos_creados(self) -> list[Pedido]:
        result = await self.session.exec(
            select(Pedido)
            .where(Pedido.estado == PedidoEstado.CREADA)
            .options(selectinload(Pedido.cargas))
            .order_by(Pedido.ventana_fin, Pedido.id)
        )
        return list(result.all())

    async def listar_camiones_activos(self) -> list[Camion]:
        result = await self.session.exec(select(Camion).where(Camion.activo.is_(True)))
        return list(result.all())

    async def listar_documentos_hasta(
        self, fecha_limite: datetime
    ) -> list[tuple[Documento, str]]:
        result = await self.session.exec(
            select(Documento, Camion.patente)
            .join(Camion, Documento.id_camion == Camion.id)
            .where(Camion.activo.is_(True), Documento.fecha_vencimiento < fecha_limite)
            .order_by(Documento.fecha_vencimiento)
        )
        return list(result.all())