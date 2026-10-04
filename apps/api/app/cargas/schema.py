"""Queries y mutations de cargas (HU4.1–4.3)."""

import strawberry
from strawberry.types import Info

from app.cargas.inputs import (
    AgregarPedidosCargaInput,
    CargaIdInput,
    CrearCargaInput,
    OcupacionCargaInput,
    QuitarPedidoCargaInput,
)
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
        input = OcupacionCargaInput(id_carga=id_carga, id_camion=id_camion)
        o = await info.context.cargas.ocupacion(input.id_carga, input.id_camion)
        return OcupacionType.from_model(o)


@strawberry.type
class CargasMutation:
    @strawberry.mutation(description="Crea una carga agrupando pedidos Creada (HU4.1).")
    async def crear_carga(
        self, info: Info[Context, None], id_pedidos: list[int]
    ) -> CargaType:
        input = CrearCargaInput(id_pedidos=id_pedidos)
        carga = await info.context.cargas.crear_carga(input.id_pedidos)
        return CargaType.from_model(carga)

    @strawberry.mutation(description="Agrega uno o más pedidos a una carga Creada (HU4.3).")
    async def agregar_pedidos_a_carga(
        self, info: Info[Context, None], id_carga: int, id_pedidos: list[int]
    ) -> CargaType:
        input = AgregarPedidosCargaInput(id_carga=id_carga, id_pedidos=id_pedidos)
        carga = await info.context.cargas.agregar_pedidos(input.id_carga, input.id_pedidos)
        return CargaType.from_model(carga)

    @strawberry.mutation(description="Quita un pedido de una carga Creada (HU4.3).")
    async def quitar_pedido_de_carga(
        self, info: Info[Context, None], id_carga: int, id_pedido: int
    ) -> CargaType:
        input = QuitarPedidoCargaInput(id_carga=id_carga, id_pedido=id_pedido)
        carga = await info.context.cargas.quitar_pedido(input.id_carga, input.id_pedido)
        return CargaType.from_model(carga)

    @strawberry.mutation(
        description="Confirma la carga validando compatibilidad y capacidad (HU4.1, HU4.2)."
    )
    async def confirmar_carga(self, info: Info[Context, None], id: int) -> CargaType:
        input = CargaIdInput(id=id)
        carga = await info.context.cargas.confirmar_carga(input.id)
        return CargaType.from_model(carga)

    @strawberry.mutation(description="Cancela una carga Creada o Confirmada; libera sus pedidos.")
    async def cancelar_carga(self, info: Info[Context, None], id: int) -> CargaType:
        input = CargaIdInput(id=id)
        carga = await info.context.cargas.cancelar_carga(input.id)
        return CargaType.from_model(carga)
