"""Tipos GraphQL de salida de clientes.

Calcan `apps/web/src/components/features/clientes/types.ts`. Strawberry pasa
los snake_case a camelCase automáticamente.
"""

import strawberry

from app.models import CentroDistribucion, Cliente


@strawberry.type(name="CentroDistribucion")
class CentroDistribucionType:
    id: int
    direccion: str
    distancia_km: float = strawberry.field(
        description="Distancia en kilómetros desde la base de Coquimbo."
    )
    distancia_min: int = strawberry.field(
        description="Tiempo estimado de viaje en minutos desde la base de Coquimbo."
    )

    @staticmethod
    def from_model(centro: CentroDistribucion) -> "CentroDistribucionType":
        return CentroDistribucionType(
            id=centro.id,
            direccion=centro.direccion,
            distancia_km=float(centro.distancia_km),
            distancia_min=centro.distancia_min,
        )


@strawberry.type(name="Cliente")
class ClienteType:
    id: int
    razon: str
    rut: str
    direccion: str | None
    mail: str | None
    telefono: str | None
    centros: list[CentroDistribucionType]

    @staticmethod
    def from_model(cliente: Cliente) -> "ClienteType":
        return ClienteType(
            id=cliente.id,
            razon=cliente.razon,
            rut=cliente.rut,
            direccion=cliente.direccion,
            mail=cliente.mail,
            telefono=cliente.telefono,
            centros=[
                CentroDistribucionType.from_model(c)
                for c in (cliente.centros or [])
            ],
        )
