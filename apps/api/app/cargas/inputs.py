from dataclasses import dataclass


@dataclass(frozen=True)
class CrearCargaInput:
    id_pedidos: list[int]


@dataclass(frozen=True)
class AgregarPedidosCargaInput:
    id_carga: int
    id_pedidos: list[int]


@dataclass(frozen=True)
class QuitarPedidoCargaInput:
    id_carga: int
    id_pedido: int


@dataclass(frozen=True)
class OcupacionCargaInput:
    id_carga: int
    id_camion: int


@dataclass(frozen=True)
class CargaIdInput:
    id: int