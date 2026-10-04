"""Tests de FlotaService (E01): registro de camiones, estado y bajas."""

from datetime import datetime, timedelta
from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.core import tiempo
from app.core.errors import DomainError
from app.flota.service import (
    DatosCamion,
    DatosDocumento,
    EstadoCamion,
    EstadoViaje,
    FlotaService,
    estado_viaje,
)
from app.models import DocumentoTipo

HOY = tiempo.hoy()


def _datos_camion(**cambios) -> DatosCamion:
    datos = {
        "patente": "abcd-12",
        "marca": "Volvo",
        "modelo": "FH",
        "anio": 2020,
        "id_tipo_camion": 1,
        "peso_max_kg": Decimal(20000),
        "volumen_max_m3": Decimal(60),
        "rendimiento_base_km_l": Decimal(3),
        "kilometraje_actual": 1000,
    }
    datos.update(cambios)
    return DatosCamion(**datos)


def _documentos_vigentes() -> list[DatosDocumento]:
    return [
        DatosDocumento(tipo, HOY - timedelta(days=30), HOY + timedelta(days=300))
        for tipo in (DocumentoTipo.RT, DocumentoTipo.PC, DocumentoTipo.SOAP)
    ]


def _documento(tipo: DocumentoTipo, dias_para_vencer: int):
    vence = datetime.combine(
        HOY + timedelta(days=dias_para_vencer), datetime.min.time()
    )
    return SimpleNamespace(tipo=tipo, fecha_vencimiento=vence)


@pytest.fixture
def repos():
    camiones = MagicMock()
    camiones.existe_patente = AsyncMock(return_value=False)
    tipos = MagicMock()
    tipos.obtener = AsyncMock(return_value=SimpleNamespace(id=1))
    viajes = MagicMock()
    viajes.en_ruta_por_camion = AsyncMock(return_value={})
    return SimpleNamespace(camiones=camiones, tipos=tipos, viajes=viajes)


@pytest.fixture
def service(session, repos):
    return FlotaService(session, repos.camiones, repos.tipos, repos.viajes)


# ── estado_viaje ─────────────────────────────────────────────────────────────


@pytest.mark.parametrize(
    ("llegada", "cancelacion", "esperado"),
    [
        (None, None, EstadoViaje.EN_RUTA),
        (datetime(2026, 1, 2), None, EstadoViaje.FINALIZADO),
        (None, datetime(2026, 1, 2), EstadoViaje.CANCELADO),
    ],
)
def test_estado_viaje(llegada, cancelacion, esperado):
    viaje = SimpleNamespace(fecha_llegada=llegada, fecha_cancelacion=cancelacion)
    assert estado_viaje(viaje) == esperado


# ── evaluar (HU1.2) ──────────────────────────────────────────────────────────


def test_camion_con_documentos_al_dia_queda_disponible(service):
    camion = SimpleNamespace(
        activo=True,
        documentos=[
            _documento(DocumentoTipo.RT, 100),
            _documento(DocumentoTipo.PC, 100),
            _documento(DocumentoTipo.SOAP, 100),
        ],
    )
    assert service.evaluar(camion, HOY, None).estado == EstadoCamion.DISPONIBLE


def test_camion_con_documento_vencido_queda_bloqueado(service):
    camion = SimpleNamespace(
        activo=True,
        documentos=[
            _documento(DocumentoTipo.RT, -1),
            _documento(DocumentoTipo.PC, 100),
            _documento(DocumentoTipo.SOAP, 100),
        ],
    )
    evaluado = service.evaluar(camion, HOY, None)
    assert evaluado.estado == EstadoCamion.BLOQUEADO
    assert "Revisión Técnica" in evaluado.motivo_bloqueo


def test_camion_sin_soap_queda_bloqueado(service):
    camion = SimpleNamespace(
        activo=True,
        documentos=[
            _documento(DocumentoTipo.RT, 100),
            _documento(DocumentoTipo.PC, 100),
        ],
    )
    evaluado = service.evaluar(camion, HOY, None)
    assert evaluado.estado == EstadoCamion.BLOQUEADO
    assert "Falta Seguro Obligatorio" in evaluado.motivo_bloqueo


def test_camion_dado_de_baja_queda_inactivo(service):
    camion = SimpleNamespace(activo=False, documentos=[])
    assert service.evaluar(camion, HOY, None).estado == EstadoCamion.INACTIVO


# ── registrar (HU1.1) ────────────────────────────────────────────────────────


async def test_registrar_exige_documentos_obligatorios(service, session):
    with pytest.raises(DomainError, match="Faltan documentos obligatorios"):
        await service.registrar(_datos_camion(), _documentos_vigentes()[:2])
    session.commit.assert_not_awaited()


async def test_registrar_rechaza_patente_duplicada(service, repos, session):
    repos.camiones.existe_patente.return_value = True
    with pytest.raises(DomainError, match="ABCD-12 ya está registrada"):
        await service.registrar(_datos_camion(), _documentos_vigentes())
    session.commit.assert_not_awaited()


async def test_registrar_rechaza_documento_vencido(service):
    documentos = _documentos_vigentes()
    documentos[0].fecha_vencimiento = HOY - timedelta(days=1)
    with pytest.raises(DomainError, match="ya venció"):
        await service.registrar(_datos_camion(), documentos)


@pytest.mark.parametrize(
    ("cambios", "mensaje"),
    [
        ({"patente": "  "}, "patente es obligatoria"),
        ({"marca": ""}, "marca y el modelo son obligatorios"),
        ({"anio": 1980}, "año debe estar entre"),
        ({"peso_max_kg": Decimal(0)}, "capacidad"),
        ({"rendimiento_base_km_l": Decimal(0)}, "rendimiento"),
        ({"kilometraje_actual": -5}, "kilometraje no puede ser negativo"),
    ],
)
async def test_registrar_valida_datos_del_camion(service, cambios, mensaje):
    with pytest.raises(DomainError, match=mensaje):
        await service.registrar(_datos_camion(**cambios), _documentos_vigentes())


# ── dar_de_baja ──────────────────────────────────────────────────────────────


async def test_no_se_da_de_baja_un_camion_ya_inactivo(service, repos):
    repos.camiones.obtener = AsyncMock(
        return_value=SimpleNamespace(id=1, patente="ABCD-12", activo=False)
    )
    with pytest.raises(DomainError, match="ya está dado de baja"):
        await service.dar_de_baja(1)


async def test_no_se_da_de_baja_un_camion_en_viaje(service, repos, session):
    repos.camiones.obtener = AsyncMock(
        return_value=SimpleNamespace(id=1, patente="ABCD-12", activo=True)
    )
    repos.viajes.en_ruta_por_camion.return_value = {1: SimpleNamespace()}
    with pytest.raises(DomainError, match="viaje en ruta"):
        await service.dar_de_baja(1)
    session.commit.assert_not_awaited()
