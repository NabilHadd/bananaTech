"""Tipos GraphQL de entrada de viajes y su traducción a datos del service."""

from datetime import datetime

import strawberry

from app.flota.service import EstadoViaje
from app.viajes.service import DatosLlegada, DatosViaje


@strawberry.input(description="Filtros del listado de viajes.")
class ViajeFiltros:
    estado: EstadoViaje | None = None


@strawberry.input(
    description=(
        "Carga, camión y conductor de un viaje nuevo (HU5.1). Vienen de la "
        "propuesta del motor o del armado a mano."
    )
)
class ViajeInput:
    id_carga: int
    id_camion: int
    id_conductor: int

    def to_datos(self) -> DatosViaje:
        return DatosViaje(
            id_carga=self.id_carga,
            id_camion=self.id_camion,
            id_conductor=self.id_conductor,
        )


@strawberry.input(description="Datos de la llegada al centro, al finalizar el viaje (HU5.2).")
class LlegadaInput:
    fecha_llegada: datetime
    receptor: str
    observacion: str | None = None

    def to_datos(self) -> DatosLlegada:
        return DatosLlegada(
            fecha_llegada=self.fecha_llegada,
            receptor=self.receptor,
            observacion=self.observacion,
        )
