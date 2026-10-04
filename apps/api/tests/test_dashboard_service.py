"""Tests de DashboardService (H6.x): resumen operativo.

El control de rol y `porcentaje_ocupacion` ya están en test_admin_roles.py.
"""

from datetime import datetime, timedelta
from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.core import tiempo
from app.core.errors import DomainError
from app.dashboard.inputs import DashboardFiltros
from app.dashboard.service import DashboardService
from app.models import DocumentoTipo
from app.models.pedido import CargaEstado

ADMIN = SimpleNamespace(id=1, rol="ADMINISTRADOR")


@pytest.fixture
def repo():
    r = MagicMock()
    r.listar_viajes_en_curso = AsyncMock(return_value=[])
    r.listar_pedidos_creados = AsyncMock(return_value=[])
    r.listar_camiones_activos = AsyncMock(return_value=[])
    r.listar_documentos_hasta = AsyncMock(return_value=[])
    return r


@pytest.mark.parametrize("dias", [-1, 366])
async def test_rango_de_alertas_fuera_de_limites(session, repo, dias):
    with pytest.raises(DomainError, match="entre 0 y 365"):
        await DashboardService(session, repo).resumen(
            ADMIN, DashboardFiltros(dias_alerta_documentos=dias)
        )


async def test_resumen_con_flota_vacia(session, repo):
    resumen = await DashboardService(session, repo).resumen(ADMIN)
    assert resumen.camiones_activos == 0
    assert resumen.ocupacion_flota_pct == Decimal(0)
    assert resumen.viajes_en_curso == []


async def test_resumen_calcula_ocupacion_pendientes_y_alertas(session, repo):
    pedido = SimpleNamespace(peso_kg=Decimal(2500))
    viaje = SimpleNamespace(
        id=9,
        id_camion=1,
        fecha_inicio=datetime(2026, 9, 1, 8),
        camion=SimpleNamespace(patente="ABCD-12"),
        conductor=SimpleNamespace(nombres="Ana", apellidos="Rojas"),
        carga=SimpleNamespace(
            centro=SimpleNamespace(direccion="CD Antofagasta"), pedidos=[pedido]
        ),
    )
    repo.listar_viajes_en_curso.return_value = [viaje]
    repo.listar_camiones_activos.return_value = [
        SimpleNamespace(peso_kg=Decimal(5000)),
        SimpleNamespace(peso_kg=Decimal(5000)),
    ]
    repo.listar_pedidos_creados.return_value = [
        SimpleNamespace(
            id=1, peso_kg=Decimal(100), ventana_fin=datetime(2026, 10, 9), cargas=[]
        ),
        SimpleNamespace(
            id=2,
            peso_kg=Decimal(100),
            ventana_fin=datetime(2026, 10, 9),
            cargas=[SimpleNamespace(estado=CargaEstado.CREADA)],  # ya planificado
        ),
    ]
    vence = datetime.combine(tiempo.hoy() + timedelta(days=10), datetime.min.time())
    repo.listar_documentos_hasta.return_value = [
        (
            SimpleNamespace(id=3, tipo=DocumentoTipo.SOAP, fecha_vencimiento=vence),
            "ABCD-12",
        )
    ]

    resumen = await DashboardService(session, repo).resumen(ADMIN)

    assert resumen.ocupacion_flota_pct == Decimal("25.0")  # 2.500 de 10.000 kg
    assert resumen.camiones_en_ruta == 1
    assert resumen.viajes_en_curso[0].conductor == "Ana Rojas"
    assert [p.id for p in resumen.pedidos_sin_planificar] == [1]
    assert resumen.documentos_por_vencer[0].dias_restantes == 10
