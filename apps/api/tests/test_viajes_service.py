"""Tests de ViajesService (HU5.1–5.4): generar, finalizar y cancelar viajes.

Las transiciones de la carga las hace el CargasService real (no toca la
base); flota, conductores y los repositorios son falsos.
"""

from datetime import datetime, timedelta
from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.cargas.service import CargasService
from app.core import tiempo
from app.core.errors import DomainError
from app.models.pedido import CargaEstado, PedidoEstado
from app.viajes.service import DatosLlegada, DatosViaje, ViajesService

SALIDA = datetime(2026, 9, 1, 8, 0)


def _carga(estado=CargaEstado.CONFIRMADA):
    return SimpleNamespace(
        id=5,
        estado=estado,
        centro=SimpleNamespace(
            direccion="CD Antofagasta", distancia_km=Decimal(400), distancia_min=480
        ),
        pedidos=[
            SimpleNamespace(
                peso_kg=Decimal(2500),
                volumen_m3=Decimal(10),
                estado=PedidoEstado.CREADA,
            ),
            SimpleNamespace(
                peso_kg=Decimal(1500), volumen_m3=Decimal(5), estado=PedidoEstado.CREADA
            ),
        ],
    )


def _camion():
    return SimpleNamespace(
        id=1,
        patente="ABCD-12",
        id_tipo_camion=2,
        peso_kg=Decimal(20000),
        volumen_m3=Decimal(60),
        rendimiento_base_km_l=Decimal(3),
        kilometraje_actual=10_000,
    )


def _viaje_en_ruta(carga=None):
    return SimpleNamespace(
        id=9,
        id_carga=5,
        id_camion=1,
        id_conductor=3,
        fecha_inicio=SALIDA,
        fecha_fin=SALIDA + timedelta(hours=8),
        fecha_llegada=None,
        fecha_cancelacion=None,
        receptor=None,
        observacion=None,
        carga=carga or _carga(estado=CargaEstado.EN_RUTA),
        camion=_camion(),
        precio_diesel_clp_litro=None,
        tarifa_peajes_clp_km=None,
        costo_operacion_clp_km=None,
        viatico_diario_clp=None,
        tarifa_venta_clp_ton_km=None,
        costo_diesel_clp=None,
        costo_peajes_clp=None,
        costo_operacion_clp=None,
        costo_viatico_clp=None,
        ingreso_total_clp=None,
        margen_clp=None,
        margen_porcentaje=None,
    )


@pytest.fixture
def deps(session):
    viajes = MagicMock()
    viajes.bloquear = AsyncMock()
    viajes.bloquear_viaje = AsyncMock()
    cargas_repo = MagicMock()
    flota = MagicMock()
    flota.obtener_camion = AsyncMock(return_value=SimpleNamespace(camion=_camion()))
    flota.listar_camiones = AsyncMock(return_value=[])
    conductores = MagicMock()
    conductores.obtener_conductor = AsyncMock(
        return_value=SimpleNamespace(conductor=SimpleNamespace(id=3))
    )
    conductores.listar_conductores = AsyncMock(return_value=[])
    return SimpleNamespace(
        viajes=viajes,
        cargas_repo=cargas_repo,
        cargas=CargasService(session, cargas_repo, MagicMock()),
        flota=flota,
        conductores=conductores,
    )


@pytest.fixture
def service(session, deps):
    return ViajesService(
        session, deps.viajes, deps.cargas, deps.flota, deps.conductores
    )


def _llegada(**cambios) -> DatosLlegada:
    datos = {
        "fecha_llegada": SALIDA + timedelta(hours=7),
        "receptor": "Ana Rojas",
        "observacion": None,
    }
    datos.update(cambios)
    return DatosLlegada(**datos)


# ── Generar (HU5.1) ──────────────────────────────────────────────────────────


async def test_solo_una_carga_confirmada_puede_salir(service, deps):
    deps.cargas_repo.obtener = AsyncMock(return_value=_carga(estado=CargaEstado.CREADA))
    with pytest.raises(DomainError, match="sólo una carga Confirmada"):
        await service.proponer_viaje(5)


async def test_proponer_sin_camiones_explica_la_causa(service, deps):
    deps.cargas_repo.obtener = AsyncMock(return_value=_carga())
    with pytest.raises(
        DomainError, match="No hay camión disponible con capacidad para 4000 kg"
    ):
        await service.proponer_viaje(5)


