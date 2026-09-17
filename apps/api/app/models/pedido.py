from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Optional, List

from sqlmodel import Field, SQLModel, Relationship


class MercaderiaTipo(str, Enum):
    GENERAL = "General"
    REFRIGERADA = "Refrigerada"
    PELIGROSA = "Peligrosa"
    FRAGIL = "Frágil"


class PedidoEstado(str, Enum):
    EN_ESPERA = "En espera"
    TRANSITO = "Transito"
    ENTREGADO = "Entregado"
    CANCELADO = "Cancelado"


class CargaEstado(str, Enum):
    CREADO = "Creado"
    EN_RUTA = "En ruta"
    CANCELADA = "Cancelada"


class PedidoCarga(SQLModel, table=True):
    __tablename__ = "pedido_carga"
    
    id_carga: int = Field(foreign_key="carga.id", primary_key=True)
    id_pedido: int = Field(foreign_key="pedido.id", primary_key=True)


class Pedido(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    id_cliente: int = Field(foreign_key="cliente.id")
    peso_kg: Decimal = Field(gt=0, max_digits=10, decimal_places=2)
    volumen_m3: Decimal = Field(gt=0, max_digits=10, decimal_places=2)
    ventana_inicio: datetime
    ventana_fin: datetime
    tipo_mercaderia: MercaderiaTipo
    estado: PedidoEstado
    
    # Relación con Carga a través de PedidoCarga
    cargas: List["Carga"] = Relationship(
        back_populates="pedidos",
        link_model=PedidoCarga
    )


class Carga(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    id_CD: int = Field(foreign_key="centro_distribucion.id")
    estado: CargaEstado
    
    # Relación con Pedido a través de PedidoCarga
    pedidos: List[Pedido] = Relationship(
        back_populates="cargas",
        link_model=PedidoCarga
    )
