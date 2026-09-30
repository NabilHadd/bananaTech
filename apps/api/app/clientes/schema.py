"""Queries y mutations de clientes.

Cada resolver sólo traduce: argumentos GraphQL → service → tipo GraphQL.
Las reglas viven en `ClientesService`; sus DomainError llegan al cliente en `errors`.
"""

import strawberry
from strawberry.types import Info

from app.clientes.inputs import CentroNuevoInput, ClienteFiltros, ClienteInput
from app.clientes.types import CentroDistribucionType, ClienteType
from app.core.context import Context


@strawberry.type
class ClientesQuery:
    @strawberry.field(
        description="Listado de clientes con filtro de búsqueda opcional (HU3.1)."
    )
    async def clientes(
        self, info: Info[Context, None], filtros: ClienteFiltros | None = None
    ) -> list[ClienteType]:
        busqueda = filtros.busqueda if filtros else None
        clientes = await info.context.clientes.listar_clientes(busqueda=busqueda)
        return [ClienteType.from_model(c) for c in clientes]

    @strawberry.field(description="Ficha de un cliente; null si no existe (HU3.1).")
    async def cliente(
        self, info: Info[Context, None], id: int
    ) -> ClienteType | None:
        cliente = await info.context.clientes.obtener_cliente(id)
        return ClienteType.from_model(cliente) if cliente else None

    @strawberry.field(
        description="Listado de centros de distribución con filtro de búsqueda opcional (HU3.1)."
    )
    async def centros_distribucion(
        self, info: Info[Context, None], busqueda: str | None = None
    ) -> list[CentroDistribucionType]:
        centros = await info.context.clientes.listar_centros(busqueda=busqueda)
        return [CentroDistribucionType.from_model(c) for c in centros]


@strawberry.type
class ClientesMutation:
    @strawberry.mutation(
        description="Registra un cliente con su dirección y contacto; rechaza RUT inválido o duplicado (HU3.1)."
    )
    async def registrar_cliente(
        self, info: Info[Context, None], input: ClienteInput
    ) -> ClienteType:
        cliente = await info.context.clientes.registrar(input.to_datos())
        return ClienteType.from_model(cliente)

    @strawberry.mutation(
        description="Edita los datos y dirección de un cliente (HU3.1)."
    )
    async def editar_cliente(
        self, info: Info[Context, None], id: int, input: ClienteInput
    ) -> ClienteType:
        cliente = await info.context.clientes.editar(id, input.to_datos())
        return ClienteType.from_model(cliente)

    @strawberry.mutation(
        description="Crea o actualiza un centro de distribución (HU3.1)."
    )
    async def crear_centro_distribucion(
        self, info: Info[Context, None], input: CentroNuevoInput
    ) -> CentroDistribucionType:
        centro = await info.context.clientes.crear_centro(input.to_datos())
        return CentroDistribucionType.from_model(centro)
