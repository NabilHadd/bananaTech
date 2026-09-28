import strawberry
from strawberry.extensions import MaskErrors
from strawberry.tools import merge_types

from app.core.config import get_settings
from app.core.errors import DomainError
from app.flota.schema import FlotaMutation, FlotaQuery
from app.graphql.extensions import SesionSerializada

# Cada épica aporta su Query y su Mutation; aquí se unen en un solo schema.
Query = merge_types("Query", (FlotaQuery,))
Mutation = merge_types("Mutation", (FlotaMutation,))


def _es_error_interno(error) -> bool:
    # Los DomainError son mensajes para el usuario; cualquier otro error
    # (SQL, bugs) se oculta fuera de debug para no filtrar detalles internos.
    return not isinstance(error.original_error, DomainError)


extensions = [SesionSerializada]
if not get_settings().debug:
    extensions.append(MaskErrors(should_mask_error=_es_error_interno))

schema = strawberry.Schema(query=Query, mutation=Mutation, extensions=extensions)
