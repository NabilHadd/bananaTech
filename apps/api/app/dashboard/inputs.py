import strawberry


@strawberry.input
class DashboardFiltros:
    dias_alerta_documentos: int = 30