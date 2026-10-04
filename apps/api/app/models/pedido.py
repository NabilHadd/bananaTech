from datetime import datetime
from decimal import Decimal
from enum import StrEnum

from sqlmodel import Field, Relationship, SQLModel

from app.models.cliente import CentroDistribucion, Cliente


class MercaderiaTipo(StrEnum):
    GENERAL = "General"
    REFRIGERADA = "Refrigerada"
    PELIGROSA = "Peligrosa"
    FRAGIL = "Frágil"


class PedidoEstado(StrEnum):
    CREADA = "Creada"
    TRANSITO = "Transito"
    ENTREGADO = "Entregado"
    CANCELADO = "Cancelado"


class CargaEstado(StrEnum):
    CREADA = "Creada"
    CONFIRMADA = "Confirmada"
    EN_RUTA = "En ruta"
    FINALIZADA = "Finalizada"
    CANCELADA = "Cancelada"


# Una carga activa retiene a sus pedidos: no pueden entrar a otra carga ni
# cancelarse. Las canceladas quedan en el historial y liberan sus pedidos.
CARGA_ACTIVA = (CargaEstado.CREADA, CargaEstado.CONFIRMADA, CargaEstado.EN_RUTA)


class PedidoCarga(SQLModel, table=True):
    __tablename__ = "pedido_carga"

    id_carga: int = Field(foreign_key="carga.id", primary_key=True)
    id_pedido: int = Field(foreign_key="pedido.id", primary_key=True)


class Pedido(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    id_cliente: int = Field(foreign_key="cliente.id")
    id_centro: int = Field(foreign_key="centro_distribucion.id")
    peso_kg: Decimal = Field(gt=0, max_digits=10, decimal_places=2)
    volumen_m3: Decimal = Field(gt=0, max_digits=10, decimal_places=2)
    ventana_inicio: datetime
    ventana_fin: datetime
    tipo_mercaderia: MercaderiaTipo
    # Sólo lo cambian los services de carga y viaje: Tránsito y Entregado son
    # consecuencia de que su carga salga y llegue. La entrega (hora, receptor,
    # observación) se registra en el viaje.
    estado: PedidoEstado = Field(default=PedidoEstado.CREADA)

    # Relaciones para navegación
    cliente: Cliente | None = Relationship()
    centro: CentroDistribucion | None = Relationship()

    # Relación con Carga a través de PedidoCarga
    cargas: list[Carga] = Relationship(
        back_populates="pedidos",
        link_model=PedidoCarga,
    )

    def carga_activa(self) -> Carga | None:
        """La carga que retiene al pedido, si hay una. Requiere `cargas` cargado."""
        return next((c for c in self.cargas if c.estado in CARGA_ACTIVA), None)


class Carga(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    id_centro: int = Field(foreign_key="centro_distribucion.id")
    estado: CargaEstado

    centro: CentroDistribucion | None = Relationship()
    # Relación con Pedido a través de PedidoCarga
    pedidos: list[Pedido] = Relationship(
        back_populates="cargas",
        link_model=PedidoCarga,
    )
