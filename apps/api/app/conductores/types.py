"""Tipos GraphQL de salida de conductores.

Calcan `apps/web/src/components/features/conductores/types.ts`. Strawberry pasa
los snake_case a camelCase por su cuenta.
"""

from datetime import date, datetime

import strawberry

from app.conductores.service import (
    ConductorEvaluado,
    EstadoConductor,
    HistorialConductor,
    ResumenPersonal,
    ViajeDelConductor,
)
from app.flota.service import EstadoViaje
from app.models import ClaseLicencia, Licencia, LicenciaClase

# Publica los enums de Python en el schema sin duplicarlos. EstadoViaje ya lo
# publica la flota.
strawberry.enum(EstadoConductor)
strawberry.enum(LicenciaClase)


def _tipos_habilitados(clases: list[ClaseLicencia]) -> list[str]:
    return sorted({t.tipo for c in clases for t in c.tipos_camion})


@strawberry.type(name="ClaseLicencia")
class ClaseLicenciaType:
    clase: LicenciaClase
    descripcion: str | None
    tipos_camion: list[str] = strawberry.field(
        description="Tipos de camión que habilita esta clase (RN-04)."
    )

    @staticmethod
    def from_model(clase: ClaseLicencia) -> "ClaseLicenciaType":
        return ClaseLicenciaType(
            clase=clase.clase,
            descripcion=clase.descripcion,
            tipos_camion=_tipos_habilitados([clase]),
        )


@strawberry.type(name="Licencia")
class LicenciaType:
    id: int
    clases: list[LicenciaClase]
    fecha_emision: date
    fecha_vencimiento: date
    vigente: bool = strawberry.field(
        description="Es la licencia actual y no ha vencido; las anteriores quedan como historial."
    )
    tipos_camion_habilitados: list[str]

    @staticmethod
    def from_model(licencia: Licencia, vigente: bool) -> "LicenciaType":
        return LicenciaType(
            id=licencia.id,
            clases=sorted(c.clase for c in licencia.clases),
            fecha_emision=licencia.fecha_emision.date(),
            fecha_vencimiento=licencia.fecha_vencimiento.date(),
            vigente=vigente,
            tipos_camion_habilitados=_tipos_habilitados(licencia.clases),
        )


@strawberry.type(name="Conductor")
class ConductorType:
    id: int
    rut: str
    nombres: str
    apellidos: str
    telefono: str
    email: str
    estado: EstadoConductor
    motivo_bloqueo: str | None = strawberry.field(
        description="Motivo por el que el conductor no puede asignarse; null si está disponible."
    )
    licencias: list[LicenciaType] = strawberry.field(
        description="Historial de licencias, la actual primero."
    )

    @staticmethod
    def from_evaluado(evaluado: ConductorEvaluado) -> "ConductorType":
        c = evaluado.conductor
        return ConductorType(
            id=c.id,
            rut=c.rut,
            nombres=c.nombres,
            apellidos=c.apellidos,
            telefono=c.telefono,
            email=c.email,
            estado=evaluado.estado,
            motivo_bloqueo=evaluado.motivo_bloqueo,
            licencias=[
                LicenciaType.from_model(lic, evaluado.licencia_vigente(lic))
                for lic in evaluado.licencias
            ],
        )


@strawberry.type(name="ResumenPersonal")
class ResumenPersonalType:
    total: int
    disponibles: int
    en_viaje: int
    en_descanso: int
    bloqueados: int
    inactivos: int

    @staticmethod
    def from_dominio(r: ResumenPersonal) -> "ResumenPersonalType":
        return ResumenPersonalType(
            total=r.total,
            disponibles=r.disponibles,
            en_viaje=r.en_viaje,
            en_descanso=r.en_descanso,
            bloqueados=r.bloqueados,
            inactivos=r.inactivos,
        )


@strawberry.type(name="ViajeConductor")
class ViajeConductorType:
    id: int
    fecha_inicio: datetime
    fecha_fin: datetime
    patente: str
    origen: str
    destino: str
    distancia_km: float
    peso_kg: float
    estado: EstadoViaje

    @staticmethod
    def from_dominio(v: ViajeDelConductor) -> "ViajeConductorType":
        return ViajeConductorType(
            id=v.viaje.id,
            fecha_inicio=v.viaje.fecha_inicio,
            fecha_fin=v.viaje.fecha_fin,
            patente=v.patente,
            origen=v.origen,
            destino=v.destino,
            # Decimal → float: el front espera number y Strawberry serializa Decimal como string.
            distancia_km=float(v.distancia_km),
            peso_kg=float(v.peso_kg),
            estado=v.estado,
        )


@strawberry.type(name="HistorialConductor")
class HistorialConductorType:
    viajes: list[ViajeConductorType]
    total_km: float

    @staticmethod
    def from_dominio(h: HistorialConductor) -> "HistorialConductorType":
        return HistorialConductorType(
            viajes=[ViajeConductorType.from_dominio(v) for v in h.viajes],
            total_km=float(h.total_km),
        )
