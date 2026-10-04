from dataclasses import dataclass
from datetime import datetime, timedelta
from decimal import Decimal

from sqlmodel.ext.asyncio.session import AsyncSession

from app.cargas.service import CargasService, Ocupacion, incompatibilidad
from app.conductores.service import (
	ConductoresService,
	ConductorEvaluado,
	EstadoConductor,
)
from app.core import tiempo
from app.core.config import get_settings
from app.core.errors import DomainError
from app.flota.service import (
	CamionEvaluado,
	EstadoCamion,
	EstadoViaje,
	FlotaService,
	estado_viaje,
)
from app.models import CargaEstado, Viaje
from app.models.pedido import Carga
from app.viajes.economia import (
	CostosEstimados,
	calcular_ingreso,
	calcular_margen,
	estimar_costos,
)
from app.viajes.repository import ViajeRepository


@dataclass
class Propuesta:
	carga: Carga
	camion: CamionEvaluado
	conductor: ConductorEvaluado
	ocupacion: Ocupacion
	fecha_inicio: datetime
	fecha_fin: datetime


class ViajesService:
	def __init__(
		self,
		session: AsyncSession,
		viajes: ViajeRepository,
		cargas: CargasService,
		flota: FlotaService,
		conductores: ConductoresService,
	) -> None:
		self.session = session
		self.viajes = viajes
		self.cargas = cargas
		self.flota = flota
		self.conductores = conductores

	async def listar(self, estado: EstadoViaje | None = None) -> list[Viaje]:
		viajes = await self.viajes.listar()
		if estado is not None:
			viajes = [v for v in viajes if estado_viaje(v) == estado]
		return viajes

	async def camiones_para_viaje(
		self, id_carga: int, id_conductor: int | None = None
	) -> list[CamionEvaluado]:
		carga = await self._carga_confirmada(id_carga)
		self._validar_compatibilidad(carga)
		_, fin = self._fechas_viaje(carga)
		conductor = None
		if id_conductor is not None:
			conductor = await self.conductores.obtener_conductor(id_conductor)
			if conductor is None:
				raise DomainError(f"No existe un conductor con id {id_conductor}.")

		candidatas = await self.flota.listar_camiones(estado=EstadoCamion.DISPONIBLE)
		viables = []
		for camion in candidatas:
			try:
				self.cargas.validar_capacidad(carga.pedidos, camion.camion)
				if conductor is not None:
					await self.conductores.verificar_asignable(
						conductor.conductor.id,
						camion.camion.id_tipo_camion,
						hasta=fin.date(),
					)
			except DomainError:
				continue
			viables.append(camion)
		return viables

	async def conductores_para_viaje(
		self, id_carga: int, id_camion: int | None = None
	) -> list[ConductorEvaluado]:
		carga = await self._carga_confirmada(id_carga)
		self._validar_compatibilidad(carga)
		_, fin = self._fechas_viaje(carga)
		camiones: list[CamionEvaluado]
		if id_camion is not None:
			evaluado = await self.flota.obtener_camion(id_camion)
			if evaluado is None:
				raise DomainError(f"No existe un camión con id {id_camion}.")
			self.cargas.validar_capacidad(carga.pedidos, evaluado.camion)
			if evaluado.estado != EstadoCamion.DISPONIBLE:
				return []
			camiones = [evaluado]
		else:
			camiones = await self.camiones_para_viaje(id_carga)

		candidatos = await self.conductores.listar_conductores(
			estado=EstadoConductor.DISPONIBLE
		)
		viables = []
		for conductor in candidatos:
			for camion in camiones:
				try:
					await self.conductores.verificar_asignable(
						conductor.conductor.id,
						camion.camion.id_tipo_camion,
						hasta=fin.date(),
					)
				except DomainError:
					continue
				viables.append(conductor)
				break
		return viables

	async def proponer(self, id_carga: int) -> Propuesta:
		carga = await self._carga_confirmada(id_carga)
		self._validar_compatibilidad(carga)
		inicio, fin = self._fechas_viaje(carga)
		camiones = await self.camiones_para_viaje(id_carga)
		for camion in camiones:
			conductores = await self.conductores_para_viaje(
				id_carga, camion.camion.id
			)
			if conductores:
				ocupacion = self.cargas.calcular_ocupacion(
					carga.pedidos, camion.camion
				)
				return Propuesta(
					carga=carga,
					camion=camion,
					conductor=conductores[0],
					ocupacion=ocupacion,
					fecha_inicio=inicio,
					fecha_fin=fin,
				)
		raise DomainError(
			f"No hay una combinación disponible de camión y conductor para la carga #{id_carga}."
		)

	async def agregar(self, id_carga: int, id_camion: int, id_conductor: int) -> Viaje:
		carga = await self._carga_confirmada(id_carga)
		self._validar_compatibilidad(carga)
		camion = await self.flota.verificar_asignable(id_camion)
		self.cargas.validar_capacidad(carga.pedidos, camion)
		inicio, fin = self._fechas_viaje(carga)
		conductor = await self.conductores.verificar_asignable(
			id_conductor, camion.id_tipo_camion, hasta=fin.date()
		)
		settings = get_settings()
		costos = estimar_costos(
			carga.centro.distancia_km,
			camion.rendimiento_base_km_l,
			settings.precio_diesel_clp_litro,
			settings.tarifa_peajes_clp_km,
			settings.costo_operacion_clp_km,
		)

		viaje = Viaje(
			id_carga=id_carga,
			id_camion=camion.id,
			id_conductor=conductor.id,
			fecha_inicio=inicio,
			fecha_fin=fin,
			precio_diesel_clp_litro=settings.precio_diesel_clp_litro,
			tarifa_peajes_clp_km=settings.tarifa_peajes_clp_km,
			costo_operacion_clp_km=settings.costo_operacion_clp_km,
			tarifa_venta_clp_ton_km=settings.tarifa_venta_clp_ton_km,
			costo_diesel_clp=costos.costo_diesel_clp,
			costo_peajes_clp=costos.costo_peajes_clp,
			costo_operacion_clp=costos.costo_operacion_clp,
		)
		await self.viajes.agregar(viaje)
		await self.session.flush()
		self.cargas.al_iniciar_viaje(carga)
		await self.session.commit()
		return await self._viaje_existente(viaje.id)

	async def finalizar(self, id: int, fecha_llegada: datetime, receptor: str, observacion: str | None) -> Viaje:
		viaje = await self._viaje_existente(id)
		if estado_viaje(viaje) != EstadoViaje.EN_RUTA:
			raise DomainError("Sólo se puede finalizar un viaje que está En ruta.")
		if fecha_llegada < viaje.fecha_inicio:
			raise DomainError("La fecha de llegada no puede ser anterior al inicio del viaje.")
		if not receptor.strip():
			raise DomainError("El nombre de quien recibe es obligatorio.")
		viaje.fecha_llegada = fecha_llegada
		viaje.receptor = receptor.strip()
		viaje.observacion = observacion.strip() if observacion and observacion.strip() else None
		if viaje.precio_diesel_clp_litro is None:
			settings = get_settings()
			viaje.precio_diesel_clp_litro = settings.precio_diesel_clp_litro
			viaje.tarifa_peajes_clp_km = settings.tarifa_peajes_clp_km
			viaje.costo_operacion_clp_km = settings.costo_operacion_clp_km
			viaje.tarifa_venta_clp_ton_km = settings.tarifa_venta_clp_ton_km
		if viaje.costo_diesel_clp is None:
			costos_estimados = estimar_costos(
				viaje.carga.centro.distancia_km,
				viaje.camion.rendimiento_base_km_l,
				viaje.precio_diesel_clp_litro,
				viaje.tarifa_peajes_clp_km,
				viaje.costo_operacion_clp_km,
			)
			viaje.costo_diesel_clp = costos_estimados.costo_diesel_clp
			viaje.costo_peajes_clp = costos_estimados.costo_peajes_clp
			viaje.costo_operacion_clp = costos_estimados.costo_operacion_clp
		ingreso = calcular_ingreso(
			sum((pedido.peso_kg for pedido in viaje.carga.pedidos), Decimal(0)),
			viaje.carga.centro.distancia_km,
			viaje.tarifa_venta_clp_ton_km,
		)
		viaje.ingreso_total_clp = ingreso
		viaje.margen_clp, viaje.margen_porcentaje = calcular_margen(
			ingreso,
			CostosEstimados(
				viaje.costo_diesel_clp,
				viaje.costo_peajes_clp,
				viaje.costo_operacion_clp,
			),
		)
		self.cargas.al_finalizar_viaje(viaje.carga)
		await self.session.commit()
		return await self._viaje_existente(id)

	async def cancelar(self, id: int) -> Viaje:
		viaje = await self._viaje_existente(id)
		if estado_viaje(viaje) != EstadoViaje.EN_RUTA:
			raise DomainError("Sólo se puede cancelar un viaje que está En ruta.")
		viaje.fecha_cancelacion = tiempo.ahora()
		self.cargas.al_cancelar_viaje(viaje.carga)
		await self.session.commit()
		return await self._viaje_existente(id)

	async def _carga_confirmada(self, id: int) -> Carga:
		carga = await self.cargas.obtener_carga(id)
		if carga is None:
			raise DomainError(f"No existe la carga #{id}.")
		if carga.estado != CargaEstado.CONFIRMADA:
			raise DomainError("Sólo una carga Confirmada puede salir en un viaje.")
		return carga

	async def _viaje_existente(self, id: int) -> Viaje:
		viaje = await self.viajes.obtener(id)
		if viaje is None:
			raise DomainError(f"No existe el viaje #{id}.")
		return viaje

	@staticmethod
	def _validar_compatibilidad(carga: Carga) -> None:
		motivo = incompatibilidad(carga.pedidos)
		if motivo:
			raise DomainError(motivo)

	@staticmethod
	def _fechas_viaje(carga: Carga) -> tuple[datetime, datetime]:
		inicio = tiempo.ahora()
		duracion = timedelta(minutes=carga.centro.distancia_min)
		return inicio, inicio + duracion
