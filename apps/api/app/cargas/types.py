"""Tipos GraphQL de salida de cargas.

Strawberry pasa snake_case a camelCase automáticamente.
"""

import strawberry

from app.cargas.service import FactorLimitante, Ocupacion, incompatibilidad, totales
from app.clientes.types import CentroDistribucionType
from app.models.pedido import Carga, CargaEstado
from app.pedidos.types import PedidoType

FactorLimitanteType = strawberry.enum(FactorLimitante, name="FactorLimitante")


@strawberry.type(name="OcupacionCarga")
class OcupacionType:
    id_camion: int
    patente: str
    peso_total_kg: float
    volumen_total_m3: float
    capacidad_peso_kg: float
    capacidad_volumen_m3: float
    porcentaje_peso: float
    porcentaje_volumen: float
    factor_limitante: FactorLimitanteType
    excede: bool = strawberry.field(description="Si la carga supera al camión en peso o volumen.")

    @staticmethod
    def from_model(o: Ocupacion) -> "OcupacionType":
        return OcupacionType(
            id_camion=o.camion.id,
            patente=o.camion.patente,
            peso_total_kg=float(o.peso_total_kg),
            volumen_total_m3=float(o.volumen_total_m3),
            capacidad_peso_kg=float(o.camion.peso_kg),
            capacidad_volumen_m3=float(o.camion.volumen_m3),
            porcentaje_peso=o.porcentaje_peso,
            porcentaje_volumen=o.porcentaje_volumen,
            factor_limitante=o.factor_limitante,
            excede=o.excede,
        )


@strawberry.type(name="Carga")
class CargaType:
    id: int
    id_centro: int
    estado: CargaEstado
    centro: CentroDistribucionType | None
    pedidos: list[PedidoType]
    peso_total_kg: float
    volumen_total_m3: float
    incompatibilidad: str | None = strawberry.field(
        description="Motivo por el que sus pedidos no pueden viajar juntos (HU4.2); null si pueden."
    )

    @staticmethod
    def from_model(c: Carga) -> "CargaType":
        peso, volumen = totales(c.pedidos)
        return CargaType(
            id=c.id,
            id_centro=c.id_centro,
            estado=c.estado,
            centro=CentroDistribucionType.from_model(c.centro) if c.centro else None,
            pedidos=[PedidoType.from_model(p) for p in sorted(c.pedidos, key=lambda p: p.id)],
            peso_total_kg=float(peso),
            volumen_total_m3=float(volumen),
            incompatibilidad=incompatibilidad(c.pedidos),
        )
