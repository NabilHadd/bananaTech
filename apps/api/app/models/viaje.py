from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlmodel import Field, Relationship, SQLModel

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
    fecha_cancelacion: Optional[datetime] = Field(default=None)
    receptor: Optional[str] = Field(default=None)
    observacion: Optional[str] = Field(default=None)

    precio_diesel_clp_litro: Decimal | None = Field(default=None, max_digits=10, decimal_places=2)
    tarifa_peajes_clp_km: Decimal | None = Field(default=None, max_digits=10, decimal_places=4)
    costo_operacion_clp_km: Decimal | None = Field(default=None, max_digits=10, decimal_places=4)
    tarifa_venta_clp_ton_km: Decimal | None = Field(default=None, max_digits=10, decimal_places=4)
    costo_diesel_clp: Decimal | None = Field(default=None, max_digits=14, decimal_places=2)
    costo_peajes_clp: Decimal | None = Field(default=None, max_digits=14, decimal_places=2)
    costo_operacion_clp: Decimal | None = Field(default=None, max_digits=14, decimal_places=2)
    ingreso_total_clp: Decimal | None = Field(default=None, max_digits=14, decimal_places=2)
    margen_clp: Decimal | None = Field(default=None, max_digits=14, decimal_places=2)
    margen_porcentaje: Decimal | None = Field(default=None, max_digits=8, decimal_places=2)
    
    # Relationships for convenience
    conductor: Optional[Conductor] = Relationship()
    camion: Optional[Camion] = Relationship()
    carga: Optional[Carga] = Relationship()
