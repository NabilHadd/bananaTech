from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel, Relationship

from app.models.camion import Camion
from app.models.conductor import Conductor
from app.models.pedido import Carga


class Viaje(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    id_conductor: int = Field(foreign_key="conductor.id")
    id_camion: int = Field(foreign_key="camion.id")
    id_carga: int = Field(foreign_key="carga.id")
    fecha_inicio: datetime
    # Término previsto: se fija al generar el viaje.
    fecha_fin: datetime

    # Datos de la llegada al centro de distribución: se registran al
    # finalizar el viaje, junto con el paso de la carga a Finalizada.
    fecha_llegada: Optional[datetime] = Field(default=None)
    receptor: Optional[str] = Field(default=None)
    observacion: Optional[str] = Field(default=None)
    
    # Relationships for convenience
    conductor: Optional[Conductor] = Relationship()
    camion: Optional[Camion] = Relationship()
    carga: Optional[Carga] = Relationship()
