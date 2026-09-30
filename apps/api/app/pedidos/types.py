"""Tipos GraphQL de salida de pedidos.

Strawberry pasa snake_case a camelCase automáticamente.
"""

from datetime import datetime

import strawberry

from app.clientes.types import CentroDistribucionType, ClienteType
from app.models.pedido import MercaderiaTipo, Pedido, PedidoEstado


@strawberry.type(name="Pedido")
class PedidoType:
    id: int
    id_cliente: int
    id_centro: int
    peso_kg: float
    volumen_m3: float
    ventana_inicio: datetime
    ventana_fin: datetime
    tipo_mercaderia: MercaderiaTipo
    estado: PedidoEstado
    id_carga_activa: int | None = strawberry.field(
        default=None,
        description="Carga Creada, Confirmada o En ruta que contiene al pedido.",
    )
    cliente: ClienteType | None = None
    centro: CentroDistribucionType | None = None

    @staticmethod
    def from_model(p: Pedido) -> "PedidoType":
        return PedidoType(
            id=p.id,
            id_cliente=p.id_cliente,
            id_centro=p.id_centro,
            peso_kg=float(p.peso_kg),
            volumen_m3=float(p.volumen_m3),
            ventana_inicio=p.ventana_inicio,
            ventana_fin=p.ventana_fin,
            tipo_mercaderia=p.tipo_mercaderia,
            estado=p.estado,
            id_carga_activa=carga.id if (carga := p.carga_activa()) else None,
            cliente=ClienteType.from_model(p.cliente) if p.cliente else None,
            centro=CentroDistribucionType.from_model(p.centro) if p.centro else None,
        )
