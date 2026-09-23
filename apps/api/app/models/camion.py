from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import TYPE_CHECKING, Optional, List

from sqlmodel import Field, SQLModel, Relationship

from app.models.conductor import ClaseLicenciaTipoCamion

if TYPE_CHECKING:
    from app.models.conductor import ClaseLicencia


class DocumentoTipo(str, Enum):
    SOAP = "SOAP"
    RT = "RT"
    PC = "PC"
    PADRON = "PADRON"
    CEC = "CEC"


class TipoCamion(SQLModel, table=True):
    __tablename__ = "tipo_camion"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    # Catálogo: los tipos se agregan como filas, no como valores de un enum,
    # para no requerir migración cada vez que el negocio suma uno nuevo.
    tipo: str = Field(unique=True, description="Tipo del camión (ej. Tolva, Rampla, etc.)")
    
    camiones: List["Camion"] = Relationship(back_populates="tipo_camion")
    clases_licencia: List["ClaseLicencia"] = Relationship(
        back_populates="tipos_camion",
        link_model=ClaseLicenciaTipoCamion
    )


class Camion(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    patente: str = Field(unique=True)
    marca: str = Field(default="Genérica", description="Marca del camión (ej. Scania, Volvo)")
    modelo: str = Field(default="Genérico", description="Modelo del camión (ej. R450, FH 500)")
    anio: int = Field(default=2022, ge=1990, le=2030, description="Año de fabricación")
    id_tipo_camion: int = Field(foreign_key="tipo_camion.id")
    peso_kg: Decimal = Field(gt=0, max_digits=10, decimal_places=2)
    volumen_m3: Decimal = Field(gt=0, max_digits=10, decimal_places=2)
    rendimiento_base_km_l: Decimal = Field(default=Decimal("3.0"), gt=0, max_digits=5, decimal_places=2, description="Rendimiento base en km/L")
    kilometraje_actual: int = Field(default=0, ge=0, description="Kilometraje actual")
    activo: bool = Field(default=True, description="Indicador de baja lógica (RNF-06)")
    
    tipo_camion: Optional[TipoCamion] = Relationship(back_populates="camiones")
    documentos: List["Documento"] = Relationship(back_populates="camion")


class Documento(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    # La doc decía FK centro_distribucion.id; confirmado con el equipo que es un typo,
    # un documento pertenece a un camión.
    id_camion: int = Field(foreign_key="camion.id")
    tipo: DocumentoTipo
    fecha_emision: datetime
    fecha_vencimiento: datetime
    
    camion: Optional[Camion] = Relationship(back_populates="documentos")
