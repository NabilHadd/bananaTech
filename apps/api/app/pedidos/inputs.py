"""Tipos GraphQL de entrada de pedidos y su traducción a datos del service."""

from datetime import date, datetime
from decimal import Decimal

import strawberry

from app.models.pedido import MercaderiaTipo, PedidoEstado
from app.pedidos.service import DatosPedido


def _decimal(valor: float) -> Decimal:
    return Decimal(str(valor))


@strawberry.input(description="Datos para registrar un nuevo pedido (HU3.2).")
class PedidoInput:
    id_cliente: int
    id_centro: int
    peso_kg: float
    volumen_m3: float
    ventana_inicio: datetime
    ventana_fin: datetime
    tipo_mercaderia: MercaderiaTipo

    def to_datos(self) -> DatosPedido:
        return DatosPedido(
            id_cliente=self.id_cliente,
            id_centro=self.id_centro,
            peso_kg=_decimal(self.peso_kg),
            volumen_m3=_decimal(self.volumen_m3),
            ventana_inicio=self.ventana_inicio,
            ventana_fin=self.ventana_fin,
            tipo_mercaderia=self.tipo_mercaderia,
        )


@strawberry.input(description="Filtros para listar pedidos (HU3.2 y HU3.4).")
class PedidoFiltros:
    busqueda: str | None = None
    estado: PedidoEstado | None = None
    tipo_mercaderia: MercaderiaTipo | None = None
    id_cliente: int | None = None
    fecha: date | None = None

