"""Tipos GraphQL de salida de la flota.

Calcan `apps/web/src/components/features/flota/types.ts`: aquí se traducen los
nombres de la base (peso_kg, tipo…) a los que consume el front (pesoMaxKg,
nombre…). Strawberry pasa los snake_case a camelCase por su cuenta.
"""

from datetime import date, datetime

import strawberry

from app.flota.service import (
    CamionEvaluado,
    EstadoCamion,
    EstadoViaje,
    HistorialCamion,
    ViajeDelCamion,
)
from app.models import Documento, DocumentoTipo, TipoCamion

# Orden en que se muestran: primero los obligatorios, como en el front.
ORDEN_DOCUMENTOS = [
    DocumentoTipo.RT,
    DocumentoTipo.PC,
    DocumentoTipo.SOAP,
    DocumentoTipo.PADRON,
    DocumentoTipo.CEC,
]

# Publica los enums de Python en el schema sin duplicarlos.
strawberry.enum(EstadoCamion)
strawberry.enum(EstadoViaje)
strawberry.enum(DocumentoTipo)


@strawberry.type(name="TipoCamion")
class TipoCamionType:
    id: int
    nombre: str

    @staticmethod
    def from_model(tipo: TipoCamion) -> "TipoCamionType":
        return TipoCamionType(id=tipo.id, nombre=tipo.tipo)


@strawberry.type(name="DocumentoCamion")
class DocumentoCamionType:
    id: int
    tipo: DocumentoTipo
    fecha_emision: date
    fecha_vencimiento: date
    vigente: bool

    @staticmethod
    def from_model(documento: Documento, vigente: bool) -> "DocumentoCamionType":
        return DocumentoCamionType(
            id=documento.id,
            tipo=documento.tipo,
            fecha_emision=documento.fecha_emision.date(),
            fecha_vencimiento=documento.fecha_vencimiento.date(),
            vigente=vigente,
        )


@strawberry.type(name="Camion")
class CamionType:
    id: int
    patente: str
    marca: str
    modelo: str
    anio: int
    id_tipo_camion: int
    tipo: str
    peso_max_kg: float
    volumen_max_m3: float
    rendimiento_base_km_l: float
    kilometraje_actual: int
    estado: EstadoCamion
    motivo_bloqueo: str | None = strawberry.field(
        description="Motivo por el que el camión no puede asignarse; null si está disponible."
    )
    documentos: list[DocumentoCamionType]

    @staticmethod
    def from_evaluado(evaluado: CamionEvaluado) -> "CamionType":
        c = evaluado.camion
        documentos = sorted(c.documentos, key=lambda d: ORDEN_DOCUMENTOS.index(d.tipo))
        return CamionType(
            id=c.id,
            patente=c.patente,
            marca=c.marca,
            modelo=c.modelo,
            anio=c.anio,
            id_tipo_camion=c.id_tipo_camion,
            tipo=c.tipo_camion.tipo,
            # Decimal → float: el front espera number y Strawberry serializa Decimal como string.
            peso_max_kg=float(c.peso_kg),
            volumen_max_m3=float(c.volumen_m3),
            rendimiento_base_km_l=float(c.rendimiento_base_km_l),
            kilometraje_actual=c.kilometraje_actual,
            estado=evaluado.estado,
            motivo_bloqueo=evaluado.motivo_bloqueo,
            documentos=[
                DocumentoCamionType.from_model(d, evaluado.documento_vigente(d))
                for d in documentos
            ],
        )


@strawberry.type(name="ViajeCamion")
class ViajeCamionType:
    id: int
    fecha_inicio: datetime
    fecha_fin: datetime
    origen: str
    destino: str
    distancia_km: float
    conductor: str
    peso_kg: float
    ocupacion_pct: float = strawberry.field(
        description="Porcentaje de la capacidad en peso del camión usado en el viaje."
    )
    estado: EstadoViaje

    @staticmethod
    def from_dominio(v: ViajeDelCamion) -> "ViajeCamionType":
        return ViajeCamionType(
            id=v.viaje.id,
            fecha_inicio=v.viaje.fecha_inicio,
            fecha_fin=v.viaje.fecha_fin,
            origen=v.origen,
            destino=v.destino,
            distancia_km=float(v.distancia_km),
            conductor=v.conductor,
            peso_kg=float(v.peso_kg),
            ocupacion_pct=v.ocupacion_pct,
            estado=v.estado,
        )


@strawberry.type(name="HistorialCamion")
class HistorialCamionType:
    viajes: list[ViajeCamionType]
    total_km: float
    total_kg: float

    @staticmethod
    def from_dominio(h: HistorialCamion) -> "HistorialCamionType":
        return HistorialCamionType(
            viajes=[ViajeCamionType.from_dominio(v) for v in h.viajes],
            total_km=float(h.total_km),
            total_kg=float(h.total_kg),
        )
