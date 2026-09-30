"""Tipos GraphQL de entrada de clientes y su traducción a datos del service."""

from decimal import Decimal

import strawberry

from app.clientes.service import DatosCentro, DatosCliente


def _decimal(valor: float) -> Decimal:
    return Decimal(str(valor))


@strawberry.input(description="Datos de un centro de distribución a crear y asociar (HU3.1).")
class CentroNuevoInput:
    direccion: str
    distancia_km: float
    distancia_min: int

    def to_datos(self) -> DatosCentro:
        return DatosCentro(
            direccion=self.direccion,
            distancia_km=_decimal(self.distancia_km),
            distancia_min=self.distancia_min,
        )


@strawberry.input(description="Datos para crear o editar un cliente (HU3.1).")
class ClienteInput:
    razon: str
    rut: str
    direccion: str | None = None
    mail: str | None = None
    telefono: str | None = None
    centros_ids: list[int] | None = None
    centros_nuevos: list[CentroNuevoInput] | None = None

    def to_datos(self) -> DatosCliente:
        return DatosCliente(
            razon=self.razon,
            rut=self.rut,
            direccion=self.direccion,
            mail=self.mail,
            telefono=self.telefono,
            centros_ids=self.centros_ids or [],
            centros_nuevos=[c.to_datos() for c in (self.centros_nuevos or [])],
        )


@strawberry.input(description="Filtro de búsqueda de clientes (HU3.1).")
class ClienteFiltros:
    busqueda: str | None = None
