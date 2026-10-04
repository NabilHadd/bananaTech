from datetime import datetime

import strawberry

from app.flota.service import EstadoViaje


@strawberry.input
class ViajeFiltros:
	estado: EstadoViaje | None = None


@strawberry.input
class ViajeInput:
	id_carga: int
	id_camion: int
	id_conductor: int


@strawberry.input
class LlegadaInput:
	fecha_llegada: datetime
	receptor: str
	observacion: str | None = None
