from datetime import datetime

import strawberry

from app.conductores.types import ConductorType
from app.flota.types import CamionType
from app.cargas.types import CargaType

from app.conductores.service import ConductorEvaluado
from app.flota.service import CamionEvaluado

from app.models.viaje import Viaje


@strawberry.type(name="Viaje")
class ViajeType:
    id: int
    id_conductor: int
    id_camion: int
    id_carga: int
    fecha_inicio: datetime
    fecha_fin: datetime
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
            fecha_llegada=v.fecha_llegada,
            receptor=v.receptor,
            observacion=v.observacion,
            conductor=ConductorType.from_evaluado(conductor),
            camion=CamionType.from_evaluado(camion),
            carga=CargaType.from_model(v.carga),
        )
