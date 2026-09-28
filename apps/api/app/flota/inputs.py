"""Tipos GraphQL de entrada de la flota y su traducción a datos del service."""

from datetime import date
from decimal import Decimal

import strawberry

from app.flota.service import DatosCamion, DatosDocumento, EstadoCamion
from app.models import DocumentoTipo


def _decimal(valor: float) -> Decimal:
    # Vía str para no arrastrar la imprecisión binaria del float (2.8 → 2.7999…).
    return Decimal(str(valor))


@strawberry.input(description="Filtros combinables del listado de flota (HU1.3).")
class CamionFiltros:
    busqueda: str | None = None
    id_tipo_camion: int | None = None
    estado: EstadoCamion | None = None
    capacidad_min_kg: float | None = None

    def capacidad_min_decimal(self) -> Decimal | None:
        return (
            _decimal(self.capacidad_min_kg)
            if self.capacidad_min_kg is not None
            else None
        )


@strawberry.input(
    description="Datos del formulario de registro / edición de camión (HU1.1)."
)
class CamionInput:
    patente: str
    marca: str
    modelo: str
    anio: int
    id_tipo_camion: int
    peso_max_kg: float
    volumen_max_m3: float
    rendimiento_base_km_l: float
    kilometraje_actual: int

    def to_datos(self) -> DatosCamion:
        return DatosCamion(
            patente=self.patente,
            marca=self.marca,
            modelo=self.modelo,
            anio=self.anio,
            id_tipo_camion=self.id_tipo_camion,
            peso_max_kg=_decimal(self.peso_max_kg),
            volumen_max_m3=_decimal(self.volumen_max_m3),
            rendimiento_base_km_l=_decimal(self.rendimiento_base_km_l),
            kilometraje_actual=self.kilometraje_actual,
        )


@strawberry.input(
    description="Registro o renovación de un documento del camión (HU1.2)."
)
class DocumentoInput:
    tipo: DocumentoTipo
    fecha_emision: date
    fecha_vencimiento: date

    def to_datos(self) -> DatosDocumento:
        return DatosDocumento(
            tipo=self.tipo,
            fecha_emision=self.fecha_emision,
            fecha_vencimiento=self.fecha_vencimiento,
        )


@strawberry.input(
    description="Registro de un camión nuevo: sus datos más los documentos obligatorios."
)
class RegistroCamionInput(CamionInput):
    documentos: list[DocumentoInput]
