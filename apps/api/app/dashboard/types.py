from datetime import datetime
from decimal import Decimal

import strawberry

from app.dashboard.service import (
    DashboardResumen,
    DocumentoAlerta,
    PedidoPendiente,
    ViajeDashboard,
)


@strawberry.type
class ViajeDashboardType:
    id: int
    patente: str
    conductor: str
    destino: str
    fecha_inicio: datetime

    @staticmethod
    def from_data(viaje: ViajeDashboard) -> "ViajeDashboardType":
        return ViajeDashboardType(
            id=viaje.id,
            patente=viaje.patente,
            conductor=viaje.conductor,
            destino=viaje.destino,
            fecha_inicio=viaje.fecha_inicio,
        )


@strawberry.type
class PedidoPendienteType:
    id: int
    peso_kg: Decimal
    ventana_fin: datetime

    @staticmethod
    def from_data(pedido: PedidoPendiente) -> "PedidoPendienteType":
        return PedidoPendienteType(
            id=pedido.id,
            peso_kg=pedido.peso_kg,
            ventana_fin=pedido.ventana_fin,
        )


@strawberry.type
class DocumentoAlertaType:
    id: int
    patente: str
    tipo: str
    fecha_vencimiento: datetime
    dias_restantes: int

    @staticmethod
    def from_data(documento: DocumentoAlerta) -> "DocumentoAlertaType":
        return DocumentoAlertaType(
            id=documento.id,
            patente=documento.patente,
            tipo=documento.tipo,
            fecha_vencimiento=documento.fecha_vencimiento,
            dias_restantes=documento.dias_restantes,
        )


@strawberry.type
class DashboardType:
    actualizado_en: datetime
    viajes_en_curso: list[ViajeDashboardType]
    pedidos_sin_planificar: list[PedidoPendienteType]
    capacidad_flota_kg: Decimal
    peso_en_ruta_kg: Decimal
    ocupacion_flota_pct: Decimal
    camiones_activos: int
    camiones_en_ruta: int
    documentos_por_vencer: list[DocumentoAlertaType]

    @staticmethod
    def from_data(resumen: DashboardResumen) -> "DashboardType":
        return DashboardType(
            actualizado_en=resumen.actualizado_en,
            viajes_en_curso=[ViajeDashboardType.from_data(viaje) for viaje in resumen.viajes_en_curso],
            pedidos_sin_planificar=[PedidoPendienteType.from_data(pedido) for pedido in resumen.pedidos_sin_planificar],
            capacidad_flota_kg=resumen.capacidad_flota_kg,
            peso_en_ruta_kg=resumen.peso_en_ruta_kg,
            ocupacion_flota_pct=resumen.ocupacion_flota_pct,
            camiones_activos=resumen.camiones_activos,
            camiones_en_ruta=resumen.camiones_en_ruta,
            documentos_por_vencer=[DocumentoAlertaType.from_data(documento) for documento in resumen.documentos_por_vencer],
        )