"""Reglas de negocio de los conductores (HU2.1 y HU2.2).

No conoce GraphQL: recibe y devuelve objetos de Python. Es la única capa que
hace commit, así que cada método público es una operación completa.
"""

import re
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from decimal import Decimal
from enum import StrEnum

from sqlalchemy.exc import IntegrityError
from sqlmodel.ext.asyncio.session import AsyncSession

from app.conductores.repository import (
    ClaseLicenciaRepository,
    ConductorRepository,
    ViajeConductorRepository,
)
from app.core import tiempo
from app.core.config import get_settings
from app.core.errors import DomainError
from app.flota.service import ORIGEN_VIAJES, EstadoViaje, estado_viaje
from app.models import ClaseLicencia, Conductor, Licencia, LicenciaClase, Viaje

# 12.345.678-5, 12345678-5 o 123456785; el dígito verificador puede ser K.
_FORMATO_RUT = re.compile(r"^(\d{1,8})-?([\dK])$")
_FORMATO_EMAIL = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class EstadoConductor(StrEnum):
    DISPONIBLE = "DISPONIBLE"
    EN_VIAJE = "EN_VIAJE"
    EN_DESCANSO = "EN_DESCANSO"
    BLOQUEADO = "BLOQUEADO"
    INACTIVO = "INACTIVO"


# ── Datos de entrada ─────────────────────────────────────────────────────────


@dataclass
class DatosConductor:
    rut: str
    nombres: str
    apellidos: str
    telefono: str
    email: str


@dataclass
class DatosLicencia:
    clases: list[LicenciaClase]
    fecha_emision: date
    fecha_vencimiento: date


# ── Datos de salida ──────────────────────────────────────────────────────────


@dataclass
class ConductorEvaluado:
    """Un conductor junto con su estado, que se calcula y no se guarda."""

    conductor: Conductor
    estado: EstadoConductor
    motivo_bloqueo: str | None
    hoy: date

    @property
    def licencias(self) -> list[Licencia]:
        """Historial de licencias, la actual primero."""
        return sorted(
            self.conductor.licencias, key=lambda lic: lic.fecha_emision, reverse=True
        )

    @property
    def licencia_actual(self) -> Licencia | None:
        return next(iter(self.licencias), None)

    def licencia_vigente(self, licencia: Licencia) -> bool:
        # Sólo la más reciente cuenta: las anteriores quedaron reemplazadas.
        return (
            licencia is self.licencia_actual
            and licencia.fecha_vencimiento.date() >= self.hoy
        )


@dataclass
class ResumenPersonal:
    """Indicador del panel de personal: disponibles / total (HU2.1).

    `total` cuenta sólo al personal activo: los dados de baja van aparte.
    """

    total: int
    disponibles: int
    en_viaje: int
    en_descanso: int
    bloqueados: int
    inactivos: int


@dataclass
class ViajeDelConductor:
    viaje: Viaje
    patente: str
    origen: str
    destino: str
    distancia_km: Decimal
    peso_kg: Decimal
    estado: EstadoViaje


@dataclass
class HistorialConductor:
    viajes: list[ViajeDelConductor]
    total_km: Decimal


# ── Service ──────────────────────────────────────────────────────────────────