async def test_agregar_viaje_arranca_la_carga_y_estima_costos(service, deps, session):
    carga = _carga()
    deps.cargas_repo.obtener = AsyncMock(return_value=carga)
    deps.flota.verificar_asignable = AsyncMock(return_value=_camion())
    deps.conductores.verificar_asignable = AsyncMock(return_value=SimpleNamespace(id=3))
    deps.viajes.obtener = AsyncMock(
        side_effect=lambda id: deps.viajes.agregar.call_args.args[0]
    )

    detalle = await service.agregar_viaje(
        DatosViaje(id_carga=5, id_camion=1, id_conductor=3)
    )

    viaje = detalle.viaje
    assert carga.estado == CargaEstado.EN_RUTA
    assert {p.estado for p in carga.pedidos} == {PedidoEstado.TRANSITO}
    assert viaje.fecha_fin - viaje.fecha_inicio == timedelta(minutes=480)
    # Tarifas copiadas de los parámetros (valores por defecto de config).
    assert viaje.precio_diesel_clp_litro == Decimal(1300)
    assert viaje.costo_diesel_clp == Decimal(173333)  # 400 km / 3 km/L * 1.300
    assert viaje.costo_peajes_clp == Decimal(20000)
    assert viaje.ingreso_total_clp is None  # se calcula al finalizar
    session.commit.assert_awaited_once()


# ── Finalizar (HU5.2 + H5.4) ─────────────────────────────────────────────────


async def test_finalizar_entrega_la_carga_y_calcula_el_margen(service, deps, session):
    viaje = _viaje_en_ruta()
    deps.viajes.obtener = AsyncMock(return_value=viaje)

    await service.finalizar_viaje(9, _llegada(observacion="  Sin novedad "))

    assert viaje.receptor == "Ana Rojas"
    assert viaje.observacion == "Sin novedad"
    assert viaje.carga.estado == CargaEstado.FINALIZADA
    assert viaje.camion.kilometraje_actual == 10_400
    # Ingreso: 4 t * 400 km * 250 CLP/ton-km. Costos: 173.333 + 20.000 + 120.000 + 15.000
    assert viaje.ingreso_total_clp == Decimal(400000)
    assert viaje.margen_clp == Decimal(71667)
    assert viaje.margen_porcentaje == Decimal("17.92")
    session.commit.assert_awaited_once()


@pytest.mark.parametrize(
    ("cambios", "mensaje"),
    [
        ({"receptor": "   "}, "Indique quién recibió"),
        ({"fecha_llegada": SALIDA - timedelta(hours=1)}, "posterior a la salida"),
        ({"fecha_llegada": tiempo.ahora() + timedelta(days=1)}, "en el futuro"),
    ],
)
async def test_finalizar_valida_la_llegada(service, deps, session, cambios, mensaje):
    deps.viajes.obtener = AsyncMock(return_value=_viaje_en_ruta())
    with pytest.raises(DomainError, match=mensaje):
        await service.finalizar_viaje(9, _llegada(**cambios))
    session.commit.assert_not_awaited()


async def test_no_se_finaliza_un_viaje_cancelado(service, deps):
    viaje = _viaje_en_ruta()
    viaje.fecha_cancelacion = SALIDA + timedelta(hours=1)
    deps.viajes.obtener = AsyncMock(return_value=viaje)
    with pytest.raises(
        DomainError, match="sólo se finaliza o cancela un viaje en ruta"
    ):
        await service.finalizar_viaje(9, _llegada())


# ── Cancelar (HU5.3) ─────────────────────────────────────────────────────────


async def test_cancelar_devuelve_la_carga_a_confirmada(service, deps, session):
    viaje = _viaje_en_ruta()
    deps.viajes.obtener = AsyncMock(return_value=viaje)

    await service.cancelar_viaje(9)

    assert viaje.fecha_cancelacion is not None
    assert viaje.carga.estado == CargaEstado.CONFIRMADA
    assert {p.estado for p in viaje.carga.pedidos} == {PedidoEstado.CREADA}
    session.commit.assert_awaited_once()


async def test_cancelar_viaje_inexistente(service, deps):
    deps.viajes.obtener = AsyncMock(return_value=None)
    with pytest.raises(DomainError, match="No existe el viaje #9"):
        await service.cancelar_viaje(9)
