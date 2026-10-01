"""Reglas de negocio de la flota (HU1.1, HU1.2 y HU1.3).

No conoce GraphQL: recibe y devuelve objetos de Python. Es la única capa que
hace commit, así que cada método público es una operación completa.
"""

from dataclasses import dataclass
from datetime import date
from decimal import Decimal
from enum import StrEnum

from sqlalchemy.exc import IntegrityError
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core import tiempo
from app.core.errors import DomainError
from app.flota.repository import CamionRepository, TipoCamionRepository, ViajeCamionRepository
from app.models import Camion, CargaEstado, Documento, DocumentoTipo, TipoCamion, Viaje

# Sin estos tres vigentes el camión no puede asignarse a un viaje (HU1.2).
OBLIGATORIOS = (DocumentoTipo.RT, DocumentoTipo.PC, DocumentoTipo.SOAP)

NOMBRE_DOCUMENTO = {
    DocumentoTipo.RT: "Revisión Técnica (RT)",
    DocumentoTipo.PC: "Permiso de Circulación (PC)",
    DocumentoTipo.SOAP: "Seguro Obligatorio (SOAP)",
    DocumentoTipo.PADRON: "Padrón del Vehículo",
    DocumentoTipo.CEC: "Certificado de Emisión de Contaminantes (CEC)",
}

# Todos los viajes salen de la base: el modelo no guarda el origen, y las
# distancias de centro_distribucion se miden desde aquí.
ORIGEN_VIAJES = "Coquimbo (Base)"

ANIO_MINIMO = 1990


class EstadoCamion(StrEnum):
    DISPONIBLE = "DISPONIBLE"
    BLOQUEADO = "BLOQUEADO"
    INACTIVO = "INACTIVO"


class EstadoViaje(StrEnum):
    EN_RUTA = "EN_RUTA"
    FINALIZADO = "FINALIZADO"
    CANCELADO = "CANCELADO"


def estado_viaje(viaje: Viaje) -> EstadoViaje:
    """Estado de un viaje según su carga y su llegada; no se guarda.

    Un viaje sigue en ruta hasta que se registra su llegada, aunque se haya
    pasado su término previsto (`fecha_fin`). Lo usan el historial del camión
    y el de los conductores (E02). Requiere la carga del viaje ya cargada.
    """
    if viaje.carga.estado == CargaEstado.CANCELADA:
        return EstadoViaje.CANCELADO
    if viaje.fecha_llegada is None:
        return EstadoViaje.EN_RUTA
    return EstadoViaje.FINALIZADO


# ── Datos de entrada ─────────────────────────────────────────────────────────


@dataclass
class DatosCamion:
    patente: str
    marca: str
    modelo: str
    anio: int
    id_tipo_camion: int
    peso_max_kg: Decimal
    volumen_max_m3: Decimal
    rendimiento_base_km_l: Decimal
    kilometraje_actual: int


@dataclass
class DatosDocumento:
    tipo: DocumentoTipo
    fecha_emision: date
    fecha_vencimiento: date


# ── Datos de salida ──────────────────────────────────────────────────────────


@dataclass
class CamionEvaluado:
    """Un camión junto con su estado, que se calcula y no se guarda."""

    camion: Camion
    estado: EstadoCamion
    motivo_bloqueo: str | None
    hoy: date

    def documento_vigente(self, documento: Documento) -> bool:
        return documento.fecha_vencimiento.date() >= self.hoy


@dataclass
class ViajeDelCamion:
    viaje: Viaje
    origen: str
    destino: str
    distancia_km: Decimal
    conductor: str
    peso_kg: Decimal
    ocupacion_pct: float
    estado: EstadoViaje


@dataclass
class HistorialCamion:
    viajes: list[ViajeDelCamion]
    total_km: Decimal
    total_kg: Decimal


# ── Service ──────────────────────────────────────────────────────────────────


