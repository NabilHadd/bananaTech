from datetime import date

from sqlalchemy import Date, cast
from sqlalchemy.orm import selectinload
from sqlmodel import col, or_, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.cliente import CentroDistribucion, Cliente
from app.models.pedido import MercaderiaTipo, Pedido, PedidoEstado


class PedidoRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    def _con_relaciones(self):
        return (
            select(Pedido)
            .options(
                selectinload(Pedido.cliente).selectinload(Cliente.centros),
                selectinload(Pedido.centro),
            )
            .execution_options(populate_existing=True)
        )

    async def listar(
        self,
        *,
        busqueda: str | None = None,
        estado: PedidoEstado | None = None,
        tipo_mercaderia: MercaderiaTipo | None = None,
        id_cliente: int | None = None,
        fecha: date | None = None,
    ) -> list[Pedido]:
        stmt = self._con_relaciones().order_by(Pedido.ventana_inicio.asc(), Pedido.id.desc())

        if estado:
            stmt = stmt.where(Pedido.estado == estado)
        if tipo_mercaderia:
            stmt = stmt.where(Pedido.tipo_mercaderia == tipo_mercaderia)
        if id_cliente:
            stmt = stmt.where(Pedido.id_cliente == id_cliente)
        if fecha:
            stmt = stmt.where(
                cast(Pedido.ventana_inicio, Date) <= fecha,
                cast(Pedido.ventana_fin, Date) >= fecha,
            )
        if busqueda:
            patron = f"%{busqueda}%"
            # Unir con Cliente y CentroDistribucion para búsqueda textual
            stmt = (
                stmt.join(Cliente, Pedido.id_cliente == Cliente.id)
                .join(CentroDistribucion, Pedido.id_centro == CentroDistribucion.id)
                .where(
                    or_(
                        col(Cliente.razon).ilike(patron),
                        col(Cliente.rut).ilike(patron),
                        col(CentroDistribucion.direccion).ilike(patron),
                    )
                )
            )

        return list((await self.session.exec(stmt)).all())

    async def obtener(self, id: int) -> Pedido | None:
        stmt = self._con_relaciones().where(Pedido.id == id)
        return (await self.session.exec(stmt)).first()

    def agregar(self, pedido: Pedido) -> None:
        self.session.add(pedido)
