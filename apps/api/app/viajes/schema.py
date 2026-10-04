"""Queries y mutations de viajes (HU5.1–5.3)."""

from datetime import datetime

import strawberry
from strawberry.types import Info

from app.cargas.types import CargaType, OcupacionType
from app.conductores.types import ConductorType
from app.core.context import Context
from app.flota.types import CamionType
from app.viajes.inputs import LlegadaInput, ViajeFiltros, ViajeInput
from app.viajes.service import Propuesta
from app.viajes.types import ViajeType


@strawberry.type(name="PropuestaViaje")
class PropuestaViajeType:
	carga: CargaType
	camion: CamionType
	conductor: ConductorType
	ocupacion: OcupacionType
	fecha_inicio: datetime
	fecha_fin: datetime

	@staticmethod
	def from_dominio(propuesta: Propuesta) -> "PropuestaViajeType":
		return PropuestaViajeType(
			carga=CargaType.from_model(propuesta.carga),
			camion=CamionType.from_evaluado(propuesta.camion),
			conductor=ConductorType.from_evaluado(propuesta.conductor),
			ocupacion=OcupacionType.from_model(propuesta.ocupacion),
			fecha_inicio=propuesta.fecha_inicio,
			fecha_fin=propuesta.fecha_fin,
		)


async def _tipo_viaje(info: Info[Context, None], viaje) -> ViajeType:
	conductor = await info.context.conductores.obtener_conductor(viaje.id_conductor)
	camion = await info.context.flota.obtener_camion(viaje.id_camion)
	return ViajeType.from_model(viaje, conductor, camion)


@strawberry.type
class ViajesQuery:
	@strawberry.field(description="Listado de viajes, opcionalmente por estado.")
	async def viajes(
		self, info: Info[Context, None], filtros: ViajeFiltros | None = None
	) -> list[ViajeType]:
		estado = filtros.estado if filtros else None
		viajes = await info.context.viajes.listar(estado=estado)
		return [await _tipo_viaje(info, viaje) for viaje in viajes]

	@strawberry.field
	async def camiones_para_viaje(
		self, info: Info[Context, None], id_carga: int, id_conductor: int | None = None
	) -> list[CamionType]:
		camiones = await info.context.viajes.camiones_para_viaje(id_carga, id_conductor)
		return [CamionType.from_evaluado(camion) for camion in camiones]

	@strawberry.field
	async def conductores_para_viaje(
		self, info: Info[Context, None], id_carga: int, id_camion: int | None = None
	) -> list[ConductorType]:
		conductores = await info.context.viajes.conductores_para_viaje(id_carga, id_camion)
		return [ConductorType.from_evaluado(conductor) for conductor in conductores]

	@strawberry.field(description="Propone una asignación compatible para una carga.")
	async def proponer_viaje(
		self, info: Info[Context, None], id_carga: int
	) -> PropuestaViajeType:
		propuesta = await info.context.viajes.proponer(id_carga)
		return PropuestaViajeType.from_dominio(propuesta)


@strawberry.type
class ViajesMutation:
	@strawberry.mutation
	async def agregar_viaje(
		self, info: Info[Context, None], input: ViajeInput
	) -> ViajeType:
		viaje = await info.context.viajes.agregar(
			input.id_carga, input.id_camion, input.id_conductor
		)
		return await _tipo_viaje(info, viaje)

	@strawberry.mutation
	async def finalizar_viaje(
		self, info: Info[Context, None], id: int, input: LlegadaInput
	) -> ViajeType:
		viaje = await info.context.viajes.finalizar(
			id, input.fecha_llegada, input.receptor, input.observacion
		)
		return await _tipo_viaje(info, viaje)

	@strawberry.mutation
	async def cancelar_viaje(self, info: Info[Context, None], id: int) -> ViajeType:
		viaje = await info.context.viajes.cancelar(id)
		return await _tipo_viaje(info, viaje)
