"""Resolver GraphQL del dashboard; la consulta y sus cálculos viven en service."""

import strawberry
from strawberry.types import Info

from app.core.context import Context
from app.dashboard.inputs import DashboardFiltros
from app.dashboard.types import DashboardType


@strawberry.type
class DashboardQuery:
    @strawberry.field
    async def dashboard(
        self,
        info: Info[Context, None],
        filtros: DashboardFiltros | None = None,
    ) -> DashboardType:
        resumen = await info.context.dashboard.resumen(info.context.usuario, filtros)
        return DashboardType.from_data(resumen)