"""Reglas de negocio de los viajes (HU5.1–5.4).

Un viaje une una carga Confirmada con un camión y un conductor. Se genera y
arranca en el mismo paso, sin estado "Planificado": la carga pasa a En ruta y
sus pedidos a En tránsito dentro de la misma transacción.

Camión y conductor se limitan entre sí: la carga decide qué camiones sirven
(capacidad) y el tipo de cada camión decide qué conductores pueden llevarlo
(licencia, RN-04). Las consultas aceptan la otra mitad del par ya elegida para
que el front pueda armar el viaje empezando por cualquiera de las dos, y sin
ella sólo devuelven opciones que tengan al menos una pareja posible.

Al generarse, el viaje copia las tarifas vigentes y estima sus costos; al
finalizar, calcula el ingreso y el margen (H5.4).

No conoce GraphQL: recibe y devuelve objetos de Python. Es la única capa que
hace commit, así que cada método público es una operación completa.
"""

from dataclasses import dataclass
from datetime import datetime, timedelta
from decimal import ROUND_HALF_UP, Decimal

from sqlalchemy.exc import IntegrityError
from sqlmodel.ext.asyncio.session import AsyncSession

from app.cargas.service import CargasService, Ocupacion, totales
from app.clientes.service import validar_destino
from app.conductores.service import (
    ConductoresService,
    ConductorEvaluado,
    EstadoConductor,
    motivo_no_asignable,
)
from app.core import tiempo
from app.core.errors import DomainError
from app.core.parameters import leer_parametro
from app.flota.service import (
    CamionEvaluado,
    EstadoCamion,
    EstadoViaje,
    FlotaService,
    estado_viaje,
)
from app.models import Camion, Carga, CargaEstado, Viaje
from app.viajes.economia import (
    CostosEstimados,
    calcular_ingreso,
    calcular_margen,
    estimar_costos,
)
from app.viajes.repository import ViajeRepository

# Parámetros (HU7.2) que el viaje copia al generarse: cambiarlos después no
# altera los costos de viajes ya generados.
TARIFAS = (
    "precio_diesel_clp_litro",
    "tarifa_peajes_clp_km",
    "costo_operacion_clp_km",
    "viatico_diario_clp",
    "tarifa_venta_clp_ton_km",
)

# ── Datos de entrada ─────────────────────────────────────────────────────────


@dataclass
class DatosViaje:
    id_carga: int
    id_camion: int
    id_conductor: int


@dataclass
class DatosLlegada:
    fecha_llegada: datetime
    receptor: str
    observacion: str | None


# ── Datos de salida ──────────────────────────────────────────────────────────


@dataclass
class ViajeDetalle:
    """Un viaje con su camión y su conductor evaluados, como los muestra el front."""

    viaje: Viaje
    camion: CamionEvaluado
    conductor: ConductorEvaluado


@dataclass
class PropuestaViaje:
    """Lo que propone el motor de asignación (HU5.1). No se guarda: el front
    la muestra y, si se acepta, la confirma con `agregar_viaje`."""

    carga: Carga
    camion: CamionEvaluado
    conductor: ConductorEvaluado
    ocupacion: Ocupacion
    fecha_inicio: datetime
    fecha_fin: datetime


