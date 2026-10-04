"""Tests de CargasService (HU4.1–4.3): armado, confirmación y ocupación."""

from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.cargas.service import CargasService, FactorLimitante, incompatibilidad, totales
from app.core.errors import DomainError
from app.models.pedido import CargaEstado, MercaderiaTipo, PedidoEstado


def _pedido(id=1, peso=100, volumen=1, tipo=MercaderiaTipo.GENERAL, centro=7):
    return SimpleNamespace(
        id=id,
        peso_kg=Decimal(peso),
        volumen_m3=Decimal(volumen),
        tipo_mercaderia=tipo,
        id_centro=centro,
        estado=PedidoEstado.CREADA,
        carga_activa=lambda: None,
    )


def _camion(peso=1000, volumen=10):
    return SimpleNamespace(
        patente="ABCD-12", peso_kg=Decimal(peso), volumen_m3=Decimal(volumen)
    )


@pytest.fixture
def cargas():
    return MagicMock()


@pytest.fixture
def service(session, cargas):
    return CargasService(session, cargas, MagicMock())


# ── Funciones de cálculo ─────────────────────────────────────────────────────


def test_totales_suma_peso_y_volumen():
    assert totales([_pedido(peso=100, volumen=1), _pedido(peso=250, volumen=3)]) == (
        Decimal(350),
        Decimal(4),
    )


@pytest.mark.parametrize(
    ("tipos", "compatibles"),
    [
        ([MercaderiaTipo.GENERAL, MercaderiaTipo.FRAGIL], True),
        ([MercaderiaTipo.REFRIGERADA, MercaderiaTipo.REFRIGERADA], True),
        ([MercaderiaTipo.REFRIGERADA, MercaderiaTipo.GENERAL], False),
        ([MercaderiaTipo.REFRIGERADA, MercaderiaTipo.PELIGROSA], False),
    ],
)
def test_incompatibilidad_de_mercaderia(tipos, compatibles):
    pedidos = [_pedido(tipo=t) for t in tipos]
    assert (incompatibilidad(pedidos) is None) == compatibles


def test_ocupacion_indica_el_factor_limitante(service):
    ocupacion = service.calcular_ocupacion(
        [_pedido(peso=250, volumen=8)], _camion(peso=1000, volumen=10)
    )
    assert ocupacion.porcentaje_peso == 25.0
    assert ocupacion.porcentaje_volumen == 80.0
    assert ocupacion.factor_limitante == FactorLimitante.VOLUMEN
    assert not ocupacion.excede


@pytest.mark.parametrize(
    ("peso", "volumen", "mensaje"),
    [(1500, 5, "pesa 1.500 kg"), (500, 12, "ocupa 12 m³")],
)
def test_validar_capacidad_rechaza_si_excede(service, peso, volumen, mensaje):
    with pytest.raises(DomainError, match=mensaje):
        service.validar_capacidad([_pedido(peso=peso, volumen=volumen)], _camion())


# ── crear_carga / confirmar_carga ────────────────────────────────────────────


async def test_crear_carga_exige_pedidos(service):
    with pytest.raises(DomainError, match="al menos un pedido"):
        await service.crear_carga([])


async def test_crear_carga_exige_mismo_centro(service, cargas, session):
    cargas.pedidos_por_id = AsyncMock(
        return_value=[_pedido(id=1, centro=7), _pedido(id=2, centro=8)]
    )
    with pytest.raises(DomainError, match="mismo centro de distribución"):
        await service.crear_carga([1, 2])
    session.commit.assert_not_awaited()


async def test_crear_carga_rechaza_pedido_inexistente(service, cargas):
    cargas.pedidos_por_id = AsyncMock(return_value=[_pedido(id=1)])
    with pytest.raises(DomainError, match="No existe el pedido #2"):
        await service.crear_carga([1, 2])


async def test_confirmar_rechaza_mercaderia_incompatible(service, cargas, session):
    carga = SimpleNamespace(
        estado=CargaEstado.CREADA,
        pedidos=[
            _pedido(tipo=MercaderiaTipo.REFRIGERADA),
            _pedido(tipo=MercaderiaTipo.GENERAL),
        ],
    )
    cargas.obtener = AsyncMock(return_value=carga)
    with pytest.raises(DomainError, match="No se puede mezclar"):
        await service.confirmar_carga(1)
    assert carga.estado == CargaEstado.CREADA
    session.commit.assert_not_awaited()


async def test_confirmar_rechaza_si_ningun_camion_puede_llevarla(service, cargas):
    cargas.obtener = AsyncMock(
        return_value=SimpleNamespace(
            estado=CargaEstado.CREADA, pedidos=[_pedido(peso=5000)]
        )
    )
    cargas.camiones_activos = AsyncMock(return_value=[_camion(peso=1000)])
    with pytest.raises(DomainError, match="Ningún camión de la flota"):
        await service.confirmar_carga(1)


async def test_confirmar_carga_valida(service, cargas, session):
    carga = SimpleNamespace(estado=CargaEstado.CREADA, pedidos=[_pedido()])
    cargas.obtener = AsyncMock(return_value=carga)
    cargas.camiones_activos = AsyncMock(return_value=[_camion()])

    await service.confirmar_carga(1)

    assert carga.estado == CargaEstado.CONFIRMADA
    session.commit.assert_awaited_once()


async def test_no_se_cancela_una_carga_en_ruta(service, cargas):
    cargas.obtener = AsyncMock(return_value=SimpleNamespace(estado=CargaEstado.EN_RUTA))
    with pytest.raises(DomainError, match="Creada o Confirmada"):
        await service.cancelar_carga(1)


# ── Transiciones que dispara el viaje (E05) ──────────────────────────────────


def test_ciclo_de_vida_de_la_carga_con_el_viaje(service):
    carga = SimpleNamespace(
        estado=CargaEstado.CONFIRMADA, pedidos=[_pedido(), _pedido(id=2)]
    )

    service.al_iniciar_viaje(carga)
    assert carga.estado == CargaEstado.EN_RUTA
    assert {p.estado for p in carga.pedidos} == {PedidoEstado.TRANSITO}

    service.al_cancelar_viaje(carga)
    assert carga.estado == CargaEstado.CONFIRMADA
    assert {p.estado for p in carga.pedidos} == {PedidoEstado.CREADA}

    service.al_iniciar_viaje(carga)
    service.al_finalizar_viaje(carga)
    assert carga.estado == CargaEstado.FINALIZADA
    assert {p.estado for p in carga.pedidos} == {PedidoEstado.ENTREGADO}


def test_solo_una_carga_confirmada_sale_en_viaje(service):
    with pytest.raises(DomainError, match="Sólo una carga Confirmada"):
        service.al_iniciar_viaje(SimpleNamespace(estado=CargaEstado.CREADA, pedidos=[]))
