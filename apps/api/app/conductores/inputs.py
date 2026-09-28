"""Tipos GraphQL de entrada de conductores y su traducción a datos del service."""

from datetime import date

import strawberry

from app.conductores.service import DatosConductor, DatosLicencia, EstadoConductor
from app.models import LicenciaClase


@strawberry.input(description="Filtros combinables del panel de personal (HU2.1).")
class ConductorFiltros:
    busqueda: str | None = None
    clase: LicenciaClase | None = None
    estado: EstadoConductor | None = None


@strawberry.input(description="Datos personales del conductor (HU2.2).")
class ConductorInput:
    rut: str
    nombres: str
    apellidos: str
    telefono: str
    email: str

    def to_datos(self) -> DatosConductor:
        return DatosConductor(
            rut=self.rut,
            nombres=self.nombres,
            apellidos=self.apellidos,
            telefono=self.telefono,
            email=self.email,
        )


@strawberry.input(description="Licencia de conducir: clases y vigencia (HU2.2).")
class LicenciaInput:
    clases: list[LicenciaClase]
    fecha_emision: date
    fecha_vencimiento: date

    def to_datos(self) -> DatosLicencia:
        return DatosLicencia(
            clases=list(self.clases),
            fecha_emision=self.fecha_emision,
            fecha_vencimiento=self.fecha_vencimiento,
        )


@strawberry.input(
    description="Registro de un conductor nuevo: sus datos más su licencia."
)
class RegistroConductorInput(ConductorInput):
    licencia: LicenciaInput
