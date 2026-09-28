"""Queries y mutations de conductores.

Cada resolver sólo traduce: argumentos GraphQL → service → tipo GraphQL.
Las reglas viven en `ConductoresService`; sus DomainError llegan al cliente en `errors`.
"""

import strawberry
from strawberry.types import Info

from app.conductores.inputs import (
    ConductorFiltros,
    ConductorInput,
    LicenciaInput,
    RegistroConductorInput,
)
from app.conductores.types import (
    ClaseLicenciaType,
    ConductorType,
    HistorialConductorType,
    ResumenPersonalType,
)
from app.core.context import Context


@strawberry.type
class ConductoresQuery:
    @strawberry.field(
        description="Catálogo de clases de licencia y los tipos de camión que habilitan."
    )
    async def clases_licencia(
        self, info: Info[Context, None]
    ) -> list[ClaseLicenciaType]:
        clases = await info.context.conductores.clases_licencia()
        return [ClaseLicenciaType.from_model(c) for c in clases]

    @strawberry.field(description="Panel de personal con filtros combinables (HU2.1).")
    async def conductores(
        self, info: Info[Context, None], filtros: ConductorFiltros | None = None
    ) -> list[ConductorType]:
        f = filtros or ConductorFiltros()
        evaluados = await info.context.conductores.listar_conductores(
            busqueda=f.busqueda, clase=f.clase, estado=f.estado
        )
        return [ConductorType.from_evaluado(e) for e in evaluados]

    @strawberry.field(description="Ficha de un conductor; null si no existe (HU2.1).")
    async def conductor(
        self, info: Info[Context, None], id: int
    ) -> ConductorType | None:
        evaluado = await info.context.conductores.obtener_conductor(id)
        return ConductorType.from_evaluado(evaluado) if evaluado else None

    @strawberry.field(
        description="Indicador disponibles / total del panel de personal (HU2.1)."
    )
    async def resumen_personal(self, info: Info[Context, None]) -> ResumenPersonalType:
        resumen = await info.context.conductores.resumen_personal()
        return ResumenPersonalType.from_dominio(resumen)

    @strawberry.field(description="Viajes del conductor con el total de km (HU2.1).")
    async def historial_conductor(
        self, info: Info[Context, None], id_conductor: int
    ) -> HistorialConductorType:
        historial = await info.context.conductores.historial(id_conductor)
        return HistorialConductorType.from_dominio(historial)


@strawberry.type
class ConductoresMutation:
    @strawberry.mutation(
        description="Registra un conductor con su licencia; rechaza RUT inválido o duplicado (HU2.2)."
    )
    async def registrar_conductor(
        self, info: Info[Context, None], input: RegistroConductorInput
    ) -> ConductorType:
        evaluado = await info.context.conductores.registrar(
            input.to_datos(), input.licencia.to_datos()
        )
        return ConductorType.from_evaluado(evaluado)

    @strawberry.mutation(
        description="Edita los datos personales de un conductor (HU2.2)."
    )
    async def editar_conductor(
        self, info: Info[Context, None], id: int, input: ConductorInput
    ) -> ConductorType:
        evaluado = await info.context.conductores.editar(id, input.to_datos())
        return ConductorType.from_evaluado(evaluado)

    @strawberry.mutation(
        description="Registra una licencia nueva (renovación); la anterior queda en el historial (HU2.2)."
    )
    async def registrar_licencia(
        self, info: Info[Context, None], id_conductor: int, input: LicenciaInput
    ) -> ConductorType:
        evaluado = await info.context.conductores.registrar_licencia(
            id_conductor, input.to_datos()
        )
        return ConductorType.from_evaluado(evaluado)

    @strawberry.mutation(
        description="Baja lógica: el conductor queda INACTIVO y conserva su historial (RNF-06)."
    )
    async def dar_de_baja_conductor(
        self, info: Info[Context, None], id: int
    ) -> ConductorType:
        evaluado = await info.context.conductores.dar_de_baja(id)
        return ConductorType.from_evaluado(evaluado)
