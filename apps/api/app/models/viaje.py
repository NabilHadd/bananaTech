from datetime import datetime

from sqlalchemy import Index, text
from sqlmodel import Field, Relationship, SQLModel

from app.models.camion import Camion
from app.models.conductor import Conductor
from app.models.pedido import Carga


class Viaje(SQLModel, table=True):
    # Una carga tiene a lo más un viaje vigente. Si el viaje se cancela, la
    # carga vuelve a Confirmada y puede salir en otro: los cancelados no cuentan.
    __table_args__ = (
        Index(
            "viaje_id_carga_vigente_key",
            "id_carga",
            unique=True,
            postgresql_where=text("fecha_cancelacion IS NULL"),
        ),
    )

    id: int | None = Field(default=None, primary_key=True)
    id_conductor: int = Field(foreign_key="conductor.id")
    id_camion: int = Field(foreign_key="camion.id")
    id_carga: int = Field(foreign_key="carga.id")
    fecha_inicio: datetime
    # Término previsto: se fija al generar el viaje.
    fecha_fin: datetime

    # Datos de la llegada al centro de distribución: se registran al
    # finalizar el viaje, junto con el paso de la carga a Finalizada.
    fecha_llegada: datetime | None = Field(default=None)
    receptor: str | None = Field(default=None)
    observacion: str | None = Field(default=None)
    # Se registra al cancelar el viaje (HU5.3); null si no se canceló.
    fecha_cancelacion: datetime | None = Field(default=None)
    
    # Relationships for convenience
    conductor: Conductor | None = Relationship()
    camion: Camion | None = Relationship()
    carga: Carga | None = Relationship()