# ── Service ──────────────────────────────────────────────────────────────────


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

    # ── Consultas ────────────────────────────────────────────────────────────

    async def listar_viajes(
        self, *, estado: EstadoViaje | None = None
    ) -> list[ViajeDetalle]:
        viajes = await self.viajes.listar()
        # El estado del viaje se calcula, así que se filtra después de leer.
        if estado is not None:
            viajes = [v for v in viajes if estado_viaje(v) == estado]
        # Se evalúa la flota y el personal una vez, no un camión y un
        # conductor por viaje.
        camiones = {e.camion.id: e for e in await self.flota.listar_camiones()}
        conductores = {
            e.conductor.id: e for e in await self.conductores.listar_conductores()
        }
        return [
            ViajeDetalle(v, camiones[v.id_camion], conductores[v.id_conductor])
            for v in viajes
        ]

    async def obtener_viaje(self, id: int) -> ViajeDetalle | None:
        viaje = await self.viajes.obtener(id)
        return await self._detalle(viaje) if viaje else None

    async def camiones_disponibles(
        self, id_carga: int, id_conductor: int | None = None
    ) -> list[CamionEvaluado]:
        """Camiones que pueden llevar la carga, del que mejor se llena al que menos.

        Con `id_conductor`, sólo los que su licencia habilita. Sin él, sólo los
        que algún conductor disponible puede llevar. Vacía si no hay ninguno.
        """
        carga = await self._carga_confirmada(id_carga)
        fin = self._horario(carga)[1]
        camiones = await self._camiones_aptos(carga)
        if id_conductor is not None:
            conductores = [await self._conductor_disponible(id_conductor)]
        else:
            conductores = await self._conductores_disponibles()
        return [
            c
            for c in camiones
            if any(_compatibles(d, c.camion, fin) for d in conductores)
        ]

    async def conductores_disponibles(
        self, id_carga: int, id_camion: int | None = None
    ) -> list[ConductorEvaluado]:
        """Conductores que pueden hacer el viaje de la carga.

        Con `id_camion`, sólo los habilitados para ese camión. Sin él, sólo los
        habilitados para algún camión apto. Vacía si no hay ninguno.
        """
        carga = await self._carga_confirmada(id_carga)
        fin = self._horario(carga)[1]
        if id_camion is not None:
            camiones = [await self._camion_asignable(carga, id_camion)]
        else:
            camiones = [e.camion for e in await self._camiones_aptos(carga)]
        return [
            d
            for d in await self._conductores_disponibles()
            if any(_compatibles(d, c, fin) for c in camiones)
        ]

    async def proponer_viaje(self, id_carga: int) -> PropuestaViaje:
        """Motor de asignación (HU5.1): propone camión y conductor, o explica por qué no.

        Elige el camión que mejor se llena, para dejar libres los grandes, y
        el primer conductor habilitado para él.
        """
        carga = await self._carga_confirmada(id_carga)
        inicio, fin = self._horario(carga)
        camiones = await self._camiones_aptos(carga)
        conductores = await self._conductores_disponibles()

        for camion in camiones:
            conductor = next(
                (d for d in conductores if _compatibles(d, camion.camion, fin)), None
            )
            if conductor is not None:
                return PropuestaViaje(
                    carga=carga,
                    camion=camion,
                    conductor=conductor,
                    ocupacion=self.cargas.calcular_ocupacion(carga.pedidos, camion.camion),
                    fecha_inicio=inicio,
                    fecha_fin=fin,
                )

        peso, volumen = totales(carga.pedidos)
        if not camiones:
            raise DomainError(
                f"No hay camión disponible con capacidad para {_num(peso)} kg y "
                f"{_num(volumen)} m³: los que la tienen están en viaje, dados de baja "
                "o con documentos vencidos."
            )
        if not conductores:
            raise DomainError(
                "No hay conductores disponibles: todos están en viaje, en descanso "
                "o con la licencia vencida."
            )
        patentes = ", ".join(c.camion.patente for c in camiones)
        raise DomainError(
            "Ningún conductor disponible tiene una licencia que habilite los camiones "
            f"aptos para la carga ({patentes}) y siga vigente hasta el "
            f"{fin.date().isoformat()}."
        )

    # ── Comandos ─────────────────────────────────────────────────────────────

    async def agregar_viaje(self, datos: DatosViaje) -> ViajeDetalle:
        """Genera el viaje y lo arranca: la carga queda En ruta y sus pedidos En tránsito.

        Lo usan tanto la propuesta del motor como el armado a mano. Vuelve a
        validar todo porque, entre consultar y confirmar, otro viaje pudo
        tomar la carga, el camión o el conductor.
        """
        # Antes de leer nada: dos viajes que compitan por la misma carga,
        # camión o conductor esperan aquí a que el otro termine, y validan
        # con lo que ese otro ya confirmó.
        await self.viajes.bloquear(
            id_carga=datos.id_carga,
            id_camion=datos.id_camion,
            id_conductor=datos.id_conductor,
        )
        carga = await self._carga_confirmada(datos.id_carga)
        inicio, fin = self._horario(carga)
        camion = await self._camion_asignable(carga, datos.id_camion)
        conductor = await self.conductores.verificar_asignable(
            datos.id_conductor, camion.id_tipo_camion, hasta=fin.date()
        )

        viaje = Viaje(
            id_carga=carga.id,
            id_camion=camion.id,
            id_conductor=conductor.id,
            fecha_inicio=inicio,
            fecha_fin=fin,
        )
        await self._costear(viaje, camion, carga)
        self.viajes.agregar(viaje)
        self.cargas.al_iniciar_viaje(carga)
        try:
            await self.session.commit()
        except IntegrityError as e:
            # Respaldo del índice único de viaje.id_carga, por si algo se
            # salta el bloqueo.
            await self.session.rollback()
            raise DomainError(f"La carga #{datos.id_carga} ya tiene un viaje.") from e
        return await self._viaje_existente(viaje.id)

    async def finalizar_viaje(self, id: int, datos: DatosLlegada) -> ViajeDetalle:
        """Registra la llegada (HU5.2): la carga queda Finalizada y sus pedidos Entregado.

        El camión suma al odómetro la distancia al centro, y el descanso del
        conductor corre desde la llegada. Queda calculado el margen (H5.4).
        """
        viaje = await self._viaje_en_ruta(id)
        receptor = datos.receptor.strip()
        if not receptor:
            raise DomainError("Indique quién recibió la carga.")
        if datos.fecha_llegada <= viaje.fecha_inicio:
            raise DomainError("La llegada debe ser posterior a la salida del viaje.")
        if datos.fecha_llegada > tiempo.ahora():
            raise DomainError("La llegada no puede registrarse en el futuro.")

        viaje.fecha_llegada = datos.fecha_llegada
        viaje.receptor = receptor
        viaje.observacion = (datos.observacion or "").strip() or None
        if viaje.costo_diesel_clp is None or viaje.costo_viatico_clp is None:
            # Viaje generado antes de H5.4: se costea con las tarifas de hoy.
            await self._costear(viaje, viaje.camion, viaje.carga)
        peso, _ = totales(viaje.carga.pedidos)
        viaje.ingreso_total_clp = calcular_ingreso(
            peso, viaje.carga.centro.distancia_km, viaje.tarifa_venta_clp_ton_km
        )
        viaje.margen_clp, viaje.margen_porcentaje = calcular_margen(
            viaje.ingreso_total_clp,
            CostosEstimados(
                viaje.costo_diesel_clp,
                viaje.costo_peajes_clp,
                viaje.costo_operacion_clp,
                viaje.costo_viatico_clp,
            ),
        )
        self.cargas.al_finalizar_viaje(viaje.carga)
        km = viaje.carga.centro.distancia_km.quantize(Decimal(1), ROUND_HALF_UP)
        viaje.camion.kilometraje_actual += int(km)
        await self.session.commit()
        return await self._viaje_existente(id)

    async def cancelar_viaje(self, id: int) -> ViajeDetalle:
        """Cancela un viaje en ruta (HU5.3): camión y conductor quedan libres.

        La carga vuelve a Confirmada para salir en otro viaje, y sus pedidos
        dejan de estar en tránsito.
        """
        viaje = await self._viaje_en_ruta(id)
        viaje.fecha_cancelacion = tiempo.ahora()
        self.cargas.al_cancelar_viaje(viaje.carga)
        await self.session.commit()
        return await self._viaje_existente(id)

    # ── Auxiliares ───────────────────────────────────────────────────────────

    async def _viaje_en_ruta(self, id: int) -> Viaje:
        # Bloqueado: finalizar y cancelar el mismo viaje a la vez se excluyen.
        await self.viajes.bloquear_viaje(id)
        viaje = await self.viajes.obtener(id)
        if viaje is None:
            raise DomainError(f"No existe el viaje #{id}.")
        if estado_viaje(viaje) != EstadoViaje.EN_RUTA:
            raise DomainError(
                f"El viaje #{id} está {estado_viaje(viaje).value.replace('_', ' ').lower()}; "
                "sólo se finaliza o cancela un viaje en ruta."
            )
        return viaje

    async def _carga_confirmada(self, id_carga: int) -> Carga:
        carga = await self.cargas.obtener_carga(id_carga)
        if carga is None:
            raise DomainError(f"No existe la carga #{id_carga}.")
        if carga.estado != CargaEstado.CONFIRMADA:
            raise DomainError(
                f"La carga #{id_carga} está '{carga.estado.value}'; "
                "sólo una carga Confirmada puede salir en un viaje."
            )
        validar_destino(carga.centro.direccion, carga.centro.distancia_km, carga.centro.distancia_min)
        return carga

    async def _camiones_aptos(self, carga: Carga) -> list[CamionEvaluado]:
        """Disponibles (no en viaje, documentos al día) y con capacidad en peso y volumen."""
        peso, volumen = totales(carga.pedidos)
        candidatos = await self.flota.listar_camiones(
            estado=EstadoCamion.DISPONIBLE, capacidad_min_kg=peso
        )
        aptos = [e for e in candidatos if e.camion.volumen_m3 >= volumen]
        # Primero el que queda más lleno según su factor limitante.
        return sorted(
            aptos,
            key=lambda e: max(peso / e.camion.peso_kg, volumen / e.camion.volumen_m3),
            reverse=True,
        )

    async def _camion_asignable(self, carga: Carga, id_camion: int) -> Camion:
        """El camión, si puede llevar la carga ahora; si no, DomainError con el motivo."""
        camion = await self.flota.verificar_asignable(id_camion)
        self.cargas.validar_capacidad(carga.pedidos, camion)
        return camion

    async def _conductores_disponibles(self) -> list[ConductorEvaluado]:
        return await self.conductores.listar_conductores(
            estado=EstadoConductor.DISPONIBLE
        )

    async def _conductor_disponible(self, id_conductor: int) -> ConductorEvaluado:
        evaluado = await self.conductores.obtener_conductor(id_conductor)
        if evaluado is None:
            raise DomainError(f"No existe un conductor con id {id_conductor}")
        if evaluado.estado != EstadoConductor.DISPONIBLE:
            raise DomainError(
                f"{evaluado.conductor.nombres} {evaluado.conductor.apellidos} "
                f"no puede asignarse: {evaluado.motivo_bloqueo}"
            )
        return evaluado

    async def _viaje_existente(self, id: int) -> ViajeDetalle:
        viaje = await self.viajes.obtener(id)
        if viaje is None:
            raise DomainError(f"No existe el viaje #{id}.")
        return await self._detalle(viaje)

    async def _detalle(self, viaje: Viaje) -> ViajeDetalle:
        camion = await self.flota.obtener_camion(viaje.id_camion)
        conductor = await self.conductores.obtener_conductor(viaje.id_conductor)
        assert camion is not None and conductor is not None  # FKs de viaje.
        return ViajeDetalle(viaje, camion, conductor)

    async def _costear(self, viaje: Viaje, camion: Camion, carga: Carga) -> None:
        """Copia al viaje las tarifas que le falten y estima sus costos (H5.4)."""
        for clave in TARIFAS:
            if getattr(viaje, clave) is None:
                setattr(viaje, clave, await leer_parametro(self.session, clave))
        # Cada día calendario que toca el viaje cuenta un viático.
        dias = (viaje.fecha_fin.date() - viaje.fecha_inicio.date()).days + 1
        costos = estimar_costos(
            carga.centro.distancia_km,
            camion.rendimiento_base_km_l,
            viaje.precio_diesel_clp_litro,
            viaje.tarifa_peajes_clp_km,
            viaje.costo_operacion_clp_km,
            viaje.viatico_diario_clp,
            dias,
        )
        viaje.costo_diesel_clp = costos.costo_diesel_clp
        viaje.costo_peajes_clp = costos.costo_peajes_clp
        viaje.costo_operacion_clp = costos.costo_operacion_clp
        viaje.costo_viatico_clp = costos.costo_viatico_clp

    @staticmethod
    def _horario(carga: Carga) -> tuple[datetime, datetime]:
        # El viaje sale al generarse; el término previsto es la salida más el
        # tiempo de viaje hasta el centro. La llegada real se registra aparte.
        inicio = tiempo.ahora()
        return inicio, inicio + timedelta(minutes=carga.centro.distancia_min)


def _compatibles(conductor: ConductorEvaluado, camion: Camion, fin: datetime) -> bool:
    return motivo_no_asignable(conductor, camion.id_tipo_camion, fin.date()) is None


def _num(valor: Decimal) -> str:
    return f"{valor.normalize():f}"
