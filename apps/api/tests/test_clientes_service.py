"""Tests de ClientesService (HU3.1): registro de clientes y destinos."""

from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.clientes.service import (
    ClientesService,
    DatosCentro,
    DatosCliente,
    validar_destino,
)
from app.core.errors import DomainError


@pytest.fixture
def clientes():
    repo = MagicMock()
    repo.existe_rut = AsyncMock(return_value=False)
    repo.existe_mail = AsyncMock(return_value=False)
    repo.existe_telefono = AsyncMock(return_value=False)
    return repo


@pytest.fixture
def service(session, clientes):
    return ClientesService(session, clientes, MagicMock())


def _datos(**cambios) -> DatosCliente:
    datos = {
        "razon": "Frutícola del Valle SpA",
        "rut": "12.345.678-5",
        "mail": "contacto@fruticola.cl",
        "telefono": "912345678",
    }
    datos.update(cambios)
    return DatosCliente(**datos)


# ── validar_destino ──────────────────────────────────────────────────────────


def test_destino_lejos_de_la_base_es_valido():
    validar_destino("Av. Balmaceda 123, La Serena", Decimal("15.5"), 20)


@pytest.mark.parametrize(("km", "minutos"), [(Decimal(0), 20), (Decimal(10), 0)])
def test_la_base_no_puede_ser_destino(km, minutos):
    with pytest.raises(DomainError, match="la base es el origen"):
        validar_destino("Coquimbo", km, minutos)


# ── registrar ────────────────────────────────────────────────────────────────


@pytest.mark.parametrize(
    ("cambios", "mensaje"),
    [
        ({"razon": "  "}, "razón social es obligatoria"),
        ({"rut": ""}, "RUT es obligatorio"),
        ({"rut": "12.345.678-9"}, "dígito verificador"),
        ({"mail": "sin-arroba.cl"}, "correo .* no es válido"),
    ],
)
async def test_registrar_valida_datos(service, session, cambios, mensaje):
    with pytest.raises(DomainError, match=mensaje):
        await service.registrar(_datos(**cambios))
    session.commit.assert_not_awaited()


async def test_registrar_rechaza_rut_duplicado(service, clientes, session):
    clientes.existe_rut.return_value = True
    with pytest.raises(DomainError, match="RUT 12.345.678-5 ya está registrado"):
        await service.registrar(_datos())
    session.commit.assert_not_awaited()


async def test_registrar_rechaza_correo_duplicado(service, clientes):
    clientes.existe_mail.return_value = True
    with pytest.raises(
        DomainError, match="correo contacto@fruticola.cl ya está registrado"
    ):
        await service.registrar(_datos(mail="  Contacto@Fruticola.cl "))


async def test_registrar_rechaza_centro_nuevo_en_la_base(service):
    datos = _datos(centros_nuevos=[DatosCentro("Base Coquimbo", Decimal(0), 0)])
    with pytest.raises(DomainError, match="la base es el origen"):
        await service.registrar(datos)


async def test_registrar_guarda_datos_normalizados(service, clientes, session):
    clientes.obtener = AsyncMock(side_effect=lambda id: SimpleNamespace(id=id))

    await service.registrar(
        _datos(mail=" Contacto@Fruticola.CL ", telefono="9 1234 5678")
    )

    cliente = clientes.agregar.call_args.args[0]
    assert cliente.rut == "12.345.678-5"
    assert cliente.mail == "contacto@fruticola.cl"
    assert cliente.telefono == "+569 1234 5678"
    session.commit.assert_awaited_once()


# ── crear_centro ─────────────────────────────────────────────────────────────


async def test_crear_centro_exige_direccion(service):
    with pytest.raises(DomainError, match="dirección .* es obligatoria"):
        await service.crear_centro(DatosCentro("   ", Decimal(10), 15))
