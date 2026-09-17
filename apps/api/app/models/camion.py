from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Optional, List

from sqlmodel import Field, SQLModel, Relationship


class DocumentoTipo(str, Enum):
    SOAP = "SOAP"
    RT = "RT"
    PC = "PC"
    PADRON = "PADRON"
    CEC = "CEC"


class CamionTipo(str, Enum):
    # Tipos de camiones genéricos. Se puede ajustar según negocio.
    REFRIGERADO = "Refrigerado"
    TOLVA = "Tolva"
    PLANA = "Plana"
    RAMPLA = "Rampla"


class TipoCamion(SQLModel, table=True):
    __tablename__ = "tipo_camion"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    # Según la doc, tiene un enum camion_tipo único. 
    tipo: str = Field(unique=True, description="Tipo del camión (ej. Tolva, Rampla, etc.)")
    
    camiones: List["Camion"] = Relationship(back_populates="tipo_camion")
    clases_licencia: List["ClaseLicencia"] = Relationship(
        back_populates="tipos_camion",
        link_model="ClaseLicenciaTipoCamion"
    )


class Camion(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    patente: str
    id_tipo: int = Field(foreign_key="tipo_camion.id")
    peso_kg: Decimal = Field(gt=0, max_digits=10, decimal_places=2)
    volumen_m3: Decimal = Field(gt=0, max_digits=10, decimal_places=2)
    
    tipo_camion: Optional[TipoCamion] = Relationship(back_populates="camiones")
    documentos: List["Documento"] = Relationship(back_populates="camion")


class Documento(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    # Nota: la doc decía FK centro_distribucion.id, pero por nombre y contexto es camion.id
    id_camion: int = Field(foreign_key="camion.id")
    tipo: DocumentoTipo
    fecha_emision: datetime
    fecha_vencimiento: datetime
    
    camion: Optional[Camion] = Relationship(back_populates="documentos")
