from dataclasses import dataclass, field
from decimal import Decimal

from app.models.camion import Camion
from app.models.pedido import MercaderiaTipo, Pedido, PedidoEstado


@dataclass
class CargaPropuesta:
    """Pedidos asignados a un camión y capacidad consumida."""

    camion: Camion
    pedidos: list[Pedido] = field(default_factory=list)
    peso_total_kg: Decimal = Decimal("0")
    volumen_total_m3: Decimal = Decimal("0")

    @property
    def peso_disponible_kg(self) -> Decimal:
        return self.camion.peso_kg - self.peso_total_kg

    @property
    def volumen_disponible_m3(self) -> Decimal:
        return self.camion.volumen_m3 - self.volumen_total_m3

    @property
    def porcentaje_peso(self) -> Decimal:
        return self.peso_total_kg / self.camion.peso_kg * Decimal("100")

    @property
    def porcentaje_volumen(self) -> Decimal:
        return self.volumen_total_m3 / self.camion.volumen_m3 * Decimal("100")


@dataclass
class PedidoNoAsignado:
    pedido: Pedido
    motivo: str


@dataclass
class DistribucionCargas:
    cargas: list[CargaPropuesta]
    no_asignados: list[PedidoNoAsignado]


def tipos_compatibles(
    tipo_existente: MercaderiaTipo,
    tipo_nuevo: MercaderiaTipo,
) -> bool:
    """Indica si dos tipos de mercadería pueden compartir una carga.

    General puede mezclarse con frágil y refrigerada, pero nunca con peligrosa.
    Los otros tipos sólo se mezclan consigo mismos.
    """
    if MercaderiaTipo.PELIGROSA in (tipo_existente, tipo_nuevo):
        return tipo_existente == tipo_nuevo
    if MercaderiaTipo.GENERAL in (tipo_existente, tipo_nuevo):
        return True
    return tipo_existente == tipo_nuevo


def _carga_compatible(carga: CargaPropuesta, pedido: Pedido) -> bool:
    return all(
        tipos_compatibles(otro.tipo_mercaderia, pedido.tipo_mercaderia)
        for otro in carga.pedidos
    )


def _cabe_en_carga(carga: CargaPropuesta, pedido: Pedido) -> bool:
    return (
        carga.peso_total_kg + pedido.peso_kg <= carga.camion.peso_kg
        and carga.volumen_total_m3 + pedido.volumen_m3 <= carga.camion.volumen_m3
    )


def distribuir_pedidos_en_camiones(
    pedidos: list[Pedido],
    camiones: list[Camion],
) -> DistribucionCargas:
    """Distribuye pedidos pendientes en camiones usando prioridad temporal.

    El algoritmo es determinista y voraz: procesa primero la ventana de
    entrega más cercana y reutiliza el primer camión donde caben peso,
    volumen y tipo de mercadería. Cada camión representa una carga propuesta.
    Los pedidos ya entregados, cancelados o en tránsito no se reasignan.
    """
    cargas = [CargaPropuesta(camion=camion) for camion in camiones]
    no_asignados: list[PedidoNoAsignado] = []
    pendientes = sorted(
        (pedido for pedido in pedidos if pedido.estado == PedidoEstado.EN_ESPERA),
        key=lambda pedido: (pedido.ventana_inicio, pedido.ventana_fin, pedido.id or 0),
    )

    for pedido in pendientes:
        carga = next(
            (
                carga
                for carga in cargas
                if _carga_compatible(carga, pedido) and _cabe_en_carga(carga, pedido)
            ),
            None,
        )

        if carga is None:
            no_asignados.append(
                PedidoNoAsignado(
                    pedido=pedido,
                    motivo="No existe un camión con compatibilidad y capacidad suficiente",
                )
            )
            continue

        carga.pedidos.append(pedido)
        carga.peso_total_kg += pedido.peso_kg
        carga.volumen_total_m3 += pedido.volumen_m3

    return DistribucionCargas(
        cargas=[carga for carga in cargas if carga.pedidos],
        no_asignados=no_asignados,
    )