class ConductoresService:
    def __init__(
        self,
        session: AsyncSession,
        conductores: ConductorRepository,
        clases: ClaseLicenciaRepository,
        viajes: ViajeConductorRepository,
    ) -> None:
        self.session = session
        self.conductores = conductores
        self.clases = clases
        self.viajes = viajes

    # ── Consultas (HU2.1) ────────────────────────────────────────────────────

    async def clases_licencia(self) -> list[ClaseLicencia]:
        return await self.clases.listar()

    async def listar_conductores(
        self,
        *,
        busqueda: str | None = None,
        clase: LicenciaClase | None = None,
        estado: EstadoConductor | None = None,
    ) -> list[ConductorEvaluado]:
        conductores = await self.conductores.listar(
            busqueda=busqueda.strip() if busqueda else None
        )
        evaluados = await self._evaluar_todos(conductores)
        # Clase y estado dependen de la licencia actual y de la hora, así que
        # se filtran después de evaluar.
        if clase is not None:
            evaluados = [e for e in evaluados if _tiene_clase(e, clase)]
        if estado is not None:
            evaluados = [e for e in evaluados if e.estado == estado]
        return evaluados

    async def obtener_conductor(self, id: int) -> ConductorEvaluado | None:
        conductor = await self.conductores.obtener(id)
        if conductor is None:
            return None
        return (await self._evaluar_todos([conductor]))[0]

    async def resumen_personal(self) -> ResumenPersonal:
        evaluados = await self._evaluar_todos(await self.conductores.listar())

        def contar(estado: EstadoConductor) -> int:
            return sum(1 for e in evaluados if e.estado == estado)

        inactivos = contar(EstadoConductor.INACTIVO)
        return ResumenPersonal(
            total=len(evaluados) - inactivos,
            disponibles=contar(EstadoConductor.DISPONIBLE),
            en_viaje=contar(EstadoConductor.EN_VIAJE),
            en_descanso=contar(EstadoConductor.EN_DESCANSO),
            bloqueados=contar(EstadoConductor.BLOQUEADO),
            inactivos=inactivos,
        )

    async def historial(self, id_conductor: int) -> HistorialConductor:
        await self._conductor_existente(id_conductor)
        viajes = await self.viajes.listar_por_conductor(id_conductor)
        centros = await self.viajes.centros_por_id({v.carga.id_centro for v in viajes})

        filas = [
            ViajeDelConductor(
                viaje=v,
                patente=v.camion.patente,
                origen=ORIGEN_VIAJES,
                destino=centros[v.carga.id_centro].direccion,
                distancia_km=centros[v.carga.id_centro].distancia_km,
                peso_kg=sum((p.peso_kg for p in v.carga.pedidos), Decimal(0)),
                estado=estado_viaje(v),
            )
            for v in viajes
        ]
        # Los viajes cancelados no cuentan como kilómetros recorridos.
        return HistorialConductor(
            viajes=filas,
            total_km=sum(
                (f.distancia_km for f in filas if f.estado != EstadoViaje.CANCELADO),
                Decimal(0),
            ),
        )

    # ── Comandos (HU2.2 y baja lógica) ─────────────────────────────────────────────────────

    async def registrar(
        self, datos: DatosConductor, licencia: DatosLicencia
    ) -> ConductorEvaluado:
        """Crea un conductor junto con su primera licencia."""
        rut = normalizar_rut(datos.rut)
        self._validar_datos(datos)
        if await self.conductores.existe_rut(rut):
            raise DomainError(f"El RUT {rut} ya está registrado")
        clases = await self._validar_licencia(licencia)

        conductor = Conductor(rut=rut)
        self._aplicar(conductor, datos)
        conductor.licencias = [self._nueva_licencia(licencia, clases)]
        self.conductores.agregar(conductor)
        await self._commit(rut)
        return await self._evaluado(conductor.id)

    async def editar(self, id: int, datos: DatosConductor) -> ConductorEvaluado:
        """Actualiza los datos personales. Las licencias se gestionan aparte."""
        conductor = await self._conductor_existente(id)
        # Un conductor dado de baja queda sólo como registro histórico.
        if not conductor.activo:
            raise DomainError(
                f"{_nombre(conductor)} está dado de baja y no se puede editar"
            )
        rut = normalizar_rut(datos.rut)
        self._validar_datos(datos)
        if await self.conductores.existe_rut(rut, excepto_id=id):
            raise DomainError(f"El RUT {rut} ya está registrado")

        conductor.rut = rut
        self._aplicar(conductor, datos)
        await self._commit(rut)
        return await self._evaluado(id)

    async def registrar_licencia(
        self, id_conductor: int, datos: DatosLicencia
    ) -> ConductorEvaluado:
        """Registra una licencia nueva (renovación); la anterior queda en el historial."""
        conductor = await self._conductor_existente(id_conductor)
        if not conductor.activo:
            raise DomainError(f"{_nombre(conductor)} está dado de baja")
        clases = await self._validar_licencia(datos)
        actual = max(
            conductor.licencias, key=lambda lic: lic.fecha_emision, default=None
        )
        if actual and tiempo.a_datetime(datos.fecha_emision) <= actual.fecha_emision:
            raise DomainError(
                "La nueva licencia debe emitirse después de la actual "
                f"({actual.fecha_emision.date().isoformat()})"
            )

        conductor.licencias.append(self._nueva_licencia(datos, clases))
        await self.session.commit()
        return await self._evaluado(id_conductor)

    async def dar_de_baja(self, id: int) -> ConductorEvaluado:
        """Baja lógica (RNF-06): el conductor queda INACTIVO y conserva su historial."""
        conductor = await self._conductor_existente(id)
        if not conductor.activo:
            raise DomainError(f"{_nombre(conductor)} ya está dado de baja")
        # Darlo de baja dejaría sin conductor a sus viajes en ruta.
        if await self.viajes.tiene_viajes_en_ruta(id):
            raise DomainError(
                f"{_nombre(conductor)} tiene viajes en ruta; "
                "finalícelos o cancélelos antes de darlo de baja"
            )
        conductor.activo = False
        await self.session.commit()
        return await self._evaluado(id)

    async def verificar_asignable(
        self, id_conductor: int, id_tipo_camion: int, hasta: date | None = None
    ) -> Conductor:
        """Punto de entrada para la E05: rechaza conductores que no pueden viajar.

        Exige que esté disponible (licencia vigente, sin viaje y descansado), que
        su licencia habilite el tipo de camión (RN-04) y, si se indica `hasta`,
        que siga vigente hasta el fin del viaje.
        """
        evaluado = await self._evaluado(id_conductor)
        nombre = _nombre(evaluado.conductor)
        if evaluado.estado != EstadoConductor.DISPONIBLE:
            raise DomainError(f"{nombre} no puede asignarse: {evaluado.motivo_bloqueo}")

        licencia = evaluado.licencia_actual
        assert licencia is not None  # DISPONIBLE implica licencia vigente.
        tipos = {t.id for c in licencia.clases for t in c.tipos_camion}
        if id_tipo_camion not in tipos:
            clases = ", ".join(sorted(c.clase.value for c in licencia.clases))
            raise DomainError(
                f"La licencia de {nombre} (clase {clases}) no habilita ese tipo de camión"
            )
        if hasta is not None and licencia.fecha_vencimiento.date() < hasta:
            raise DomainError(
                f"La licencia de {nombre} vence el "
                f"{licencia.fecha_vencimiento.date().isoformat()}, antes del fin del viaje"
            )
        return evaluado.conductor

    # ── Regla de estado (HU2.1 + HU2.2) ──────────────────────────────────────

    async def _evaluar_todos(
        self, conductores: list[Conductor]
    ) -> list[ConductorEvaluado]:
        ahora = tiempo.ahora()
        descanso = timedelta(hours=get_settings().descanso_minimo_horas)
        viajes = await self.viajes.listar_recientes(ahora - descanso)
        por_conductor: dict[int, list[Viaje]] = {}
        for v in viajes:
            por_conductor.setdefault(v.id_conductor, []).append(v)
        return [
            self.evaluar(c, por_conductor.get(c.id, []), ahora, descanso)
            for c in conductores
        ]

    def evaluar(
        self,
        conductor: Conductor,
        viajes_recientes: list[Viaje],
        ahora: datetime,
        descanso: timedelta,
    ) -> ConductorEvaluado:
        """Calcula el estado. `viajes_recientes`: los que terminan después de `ahora - descanso`."""
        hoy = ahora.date()
        if not conductor.activo:
            return ConductorEvaluado(
                conductor, EstadoConductor.INACTIVO, "Conductor dado de baja.", hoy
            )
        vigentes = [
            v
            for v in viajes_recientes
            if estado_viaje(v) != EstadoViaje.CANCELADO
        ]

        en_curso = next(
            (v for v in vigentes if estado_viaje(v) == EstadoViaje.EN_RUTA), None
        )
        if en_curso:
            return ConductorEvaluado(
                conductor,
                EstadoConductor.EN_VIAJE,
                f"En viaje con el camión {en_curso.camion.patente}, llegada prevista el {_fecha_hora(en_curso.fecha_fin)}.",
                hoy,
            )

        licencia = max(
            conductor.licencias, key=lambda lic: lic.fecha_emision, default=None
        )
        if licencia is None:
            return ConductorEvaluado(
                conductor,
                EstadoConductor.BLOQUEADO,
                "No tiene licencia registrada.",
                hoy,
            )
        if licencia.fecha_vencimiento.date() < hoy:
            vencio = licencia.fecha_vencimiento.date().isoformat()
            return ConductorEvaluado(
                conductor,
                EstadoConductor.BLOQUEADO,
                f"Licencia vencida el {vencio}.",
                hoy,
            )

        # El descanso corre desde la llegada real, no desde el término previsto.
        terminados = [v.fecha_llegada for v in vigentes if v.fecha_llegada is not None]
        if terminados:
            libre = max(terminados) + descanso
            if libre > ahora:
                horas = int(descanso.total_seconds() // 3600)
                return ConductorEvaluado(
                    conductor,
                    EstadoConductor.EN_DESCANSO,
                    f"En descanso hasta el {_fecha_hora(libre)} (mínimo {horas} h entre viajes).",
                    hoy,
                )

        return ConductorEvaluado(conductor, EstadoConductor.DISPONIBLE, None, hoy)

    # ── Auxiliares ───────────────────────────────────────────────────────────

    async def _conductor_existente(self, id: int) -> Conductor:
        conductor = await self.conductores.obtener(id)
        if conductor is None:
            raise DomainError(f"No existe un conductor con id {id}")
        return conductor

    async def _evaluado(self, id: int) -> ConductorEvaluado:
        return (await self._evaluar_todos([await self._conductor_existente(id)]))[0]

    async def _commit(self, rut: str) -> None:
        # La consulta previa no cubre dos registros simultáneos con el mismo
        # RUT; el índice único de la base sí.
        try:
            await self.session.commit()
        except IntegrityError as e:
            await self.session.rollback()
            raise DomainError(f"El RUT {rut} ya está registrado") from e

    @staticmethod
    def _validar_datos(datos: DatosConductor) -> None:
        # SQLModel no valida los modelos table=True, así que las reglas van aquí.
        if not datos.nombres.strip() or not datos.apellidos.strip():
            raise DomainError("Los nombres y apellidos son obligatorios")
        if not datos.telefono.strip():
            raise DomainError("El teléfono es obligatorio")
        if not _FORMATO_EMAIL.match(datos.email.strip()):
            raise DomainError(f"El email {datos.email.strip()!r} no es válido")

    async def _validar_licencia(self, datos: DatosLicencia) -> list[ClaseLicencia]:
        if not datos.clases:
            raise DomainError("La licencia debe tener al menos una clase")
        if len(set(datos.clases)) != len(datos.clases):
            raise DomainError("La licencia tiene clases repetidas")
        if datos.fecha_vencimiento <= datos.fecha_emision:
            raise DomainError("La licencia debe vencer después de su emisión")
        clases = await self.clases.por_clases(datos.clases)
        if len(clases) != len(datos.clases):
            raise DomainError("Una o más clases de licencia no existen en el catálogo")
        return clases

    @staticmethod
    def _nueva_licencia(datos: DatosLicencia, clases: list[ClaseLicencia]) -> Licencia:
        return Licencia(
            fecha_emision=tiempo.a_datetime(datos.fecha_emision),
            fecha_vencimiento=tiempo.a_datetime(datos.fecha_vencimiento),
            clases=clases,
        )

    @staticmethod
    def _aplicar(conductor: Conductor, datos: DatosConductor) -> None:
        conductor.nombres = datos.nombres.strip()
        conductor.apellidos = datos.apellidos.strip()
        conductor.telefono = datos.telefono.strip()
        conductor.email = datos.email.strip().lower()


def normalizar_rut(rut: str) -> str:
    """Valida el dígito verificador (módulo 11) y devuelve el RUT como 12.345.678-5.

    Se guarda siempre con el mismo formato para que el índice único detecte
    duplicados aunque se escriban con o sin puntos.
    """
    limpio = rut.strip().upper().replace(".", "").replace(" ", "")
    coincide = _FORMATO_RUT.match(limpio)
    if not coincide:
        raise DomainError(f"El RUT {rut.strip()!r} no tiene un formato válido")
    cuerpo, dv = coincide.groups()
    if _digito_verificador(cuerpo) != dv:
        raise DomainError(
            f"El RUT {rut.strip()} no es válido: el dígito verificador no corresponde"
        )
    return f"{int(cuerpo):,}".replace(",", ".") + f"-{dv}"


def _digito_verificador(cuerpo: str) -> str:
    suma, factor = 0, 2
    for digito in reversed(cuerpo):
        suma += int(digito) * factor
        factor = 2 if factor == 7 else factor + 1
    resto = 11 - suma % 11
    return {11: "0", 10: "K"}.get(resto, str(resto))


def _tiene_clase(evaluado: ConductorEvaluado, clase: LicenciaClase) -> bool:
    licencia = evaluado.licencia_actual
    return licencia is not None and any(c.clase == clase for c in licencia.clases)


def _nombre(conductor: Conductor) -> str:
    return f"{conductor.nombres} {conductor.apellidos}"


def _fecha_hora(momento: datetime) -> str:
    return momento.strftime("%Y-%m-%d %H:%M")
