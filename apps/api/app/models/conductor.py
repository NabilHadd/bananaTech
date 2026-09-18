from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING, Optional, List

from sqlmodel import Field, SQLModel, Relationship

if TYPE_CHECKING:
    from app.models.camion import TipoCamion


class LicenciaClase(str, Enum):
    A1 = "A1"
    A2 = "A2"
    A3 = "A3"
    A4 = "A4"
    A5 = "A5"
    B = "B"
    C = "C"
    D = "D"
    E = "E"
    F = "F"


class LicenciaClaseLink(SQLModel, table=True):
    """N:M entre licencias y el catálogo de clases.

    Una licencia puede tener varias clases y una clase aparece en las licencias
    de muchos conductores.
    """

    __tablename__ = "licencia_clase"

    id_licencia: int = Field(foreign_key="licencia.id", primary_key=True)
    id_clase: int = Field(foreign_key="clase_licencia.id", primary_key=True)


class ClaseLicenciaTipoCamion(SQLModel, table=True):
    """N:M entre el catálogo de clases y el catálogo de tipos de camión.

    Define qué tipos de camión habilita cada clase: un conductor puede conducir
    un tipo de camión si su licencia posee al menos una clase relacionada con él.
    """

    __tablename__ = "clase_licencia_tipo_camion"

    id_clase: int = Field(foreign_key="clase_licencia.id", primary_key=True)
    id_tipo_camion: int = Field(foreign_key="tipo_camion.id", primary_key=True)


class Conductor(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    rut: str = Field(unique=True)
    nombres: str
    apellidos: str
    telefono: str
    email: str

    licencias: List["Licencia"] = Relationship(back_populates="conductor")


class Licencia(SQLModel, table=True):
    """Histórico de licencias de un conductor: sólo una vigente a la vez."""

    id: Optional[int] = Field(default=None, primary_key=True)
    id_conductor: int = Field(foreign_key="conductor.id")
    fecha_emision: datetime
    fecha_vencimiento: datetime

    conductor: Optional[Conductor] = Relationship(back_populates="licencias")
    clases: List["ClaseLicencia"] = Relationship(
        back_populates="licencias",
        link_model=LicenciaClaseLink,
    )


class ClaseLicencia(SQLModel, table=True):
    """Catálogo de clases de licencia: una fila por letra, no por conductor."""

    __tablename__ = "clase_licencia"

    id: Optional[int] = Field(default=None, primary_key=True)
    clase: LicenciaClase = Field(unique=True, description="Letra de la clase")
    descripcion: Optional[str] = Field(default=None)

    licencias: List[Licencia] = Relationship(
        back_populates="clases",
        link_model=LicenciaClaseLink,
    )
    tipos_camion: List["TipoCamion"] = Relationship(
        back_populates="clases_licencia",
        link_model=ClaseLicenciaTipoCamion,
    )
