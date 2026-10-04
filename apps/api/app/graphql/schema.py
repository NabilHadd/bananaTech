import strawberry
from strawberry.extensions import MaskErrors
from strawberry.tools import merge_types

from app.admin.schema import AdministracionMutation, AdministracionQuery
from app.cargas.schema import CargasMutation, CargasQuery
from app.clientes.schema import ClientesMutation, ClientesQuery
from app.conductores.schema import ConductoresMutation, ConductoresQuery
from app.core.config import get_settings
from app.core.errors import DomainError
from app.dashboard.schema import DashboardQuery
from app.flota.schema import FlotaMutation, FlotaQuery
from app.graphql.extensions import SesionSerializada
from app.pedidos.schema import PedidosMutation, PedidosQuery
from app.viajes.schema import ViajesMutation, ViajesQuery

# Cada épica aporta su Query y su Mutation; aquí se unen en un solo schema.
Query = merge_types(
    "Query", (FlotaQuery, ConductoresQuery, ClientesQuery, PedidosQuery, CargasQuery, ViajesQuery, AdministracionQuery, DashboardQuery)
)
Mutation = merge_types(
    "Mutation",
    (FlotaMutation, ConductoresMutation, ClientesMutation, PedidosMutation, CargasMutation, ViajesMutation, AdministracionMutation),
)


def _es_error_interno(error) -> bool:
    # Los DomainError son mensajes para el usuario; cualquier otro error
    # (SQL, bugs) se oculta fuera de debug para no filtrar detalles internos.
    return not isinstance(error.original_error, DomainError)


extensions = [SesionSerializada]
if not get_settings().debug:
    extensions.append(MaskErrors(should_mask_error=_es_error_interno))

schema = strawberry.Schema(query=Query, mutation=Mutation, extensions=extensions)
