from datetime import datetime
from enum import Enum
from typing import Optional, List

from sqlmodel import Field, SQLModel, Relationship


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


class ClaseLicenciaTipoCamion(SQLModel, table=True):
    __tablename__ = "clase_licencia_tipo_camion"
    
    id_clase: int = Field(foreign_key="clase_licencia.id", primary_key=True)
    id_tipo_camion: int = Field(foreign_key="tipo_camion.id", primary_key=True)


class Conductor(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    rut: str
    nombres: str
    apellidos: str
    telefono: str
    email: str
    
    licencias: List["Licencia"] = Relationship(back_populates="conductor")


class Licencia(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    id_conductor: int = Field(foreign_key="conductor.id")
    fecha_emision: datetime
    fecha_vencimiento: datetime
    
    conductor: Optional[Conductor] = Relationship(back_populates="licencias")
    clases: List["ClaseLicencia"] = Relationship(back_populates="licencia")


class ClaseLicencia(SQLModel, table=True):
    __tablename__ = "clase_licencia"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    id_licencia: int = Field(foreign_key="licencia.id")
    clase: LicenciaClase = Field(unique=True)
    descripcion: Optional[str] = Field(default=None)
    
    licencia: Optional[Licencia] = Relationship(back_populates="clases")
    tipos_camion: List["TipoCamion"] = Relationship(
        back_populates="clases_licencia",
        link_model=ClaseLicenciaTipoCamion
    )
