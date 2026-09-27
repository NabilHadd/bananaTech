from datetime import datetime
from decimal import Decimal
from enum import StrEnum
from typing import TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel

from app.models.conductor import ClaseLicenciaTipoCamion

if TYPE_CHECKING:
    from app.models.conductor import ClaseLicencia
    from app.models.mantencion import Mantencion


class DocumentoTipo(StrEnum):
    SOAP = "SOAP"
    RT = "RT"
    PC = "PC"
    PADRON = "PADRON"
    CEC = "CEC"


class CamionEstadoOperativo(StrEnum):
    DISPONIBLE = "Disponible"
    EN_TRANSITO = "En tránsito"
    NO_HABILITADO = "No habilitado"
    INACTIVO = "Inactivo"


class TipoCamion(SQLModel, table=True):
    __tablename__ = "tipo_camion"

    id: int | None = Field(default=None, primary_key=True)
    # Catálogo: los tipos se agregan como filas, no como valores de un enum,
    # para no requerir migración cada vez que el negocio suma uno nuevo.
    tipo: str = Field(
        unique=True, description="Tipo del camión (ej. Tolva, Rampla, etc.)"
    )

    camiones: list["Camion"] = Relationship(back_populates="tipo_camion")
    clases_licencia: list["ClaseLicencia"] = Relationship(
        back_populates="tipos_camion", link_model=ClaseLicenciaTipoCamion
    )


class Camion(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    patente: str = Field(unique=True)
    id_tipo_camion: int = Field(foreign_key="tipo_camion.id")
    peso_kg: Decimal = Field(gt=0, max_digits=10, decimal_places=2)
    volumen_m3: Decimal = Field(gt=0, max_digits=10, decimal_places=2)
    activo: bool = Field(default=True)

    tipo_camion: TipoCamion | None = Relationship(back_populates="camiones")
    documentos: list["Documento"] = Relationship(back_populates="camion")
    mantenciones: list["Mantencion"] = Relationship(back_populates="camion")


class Documento(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    # La doc decía FK centro_distribucion.id; confirmado con el equipo que es un typo,
    # un documento pertenece a un camión.
    id_camion: int = Field(foreign_key="camion.id")
    tipo: DocumentoTipo
    fecha_emision: datetime
    fecha_vencimiento: datetime

    camion: Camion | None = Relationship(back_populates="documentos")
