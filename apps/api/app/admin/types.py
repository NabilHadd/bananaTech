from datetime import datetime
from decimal import Decimal

import strawberry

from app.admin.service import ReporteCostos as ReporteCostosData
from app.admin.service import ViajeCosto as ViajeCostoData
from app.models.seguridad import Parametro, ParametroAuditoria, Usuario


@strawberry.type
class UsuarioAdminType:
    id: int
    username: str
    rol: str
    activo: bool

    @staticmethod
    def from_model(usuario: Usuario) -> "UsuarioAdminType":
        return UsuarioAdminType(
            id=usuario.id,
            username=usuario.username,
            rol=usuario.rol,
            activo=usuario.activo,
        )


@strawberry.type
class ParametroType:
    clave: str
    valor: Decimal
    unidad: str

    @staticmethod
    def from_model(parametro: Parametro) -> "ParametroType":
        return ParametroType(clave=parametro.clave, valor=parametro.valor, unidad=parametro.unidad)


@strawberry.type
class ParametroAuditoriaType:
    id: int
    clave: str
    valor_anterior: Decimal
    valor_nuevo: Decimal
    cambiado_por: str
    cambiado_en: datetime

    @staticmethod
    def from_row(evento: ParametroAuditoria, username: str) -> "ParametroAuditoriaType":
        return ParametroAuditoriaType(
            id=evento.id,
            clave=evento.clave,
            valor_anterior=evento.valor_anterior,
            valor_nuevo=evento.valor_nuevo,
            cambiado_por=username,
            cambiado_en=evento.cambiado_en,
        )


@strawberry.type
class ViajeCostoType:
    id: int
    fecha_inicio: datetime
    estado: str
    ingresos_clp: Decimal
    diesel_clp: Decimal
    peajes_clp: Decimal
    operacion_clp: Decimal
    viaticos_clp: Decimal
    margen_clp: Decimal

    @staticmethod
    def from_data(viaje: ViajeCostoData) -> "ViajeCostoType":
        return ViajeCostoType(**viaje.__dict__)


@strawberry.type
class ReporteCostosType:
    anio: int
    mes: int
    cantidad_viajes: int
    ingresos_clp: Decimal
    diesel_clp: Decimal
    peajes_clp: Decimal
    operacion_clp: Decimal
    viaticos_clp: Decimal
    costos_totales_clp: Decimal
    margen_clp: Decimal
    viajes: list[ViajeCostoType]

    @staticmethod
    def from_data(reporte: ReporteCostosData) -> "ReporteCostosType":
        return ReporteCostosType(
            anio=reporte.anio,
            mes=reporte.mes,
            cantidad_viajes=reporte.cantidad_viajes,
            ingresos_clp=reporte.ingresos_clp,
            diesel_clp=reporte.diesel_clp,
            peajes_clp=reporte.peajes_clp,
            operacion_clp=reporte.operacion_clp,
            viaticos_clp=reporte.viaticos_clp,
            costos_totales_clp=reporte.costos_totales_clp,
            margen_clp=reporte.margen_clp,
            viajes=[ViajeCostoType.from_data(viaje) for viaje in reporte.viajes],
        )