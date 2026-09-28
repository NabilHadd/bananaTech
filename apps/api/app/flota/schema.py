"""Queries y mutations de la flota.

Cada resolver sólo traduce: argumentos GraphQL → service → tipo GraphQL.
Las reglas viven en `FlotaService`; sus DomainError llegan al cliente en `errors`.
"""

import strawberry
from strawberry.types import Info

from app.core.context import Context
from app.flota.inputs import (
    CamionFiltros,
    CamionInput,
    DocumentoInput,
    RegistroCamionInput,
)
from app.flota.types import CamionType, HistorialCamionType, TipoCamionType


@strawberry.type
class FlotaQuery:
    @strawberry.field(description="Catálogo de tipos de camión.")
    async def tipos_camion(self, info: Info[Context, None]) -> list[TipoCamionType]:
        tipos = await info.context.flota.tipos_camion()
        return [TipoCamionType.from_model(t) for t in tipos]

    @strawberry.field(
        description="Listado de la flota con filtros combinables (HU1.3)."
    )
    async def camiones(
        self, info: Info[Context, None], filtros: CamionFiltros | None = None
    ) -> list[CamionType]:
        f = filtros or CamionFiltros()
        evaluados = await info.context.flota.listar_camiones(
            busqueda=f.busqueda,
            id_tipo_camion=f.id_tipo_camion,
            estado=f.estado,
            capacidad_min_kg=f.capacidad_min_decimal(),
        )
        return [CamionType.from_evaluado(e) for e in evaluados]

    @strawberry.field(description="Ficha de un camión; null si no existe (HU1.3).")
    async def camion(self, info: Info[Context, None], id: int) -> CamionType | None:
        evaluado = await info.context.flota.obtener_camion(id)
        return CamionType.from_evaluado(evaluado) if evaluado else None

    @strawberry.field(description="Viajes del camión con totales de km y kg (HU1.3).")
    async def historial_camion(
        self, info: Info[Context, None], id_camion: int
    ) -> HistorialCamionType:
        historial = await info.context.flota.historial(id_camion)
        return HistorialCamionType.from_dominio(historial)


@strawberry.type
class FlotaMutation:
    @strawberry.mutation(
        description="Registra un camión con RT, PC y SOAP vigentes; queda DISPONIBLE (HU1.1)."
    )
    async def registrar_camion(
        self, info: Info[Context, None], input: RegistroCamionInput
    ) -> CamionType:
        evaluado = await info.context.flota.registrar(
            input.to_datos(), [d.to_datos() for d in input.documentos]
        )
        return CamionType.from_evaluado(evaluado)

    @strawberry.mutation(description="Edita los datos técnicos de un camión (HU1.1).")
    async def editar_camion(
        self, info: Info[Context, None], id: int, input: CamionInput
    ) -> CamionType:
        evaluado = await info.context.flota.editar(id, input.to_datos())
        return CamionType.from_evaluado(evaluado)

    @strawberry.mutation(description="Baja lógica: el camión queda INACTIVO (HU1.1).")
    async def dar_de_baja_camion(
        self, info: Info[Context, None], id: int
    ) -> CamionType:
        evaluado = await info.context.flota.dar_de_baja(id)
        return CamionType.from_evaluado(evaluado)

    @strawberry.mutation(
        description="Registra un documento o renueva el existente del mismo tipo (HU1.2)."
    )
    async def registrar_documento(
        self, info: Info[Context, None], id_camion: int, input: DocumentoInput
    ) -> CamionType:
        evaluado = await info.context.flota.registrar_documento(
            id_camion, input.to_datos()
        )
        return CamionType.from_evaluado(evaluado)
