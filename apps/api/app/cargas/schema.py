"""Queries y mutations de cargas (HU4.1–4.3)."""

import strawberry
from strawberry.types import Info

from app.cargas.types import CargaType, OcupacionType
from app.core.context import Context
from app.models.pedido import CargaEstado


@strawberry.type
class CargasQuery:
    @strawberry.field(description="Listado de cargas, opcionalmente por estado.")
    async def cargas(
        self, info: Info[Context, None], estado: CargaEstado | None = None
    ) -> list[CargaType]:
        cargas = await info.context.cargas.listar_cargas(estado=estado)
        return [CargaType.from_model(c) for c in cargas]

    @strawberry.field(description="Ficha de una carga; null si no existe.")
    async def carga(self, info: Info[Context, None], id: int) -> CargaType | None:
        c = await info.context.cargas.obtener_carga(id)
        return CargaType.from_model(c) if c else None

    @strawberry.field(description="Ocupación en peso y volumen de una carga en un camión (HU4.3).")
    async def ocupacion_carga(
        self, info: Info[Context, None], id_carga: int, id_camion: int
    ) -> OcupacionType:
        o = await info.context.cargas.ocupacion(id_carga, id_camion)
        return OcupacionType.from_model(o)


@strawberry.type
class CargasMutation:
    @strawberry.mutation(description="Crea una carga agrupando pedidos Creada (HU4.1).")
    async def crear_carga(
        self, info: Info[Context, None], id_pedidos: list[int]
    ) -> CargaType:
        carga = await info.context.cargas.crear_carga(id_pedidos)
        return CargaType.from_model(carga)

    @strawberry.mutation(description="Agrega uno o más pedidos a una carga Creada (HU4.3).")
    async def agregar_pedidos_a_carga(
        self, info: Info[Context, None], id_carga: int, id_pedidos: list[int]
    ) -> CargaType:
        carga = await info.context.cargas.agregar_pedidos(id_carga, id_pedidos)
        return CargaType.from_model(carga)

    @strawberry.mutation(description="Quita un pedido de una carga Creada (HU4.3).")
    async def quitar_pedido_de_carga(
        self, info: Info[Context, None], id_carga: int, id_pedido: int
    ) -> CargaType:
        carga = await info.context.cargas.quitar_pedido(id_carga, id_pedido)
        return CargaType.from_model(carga)

    @strawberry.mutation(
        description="Confirma la carga validando compatibilidad y capacidad (HU4.1, HU4.2)."
    )
    async def confirmar_carga(self, info: Info[Context, None], id: int) -> CargaType:
        carga = await info.context.cargas.confirmar_carga(id)
        return CargaType.from_model(carga)

    @strawberry.mutation(description="Cancela una carga Creada o Confirmada; libera sus pedidos.")
    async def cancelar_carga(self, info: Info[Context, None], id: int) -> CargaType:
        carga = await info.context.cargas.cancelar_carga(id)
        return CargaType.from_model(carga)
