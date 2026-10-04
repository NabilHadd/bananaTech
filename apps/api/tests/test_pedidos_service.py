"""Tests de PedidosService (HU3.2–3.3): creación y cancelación de pedidos."""

from datetime import datetime, timedelta
from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.core.errors import DomainError
from app.models.pedido import MercaderiaTipo, PedidoEstado
from app.pedidos.service import DatosPedido, PedidosService

INICIO = datetime(2026, 11, 1, 8, 0)
CENTRO = SimpleNamespace(
    id=7, direccion="Av. Balmaceda 123", distancia_km=Decimal(15), distancia_min=20
)


@pytest.fixture
def repos():
    pedidos = MagicMock()
    clientes = MagicMock()
    clientes.obtener = AsyncMock(return_value=SimpleNamespace(id=1, centros=[CENTRO]))
    centros = MagicMock()
    centros.obtener = AsyncMock(return_value=CENTRO)
    return SimpleNamespace(pedidos=pedidos, clientes=clientes, centros=centros)


@pytest.fixture
def service(session, repos):
    return PedidosService(session, repos.pedidos, repos.clientes, repos.centros)


def _datos(**cambios) -> DatosPedido:
    datos = {
        "id_cliente": 1,
        "id_centro": 7,
        "peso_kg": Decimal(500),
        "volumen_m3": Decimal(2),
        "ventana_inicio": INICIO,
        "ventana_fin": INICIO + timedelta(days=2),
        "tipo_mercaderia": MercaderiaTipo.GENERAL,
    }
    datos.update(cambios)
    return DatosPedido(**datos)


# ── crear_pedido (HU3.2) ─────────────────────────────────────────────────────


@pytest.mark.parametrize(
    ("cambios", "mensaje"),
    [
        ({"peso_kg": Decimal(0)}, "peso debe ser mayor a 0"),
        ({"volumen_m3": Decimal(-1)}, "volumen debe ser mayor a 0"),
        ({"ventana_fin": INICIO - timedelta(hours=1)}, "termina antes de comenzar"),
        ({"ventana_fin": INICIO + timedelta(hours=3)}, "debe durar al menos"),
    ],
)
async def test_crear_pedido_valida_datos(service, session, cambios, mensaje):
    with pytest.raises(DomainError, match=mensaje):
        await service.crear_pedido(_datos(**cambios))
    session.commit.assert_not_awaited()


async def test_crear_pedido_rechaza_cliente_inexistente(service, repos):
    repos.clientes.obtener.return_value = None
    with pytest.raises(DomainError, match="cliente con ID 1 no existe"):
        await service.crear_pedido(_datos())


async def test_crear_pedido_rechaza_centro_de_otro_cliente(service, repos):
    repos.clientes.obtener.return_value = SimpleNamespace(id=1, centros=[])
    with pytest.raises(DomainError, match="no pertenece al cliente"):
        await service.crear_pedido(_datos())


async def test_crear_pedido_queda_en_estado_creada(service, repos, session):
    repos.pedidos.obtener = AsyncMock(return_value=None)

    pedido = await service.crear_pedido(_datos())

    assert pedido.estado == PedidoEstado.CREADA
    repos.pedidos.agregar.assert_called_once_with(pedido)
    session.commit.assert_awaited_once()


# ── cancelar_pedido (HU3.3) ──────────────────────────────────────────────────


def _pedido(estado: PedidoEstado, carga=None):
    return SimpleNamespace(id=3, estado=estado, carga_activa=lambda: carga)


async def test_cancelar_pedido_creado(service, repos, session):
    pedido = _pedido(PedidoEstado.CREADA)
    repos.pedidos.obtener = AsyncMock(return_value=pedido)

    await service.cancelar_pedido(3)

    assert pedido.estado == PedidoEstado.CANCELADO
    session.commit.assert_awaited_once()


@pytest.mark.parametrize(
    ("pedido", "mensaje"),
    [
        (None, "no existe"),
        (_pedido(PedidoEstado.CANCELADO), "ya se encuentra cancelado"),
        (_pedido(PedidoEstado.TRANSITO), "Sólo se puede cancelar un pedido en estado"),
        (
            _pedido(PedidoEstado.CREADA, carga=SimpleNamespace(id=4)),
            "está en la carga #4",
        ),
    ],
)
async def test_cancelar_pedido_rechaza(service, repos, session, pedido, mensaje):
    repos.pedidos.obtener = AsyncMock(return_value=pedido)
    with pytest.raises(DomainError, match=mensaje):
        await service.cancelar_pedido(3)
    session.commit.assert_not_awaited()
