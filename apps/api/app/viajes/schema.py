"""Queries y mutations de viajes (HU5.1).

Cada resolver sólo traduce: argumentos GraphQL → service → tipo GraphQL.
Las reglas viven en `ViajesService`; sus DomainError llegan al cliente en `errors`.
"""

import strawberry
from strawberry.types import Info

from app.conductores.types import ConductorType
from app.core.context import Context
from app.flota.types import CamionType
from app.viajes.inputs import LlegadaInput, ViajeFiltros, ViajeInput
from app.viajes.types import PropuestaViajeType, ViajeType


@strawberry.type
class ViajesQuery:
    @strawberry.field(description="Listado de viajes, el más reciente primero.")
    async def viajes(
        self, info: Info[Context, None], filtros: ViajeFiltros | None = None
    ) -> list[ViajeType]:
        f = filtros or ViajeFiltros()
        detalles = await info.context.viajes.listar_viajes(estado=f.estado)
        return [ViajeType.from_detalle(d) for d in detalles]

    @strawberry.field(description="Ficha de un viaje; null si no existe.")
    async def viaje(self, info: Info[Context, None], id: int) -> ViajeType | None:
        d = await info.context.viajes.obtener_viaje(id)
        return ViajeType.from_detalle(d) if d else None

    @strawberry.field(
        description=(
            "Camiones que pueden llevar una carga Confirmada, del que mejor se llena "
            "al que menos. Con idConductor, sólo los que su licencia habilita (HU5.1)."
        )
    )
    async def camiones_para_viaje(
        self, info: Info[Context, None], id_carga: int, id_conductor: int | None = None
    ) -> list[CamionType]:
        evaluados = await info.context.viajes.camiones_disponibles(id_carga, id_conductor)
        return [CamionType.from_evaluado(e) for e in evaluados]

    @strawberry.field(
        description=(
            "Conductores que pueden hacer el viaje de una carga Confirmada. "
            "Con idCamion, sólo los habilitados para ese camión (HU5.1)."
        )
    )
    async def conductores_para_viaje(
        self, info: Info[Context, None], id_carga: int, id_camion: int | None = None
    ) -> list[ConductorType]:
        evaluados = await info.context.viajes.conductores_disponibles(id_carga, id_camion)
        return [ConductorType.from_evaluado(e) for e in evaluados]

    @strawberry.field(
        description=(
            "Motor de asignación: propone camión y conductor para la carga, sin "
            "guardar nada. Si no hay combinación posible, el error explica la causa (HU5.1)."
        )
    )
    async def proponer_viaje(
        self, info: Info[Context, None], id_carga: int
    ) -> PropuestaViajeType:
        propuesta = await info.context.viajes.proponer_viaje(id_carga)
        return PropuestaViajeType.from_dominio(propuesta)


@strawberry.type
class ViajesMutation:
    @strawberry.mutation(
        description=(
            "Genera y arranca un viaje: la carga queda En ruta y sus pedidos En "
            "tránsito. Sirve para la propuesta del motor y para el armado a mano (HU5.1)."
        )
    )
    async def agregar_viaje(self, info: Info[Context, None], input: ViajeInput) -> ViajeType:
        d = await info.context.viajes.agregar_viaje(input.to_datos())
        return ViajeType.from_detalle(d)

    @strawberry.mutation(
        description=(
            "Registra la llegada de un viaje en ruta: la carga queda Finalizada, sus "
            "pedidos Entregado y el camión suma la distancia a su kilometraje (HU5.2)."
        )
    )
    async def finalizar_viaje(
        self, info: Info[Context, None], id: int, input: LlegadaInput
    ) -> ViajeType:
        d = await info.context.viajes.finalizar_viaje(id, input.to_datos())
        return ViajeType.from_detalle(d)

    @strawberry.mutation(
        description=(
            "Cancela un viaje en ruta: camión y conductor quedan libres y la carga "
            "vuelve a Confirmada para salir en otro viaje (HU5.3)."
        )
    )
    async def cancelar_viaje(self, info: Info[Context, None], id: int) -> ViajeType:
        d = await info.context.viajes.cancelar_viaje(id)
        return ViajeType.from_detalle(d)
