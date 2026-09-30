"""Queries y mutations de pedidos (HU3.2)."""

import strawberry
from strawberry.types import Info

from app.core.context import Context
from app.pedidos.inputs import EntregaPedidoInput, PedidoFiltros, PedidoInput
from app.pedidos.types import PedidoType


@strawberry.type
class PedidosQuery:
    @strawberry.field(description="Listado de pedidos con filtros opcionales (HU3.2 y HU3.4).")
    async def pedidos(
        self, info: Info[Context, None], filtros: PedidoFiltros | None = None
    ) -> list[PedidoType]:
        busqueda = filtros.busqueda if filtros else None
        estado = filtros.estado if filtros else None
        tipo_mercaderia = filtros.tipo_mercaderia if filtros else None
        id_cliente = filtros.id_cliente if filtros else None
        fecha = filtros.fecha if filtros else None

        pedidos = await info.context.pedidos.listar_pedidos(
            busqueda=busqueda,
            estado=estado,
            tipo_mercaderia=tipo_mercaderia,
            id_cliente=id_cliente,
            fecha=fecha,
        )
        return [PedidoType.from_model(p) for p in pedidos]

    @strawberry.field(description="Ficha de un pedido; null si no existe (HU3.2).")
    async def pedido(self, info: Info[Context, None], id: int) -> PedidoType | None:
        p = await info.context.pedidos.obtener_pedido(id)
        return PedidoType.from_model(p) if p else None


@strawberry.type
class PedidosMutation:
    @strawberry.mutation(
        description="Crea un pedido validando ventana de entrega y restricciones (HU3.2)."
    )
    async def crear_pedido(
        self, info: Info[Context, None], input: PedidoInput
    ) -> PedidoType:
        pedido = await info.context.pedidos.crear_pedido(input.to_datos())
        return PedidoType.from_model(pedido)

    @strawberry.mutation(description="Avanza un pedido al estado En tránsito (HU3.3).")
    async def marcar_pedido_en_transito(
        self, info: Info[Context, None], id: int
    ) -> PedidoType:
        pedido = await info.context.pedidos.avanzar_a_transito(id)
        return PedidoType.from_model(pedido)

    @strawberry.mutation(description="Marca un pedido como entregado (HU3.3).")
    async def entregar_pedido(
        self, info: Info[Context, None], input: EntregaPedidoInput
    ) -> PedidoType:
        pedido = await info.context.pedidos.entregar_pedido(
            id=input.id_pedido,
            fecha_entrega=input.fecha_entrega,
            receptor=input.receptor,
            observaciones=input.observaciones,
        )
        return PedidoType.from_model(pedido)

    @strawberry.mutation(description="Cancela un pedido (HU3.3).")
    async def cancelar_pedido(
        self, info: Info[Context, None], id: int
    ) -> PedidoType:
        pedido = await info.context.pedidos.cancelar_pedido(id)
        return PedidoType.from_model(pedido)
