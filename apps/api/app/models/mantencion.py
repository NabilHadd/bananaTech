from datetime import datetime
from enum import StrEnum

from sqlmodel import Field, Relationship, SQLModel

from app.models.camion import Camion


class MantencionTipo(StrEnum):
    PREVENTIVA = "Preventiva"
    CORRECTIVA = "Correctiva"


class MantencionEstado(StrEnum):
    PROGRAMADA = "Programada"
    EN_CURSO = "En curso"
    COMPLETADA = "Completada"
    CANCELADA = "Cancelada"


class Mantencion(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    id_camion: int = Field(foreign_key="camion.id")
    tipo: MantencionTipo
    descripcion: str
    fecha_inicio: datetime
    fecha_fin: datetime | None = None
    estado: MantencionEstado = Field(default=MantencionEstado.PROGRAMADA)

    camion: Camion | None = Relationship(back_populates="mantenciones")