class FlotaService:
    def __init__(
        self,
        session: AsyncSession,
        camiones: CamionRepository,
        tipos: TipoCamionRepository,
        viajes: ViajeCamionRepository,
    ) -> None:
        self.session = session
        self.camiones = camiones
        self.tipos = tipos
        self.viajes = viajes

    # ── Consultas (HU1.3) ────────────────────────────────────────────────────

    async def tipos_camion(self) -> list[TipoCamion]:
        return await self.tipos.listar()

    async def listar_camiones(
        self,
        *,
        busqueda: str | None = None,
        id_tipo_camion: int | None = None,
        estado: EstadoCamion | None = None,
        capacidad_min_kg: Decimal | None = None,
    ) -> list[CamionEvaluado]:
        camiones = await self.camiones.listar(
            busqueda=busqueda.strip() if busqueda else None,
            id_tipo_camion=id_tipo_camion,
            capacidad_min_kg=capacidad_min_kg,
        )
        hoy = tiempo.hoy()
        evaluados = [self.evaluar(c, hoy) for c in camiones]
        # El estado depende de la fecha de hoy, así que se filtra después de evaluar.
        if estado is not None:
            evaluados = [e for e in evaluados if e.estado == estado]
        return evaluados

    async def obtener_camion(self, id: int) -> CamionEvaluado | None:
        camion = await self.camiones.obtener(id)
        return self.evaluar(camion, tiempo.hoy()) if camion else None

    async def historial(self, id_camion: int) -> HistorialCamion:
        camion = await self._camion_existente(id_camion)
        viajes = await self.viajes.listar_por_camion(id_camion)
        centros = await self.viajes.centros_por_id({v.carga.id_centro for v in viajes})

        filas: list[ViajeDelCamion] = []
        for v in viajes:
            centro = centros[v.carga.id_centro]
            peso = sum((p.peso_kg for p in v.carga.pedidos), Decimal(0))
            filas.append(
                ViajeDelCamion(
                    viaje=v,
                    origen=ORIGEN_VIAJES,
                    destino=centro.direccion,
                    distancia_km=centro.distancia_km,
                    conductor=f"{v.conductor.nombres} {v.conductor.apellidos}",
                    peso_kg=peso,
                    ocupacion_pct=round(float(peso / camion.peso_kg * 100), 1),
                    estado=estado_viaje(v),
                )
            )

        # Los viajes cancelados no cuentan como kilómetros ni carga movilizada.
        realizados = [f for f in filas if f.estado != EstadoViaje.CANCELADO]
        return HistorialCamion(
            viajes=filas,
            total_km=sum((f.distancia_km for f in realizados), Decimal(0)),
            total_kg=sum((f.peso_kg for f in realizados), Decimal(0)),
        )

    # ── Comandos (HU1.1 y HU1.2) ─────────────────────────────────────────────

    async def registrar(
        self, datos: DatosCamion, documentos: list[DatosDocumento]
    ) -> CamionEvaluado:
        """Crea un camión con sus documentos obligatorios; queda DISPONIBLE."""
        patente = self._normalizar_patente(datos.patente)
        await self._validar_datos(datos)
        if await self.camiones.existe_patente(patente):
            raise DomainError(f"La patente {patente} ya está registrada")
        self._validar_documentos_registro(documentos)

        camion = Camion(patente=patente, activo=True)
        self._aplicar(camion, datos)
        camion.documentos = [
            Documento(
                tipo=d.tipo,
                fecha_emision=tiempo.a_datetime(d.fecha_emision),
                fecha_vencimiento=tiempo.a_datetime(d.fecha_vencimiento),
            )
            for d in documentos
        ]
        self.camiones.agregar(camion)
        await self._commit(patente)
        return await self._evaluado(camion.id)

    async def editar(self, id: int, datos: DatosCamion) -> CamionEvaluado:
        """Actualiza los datos técnicos. Los documentos se gestionan aparte."""
        camion = await self._camion_existente(id)
        # Un camión dado de baja queda sólo como registro histórico.
        if not camion.activo:
            raise DomainError(
                f"El camión {camion.patente} está dado de baja y no se puede editar"
            )
        patente = self._normalizar_patente(datos.patente)
        await self._validar_datos(datos)
        if await self.camiones.existe_patente(patente, excepto_id=id):
            raise DomainError(f"La patente {patente} ya está registrada")

        camion.patente = patente
        self._aplicar(camion, datos)
        await self._commit(patente)
        return await self._evaluado(id)

    async def dar_de_baja(self, id: int) -> CamionEvaluado:
        """Baja lógica: el camión queda INACTIVO y conserva su historial."""
        camion = await self._camion_existente(id)
        if not camion.activo:
            raise DomainError(f"El camión {camion.patente} ya está dado de baja")
        camion.activo = False
        await self.session.commit()
        return await self._evaluado(id)

    async def registrar_documento(
        self, id_camion: int, datos: DatosDocumento
    ) -> CamionEvaluado:
        """Registra un documento o, si ya hay uno de ese tipo, lo renueva."""
        camion = await self._camion_existente(id_camion)
        if not camion.activo:
            raise DomainError(f"El camión {camion.patente} está dado de baja")
        self._validar_fechas(datos)

        existente = next((d for d in camion.documentos if d.tipo == datos.tipo), None)
        if existente:
            existente.fecha_emision = tiempo.a_datetime(datos.fecha_emision)
            existente.fecha_vencimiento = tiempo.a_datetime(datos.fecha_vencimiento)
        else:
            camion.documentos.append(
                Documento(
                    tipo=datos.tipo,
                    fecha_emision=tiempo.a_datetime(datos.fecha_emision),
                    fecha_vencimiento=tiempo.a_datetime(datos.fecha_vencimiento),
                )
            )
        await self.session.commit()
        return await self._evaluado(id_camion)

    async def verificar_asignable(self, id_camion: int) -> Camion:
        """Punto de entrada para la E05: rechaza camiones que no pueden viajar."""
        evaluado = await self._evaluado(id_camion)
        if evaluado.estado != EstadoCamion.DISPONIBLE:
            raise DomainError(
                f"El camión {evaluado.camion.patente} no puede asignarse: {evaluado.motivo_bloqueo}"
            )
        return evaluado.camion

    # ── Regla de estado (HU1.1 + HU1.2) ──────────────────────────────────────

    def evaluar(self, camion: Camion, hoy: date) -> CamionEvaluado:
        if not camion.activo:
            return CamionEvaluado(
                camion, EstadoCamion.INACTIVO, "Camión dado de baja.", hoy
            )

        por_tipo = {d.tipo: d for d in camion.documentos}
        problemas = []
        for tipo in OBLIGATORIOS:
            documento = por_tipo.get(tipo)
            if documento is None:
                problemas.append(f"Falta {NOMBRE_DOCUMENTO[tipo]}.")
            elif documento.fecha_vencimiento.date() < hoy:
                vencio = documento.fecha_vencimiento.date().isoformat()
                problemas.append(f"{NOMBRE_DOCUMENTO[tipo]} venció el {vencio}.")
        if problemas:
            return CamionEvaluado(
                camion, EstadoCamion.BLOQUEADO, " ".join(problemas), hoy
            )
        return CamionEvaluado(camion, EstadoCamion.DISPONIBLE, None, hoy)

    # ── Auxiliares ───────────────────────────────────────────────────────────

    async def _camion_existente(self, id: int) -> Camion:
        camion = await self.camiones.obtener(id)
        if camion is None:
            raise DomainError(f"No existe un camión con id {id}")
        return camion

    async def _evaluado(self, id: int) -> CamionEvaluado:
        return self.evaluar(await self._camion_existente(id), tiempo.hoy())

    async def _commit(self, patente: str) -> None:
        # La consulta previa no cubre dos registros simultáneos con la misma
        # patente; el índice único de la base sí.
        try:
            await self.session.commit()
        except IntegrityError as e:
            await self.session.rollback()
            raise DomainError(f"La patente {patente} ya está registrada") from e

    @staticmethod
    def _normalizar_patente(patente: str) -> str:
        normalizada = patente.strip().upper()
        if not normalizada:
            raise DomainError("La patente es obligatoria")
        return normalizada

    async def _validar_datos(self, datos: DatosCamion) -> None:
        # SQLModel no valida los Field(gt=..., ge=...) en modelos table=True,
        # así que las reglas se comprueban aquí.
        if not datos.marca.strip() or not datos.modelo.strip():
            raise DomainError("La marca y el modelo son obligatorios")
        anio_max = tiempo.hoy().year + 1
        if not ANIO_MINIMO <= datos.anio <= anio_max:
            raise DomainError(f"El año debe estar entre {ANIO_MINIMO} y {anio_max}")
        if datos.peso_max_kg <= 0 or datos.volumen_max_m3 <= 0:
            raise DomainError("La capacidad en kg y en m³ debe ser mayor que 0")
        if datos.rendimiento_base_km_l <= 0:
            raise DomainError("El rendimiento debe ser mayor que 0")
        if datos.kilometraje_actual < 0:
            raise DomainError("El kilometraje no puede ser negativo")
        if await self.tipos.obtener(datos.id_tipo_camion) is None:
            raise DomainError(
                f"No existe el tipo de camión con id {datos.id_tipo_camion}"
            )

    @staticmethod
    def _validar_fechas(datos: DatosDocumento) -> None:
        if datos.fecha_vencimiento <= datos.fecha_emision:
            raise DomainError(
                f"{NOMBRE_DOCUMENTO[datos.tipo]}: el vencimiento debe ser posterior a la emisión"
            )

    def _validar_documentos_registro(self, documentos: list[DatosDocumento]) -> None:
        tipos = [d.tipo for d in documentos]
        repetidos = {t for t in tipos if tipos.count(t) > 1}
        if repetidos:
            raise DomainError(
                f"Documento repetido: {', '.join(sorted(t.value for t in repetidos))}"
            )
        faltantes = [NOMBRE_DOCUMENTO[t] for t in OBLIGATORIOS if t not in tipos]
        if faltantes:
            raise DomainError(f"Faltan documentos obligatorios: {', '.join(faltantes)}")

        hoy = tiempo.hoy()
        for d in documentos:
            self._validar_fechas(d)
            # Un camión recién registrado debe quedar DISPONIBLE (HU1.1).
            if d.tipo in OBLIGATORIOS and d.fecha_vencimiento < hoy:
                raise DomainError(
                    f"{NOMBRE_DOCUMENTO[d.tipo]} ya venció; registre un documento vigente"
                )

    @staticmethod
    def _aplicar(camion: Camion, datos: DatosCamion) -> None:
        camion.marca = datos.marca.strip()
        camion.modelo = datos.modelo.strip()
        camion.anio = datos.anio
        camion.id_tipo_camion = datos.id_tipo_camion
        camion.peso_kg = datos.peso_max_kg
        camion.volumen_m3 = datos.volumen_max_m3
        camion.rendimiento_base_km_l = datos.rendimiento_base_km_l
        camion.kilometraje_actual = datos.kilometraje_actual
