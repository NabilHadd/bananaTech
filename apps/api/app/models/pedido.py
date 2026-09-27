from datetime import datetime
from decimal import Decimal
from enum import StrEnum

from sqlmodel import Field, Relationship, SQLModel


class MercaderiaTipo(StrEnum):
    GENERAL = "General"
    REFRIGERADA = "Refrigerada"
    PELIGROSA = "Peligrosa"
    FRAGIL = "Frágil"


class PedidoEstado(StrEnum):
    EN_ESPERA = "En espera"
    TRANSITO = "Transito"
    ENTREGADO = "Entregado"
    CANCELADO = "Cancelado"


class CargaEstado(StrEnum):
    CREADO = "Creado"
    EN_RUTA = "En ruta"
    ENTREGADA = "Entregada"
    CANCELADA = "Cancelada"


class PedidoCarga(SQLModel, table=True):
    __tablename__ = "pedido_carga"

    id_carga: int = Field(foreign_key="carga.id", primary_key=True)
    id_pedido: int = Field(foreign_key="pedido.id", primary_key=True)


class Pedido(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    id_cliente: int = Field(foreign_key="cliente.id")
    peso_kg: Decimal = Field(gt=0, max_digits=10, decimal_places=2)
    volumen_m3: Decimal = Field(gt=0, max_digits=10, decimal_places=2)
    ventana_inicio: datetime
    ventana_fin: datetime
    tipo_mercaderia: MercaderiaTipo
    estado: PedidoEstado = Field(default=PedidoEstado.EN_ESPERA)

    # Relación con Carga a través de PedidoCarga
    cargas: list["Carga"] = Relationship(
        back_populates="pedidos", link_model=PedidoCarga
    )


class Carga(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    id_centro: int = Field(foreign_key="centro_distribucion.id")
    id_camion: int | None = Field(default=None, foreign_key="camion.id")
    estado: CargaEstado = Field(default=CargaEstado.CREADO)

    # Relación con Pedido a través de PedidoCarga
    pedidos: list[Pedido] = Relationship(
        back_populates="cargas", link_model=PedidoCarga
    )
