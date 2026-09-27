from datetime import datetime

from sqlmodel import Field, Relationship, SQLModel

from app.models.camion import Camion
from app.models.conductor import Conductor
from app.models.pedido import Carga


class Viaje(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    id_conductor: int = Field(foreign_key="conductor.id")
    id_camion: int = Field(foreign_key="camion.id")
    id_carga: int = Field(foreign_key="carga.id")
    fecha_inicio: datetime
    fecha_fin: datetime

    # Relationships for convenience
    conductor: Conductor | None = Relationship()
    camion: Camion | None = Relationship()
    carga: Carga | None = Relationship()
