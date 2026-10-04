"""Tipos GraphQL de salida de viajes (HU5.1).

Strawberry pasa snake_case a camelCase automáticamente.
"""

from datetime import datetime

import strawberry

from app.cargas.types import CargaType, OcupacionType
from app.conductores.types import ConductorType
from app.flota.service import ORIGEN_VIAJES, EstadoViaje, estado_viaje
from app.flota.types import CamionType
from app.viajes.service import PropuestaViaje, ViajeDetalle


@strawberry.type(name="Viaje")
class ViajeType:
    id: int
    id_conductor: int
    id_camion: int
    id_carga: int
    estado: EstadoViaje
    origen: str
    fecha_inicio: datetime
    fecha_fin: datetime = strawberry.field(description="Término previsto del viaje.")
    fecha_llegada: datetime | None = strawberry.field(
        description="Llegada real al centro; null mientras está en ruta."
    )
    receptor: str | None
    observacion: str | None = strawberry.field(description="Observación de la entrega.")
    fecha_cancelacion: datetime | None

    conductor: ConductorType
    camion: CamionType
    carga: CargaType

    @staticmethod
    def from_detalle(d: ViajeDetalle) -> "ViajeType":
        v = d.viaje
        return ViajeType(
            id=v.id,
            id_conductor=v.id_conductor,
            id_camion=v.id_camion,
            id_carga=v.id_carga,
            estado=estado_viaje(v),
            origen=ORIGEN_VIAJES,
            fecha_inicio=v.fecha_inicio,
            fecha_fin=v.fecha_fin,
            fecha_llegada=v.fecha_llegada,
            receptor=v.receptor,
            observacion=v.observacion,
            fecha_cancelacion=v.fecha_cancelacion,
            conductor=ConductorType.from_evaluado(d.conductor),
            camion=CamionType.from_evaluado(d.camion),
            carga=CargaType.from_model(v.carga),
        )


@strawberry.type(name="PropuestaViaje")
class PropuestaViajeType:
    """Asignación propuesta por el motor (HU5.1); se confirma con `agregarViaje`."""

    carga: CargaType
    camion: CamionType
    conductor: ConductorType
    ocupacion: OcupacionType
    fecha_inicio: datetime
    fecha_fin: datetime

    @staticmethod
    def from_dominio(p: PropuestaViaje) -> "PropuestaViajeType":
        return PropuestaViajeType(
            carga=CargaType.from_model(p.carga),
            camion=CamionType.from_evaluado(p.camion),
            conductor=ConductorType.from_evaluado(p.conductor),
            ocupacion=OcupacionType.from_model(p.ocupacion),
            fecha_inicio=p.fecha_inicio,
            fecha_fin=p.fecha_fin,
        )
