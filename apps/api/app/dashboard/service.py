from dataclasses import dataclass
from datetime import datetime, time, timedelta
from decimal import ROUND_HALF_UP, Decimal

from sqlmodel.ext.asyncio.session import AsyncSession

from app.core import tiempo
from app.core.authorization import require_admin
from app.core.errors import DomainError
from app.dashboard.inputs import DashboardFiltros
from app.dashboard.repository import DashboardRepository
from app.models.pedido import CargaEstado
from app.models.seguridad import Usuario


@dataclass(frozen=True)
class ViajeDashboard:
    id: int
    patente: str
    conductor: str
    destino: str
    fecha_inicio: datetime


@dataclass(frozen=True)
class PedidoPendiente:
    id: int
    peso_kg: Decimal
    ventana_fin: datetime


@dataclass(frozen=True)
class DocumentoAlerta:
    id: int
    patente: str
    tipo: str
    fecha_vencimiento: datetime
    dias_restantes: int


@dataclass(frozen=True)
class DashboardResumen:
    actualizado_en: datetime
    viajes_en_curso: list[ViajeDashboard]
    pedidos_sin_planificar: list[PedidoPendiente]
    capacidad_flota_kg: Decimal
    peso_en_ruta_kg: Decimal
    ocupacion_flota_pct: Decimal
    camiones_activos: int
    camiones_en_ruta: int
    documentos_por_vencer: list[DocumentoAlerta]


def porcentaje_ocupacion(peso_en_ruta: Decimal, capacidad_activa: Decimal) -> Decimal:
    if capacidad_activa <= 0:
        return Decimal(0)
    return (peso_en_ruta / capacidad_activa * Decimal(100)).quantize(
        Decimal("0.1"), rounding=ROUND_HALF_UP
    )


class DashboardService:
    def __init__(self, session: AsyncSession, repository: DashboardRepository) -> None:
        self.session = session
        self.repository = repository

    async def resumen(
        self, actor: Usuario, filtros: DashboardFiltros | None = None
    ) -> DashboardResumen:
        require_admin(actor)
        filtros = filtros or DashboardFiltros()
        if filtros.dias_alerta_documentos < 0 or filtros.dias_alerta_documentos > 365:
            raise DomainError("El rango de alertas debe estar entre 0 y 365 días.")

        hoy = tiempo.hoy()
        viajes = await self.repository.listar_viajes_en_curso()
        pedidos = await self.repository.listar_pedidos_creados()
        camiones = await self.repository.listar_camiones_activos()
        limite_alertas = datetime.combine(
            hoy + timedelta(days=filtros.dias_alerta_documentos + 1), time.min
        )
        documentos = await self.repository.listar_documentos_hasta(limite_alertas)

        viajes_data = [ViajeDashboard(
            id=viaje.id,
            patente=viaje.camion.patente if viaje.camion else "Sin camión",
            conductor=(
                f"{viaje.conductor.nombres} {viaje.conductor.apellidos}"
                if viaje.conductor else "Sin conductor"
            ),
            destino=viaje.carga.centro.direccion if viaje.carga.centro else "Sin destino",
            fecha_inicio=viaje.fecha_inicio,
        ) for viaje in viajes]

        pedidos_data = [PedidoPendiente(
            id=pedido.id,
            peso_kg=pedido.peso_kg,
            ventana_fin=pedido.ventana_fin,
        ) for pedido in pedidos if not any(
            carga.estado in {CargaEstado.CREADA, CargaEstado.CONFIRMADA, CargaEstado.EN_RUTA}
            for carga in pedido.cargas
        )]

        capacidad_total = sum((camion.peso_kg for camion in camiones), Decimal(0))
        peso_en_ruta = sum((
            sum((pedido.peso_kg for pedido in viaje.carga.pedidos), Decimal(0))
            for viaje in viajes
        ), Decimal(0))
        alertas = [DocumentoAlerta(
            id=documento.id,
            patente=patente,
            tipo=documento.tipo.value,
            fecha_vencimiento=documento.fecha_vencimiento,
            dias_restantes=(documento.fecha_vencimiento.date() - hoy).days,
        ) for documento, patente in documentos]

        return DashboardResumen(
            actualizado_en=tiempo.ahora(),
            viajes_en_curso=viajes_data,
            pedidos_sin_planificar=pedidos_data,
            capacidad_flota_kg=capacidad_total,
            peso_en_ruta_kg=peso_en_ruta,
            ocupacion_flota_pct=porcentaje_ocupacion(peso_en_ruta, capacidad_total),
            camiones_activos=len(camiones),
            camiones_en_ruta=len({viaje.id_camion for viaje in viajes}),
            documentos_por_vencer=alertas,
        )