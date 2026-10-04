from datetime import datetime
from decimal import Decimal

import strawberry

from app.cargas.types import CargaType
from app.conductores.service import ConductorEvaluado
from app.conductores.types import ConductorType
from app.flota.service import (
    ORIGEN_VIAJES,
    CamionEvaluado,
    EstadoViaje,
    estado_viaje,
)
from app.flota.types import CamionType
from app.models.viaje import Viaje


@strawberry.type(name="Viaje")
class ViajeType:
    id: int
    id_conductor: int
    id_camion: int
    id_carga: int
    fecha_inicio: datetime
    fecha_fin: datetime
    estado: EstadoViaje
    origen: str
    fecha_cancelacion: datetime | None
    fecha_llegada: datetime | None = strawberry.field(
        default=None,
        description = "Llegada real del camion dado un viaje"
    )
    receptor: str | None =strawberry.field(
        default=None,
    )
    observacion: str  |None = strawberry.field(
        default=None,
        description="Observación en torno al viaje."
    )
    precio_diesel_clp_litro: float | None
    tarifa_peajes_clp_km: float | None
    costo_operacion_clp_km: float | None
    viatico_diario_clp: float | None
    tarifa_venta_clp_ton_km: float | None
    costo_diesel_clp: float | None
    costo_peajes_clp: float | None
    costo_operacion_clp: float | None
    costo_viatico_clp: float | None
    ingreso_total_clp: float | None
    margen_clp: float | None
    margen_porcentaje: float | None

    conductor: ConductorType
    camion: CamionType
    carga: CargaType


    @staticmethod
    def from_model(
        v: Viaje,
        conductor: ConductorEvaluado,
        camion: CamionEvaluado,
    ) -> "ViajeType":
        return ViajeType(
            id=v.id,
            id_conductor=v.id_conductor,
            id_camion=v.id_camion,
            id_carga=v.id_carga,
            fecha_inicio=v.fecha_inicio,
            fecha_fin=v.fecha_fin,
            estado=estado_viaje(v),
            origen=ORIGEN_VIAJES,
            fecha_cancelacion=v.fecha_cancelacion,
            fecha_llegada=v.fecha_llegada,
            receptor=v.receptor,
            observacion=v.observacion,
            precio_diesel_clp_litro=_float(v.precio_diesel_clp_litro),
            tarifa_peajes_clp_km=_float(v.tarifa_peajes_clp_km),
            costo_operacion_clp_km=_float(v.costo_operacion_clp_km),
            viatico_diario_clp=_float(v.viatico_diario_clp),
            tarifa_venta_clp_ton_km=_float(v.tarifa_venta_clp_ton_km),
            costo_diesel_clp=_float(v.costo_diesel_clp),
            costo_peajes_clp=_float(v.costo_peajes_clp),
            costo_operacion_clp=_float(v.costo_operacion_clp),
            costo_viatico_clp=_float(v.costo_viatico_clp),
            ingreso_total_clp=_float(v.ingreso_total_clp),
            margen_clp=_float(v.margen_clp),
            margen_porcentaje=_float(v.margen_porcentaje),
            conductor=ConductorType.from_evaluado(conductor),
            camion=CamionType.from_evaluado(camion),
            carga=CargaType.from_model(v.carga),
        )


def _float(valor: Decimal | None) -> float | None:
    return float(valor) if valor is not None else None
