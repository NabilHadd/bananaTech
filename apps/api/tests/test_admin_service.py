"""Tests de AdministracionService (E07): usuarios, parámetros y reporte de costos.

La eliminación de usuarios ya está cubierta en test_admin_roles.py.
"""

from datetime import datetime
from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.admin.inputs import (
    ActualizarParametroInput,
    CambiarEstadoUsuarioInput,
    CrearUsuarioInput,
)
from app.admin.service import AdministracionService
from app.core.auth import verify_password
from app.core.errors import DomainError

ADMIN = SimpleNamespace(id=1, username="admin", rol="ADMINISTRADOR")
PLANIFICADOR = SimpleNamespace(id=2, username="plan", rol="PLANIFICADOR")


@pytest.fixture
def repo():
    r = MagicMock()
    r.usuario_por_nombre = AsyncMock(return_value=None)
    return r


@pytest.fixture
def service(session, repo):
    return AdministracionService(session, repo)


# ── Usuarios ─────────────────────────────────────────────────────────────────


async def test_planificador_no_administra_usuarios(service):
    with pytest.raises(DomainError, match="No tienes permisos"):
        await service.listar_usuarios(PLANIFICADOR)


@pytest.mark.parametrize(
    ("datos", "mensaje"),
    [
        (CrearUsuarioInput("ab", "clave-segura-123", "PLANIFICADOR"), "3 caracteres"),
        (CrearUsuarioInput("maria", "corta", "PLANIFICADOR"), "al menos 10"),
        (CrearUsuarioInput("maria", "clave-segura-123", "GERENTE"), "rol debe ser"),
    ],
)
async def test_crear_usuario_valida_datos(service, session, datos, mensaje):
    with pytest.raises(DomainError, match=mensaje):
        await service.crear_usuario(ADMIN, datos)
    session.commit.assert_not_awaited()


async def test_crear_usuario_rechaza_nombre_repetido(service, repo):
    repo.usuario_por_nombre.return_value = SimpleNamespace(id=5)
    with pytest.raises(DomainError, match="Ya existe un usuario"):
        await service.crear_usuario(
            ADMIN, CrearUsuarioInput("maria", "clave-segura-123", "PLANIFICADOR")
        )


async def test_crear_usuario_guarda_la_contrasena_hasheada(service, repo, session):
    usuario = await service.crear_usuario(
        ADMIN, CrearUsuarioInput("  maria ", "clave-segura-123", "PLANIFICADOR")
    )
    assert usuario.username == "maria"
    assert usuario.password_hash != "clave-segura-123"
    assert verify_password("clave-segura-123", usuario.password_hash)
    session.commit.assert_awaited_once()


async def test_no_se_puede_desactivar_la_propia_cuenta(service, repo):
    repo.obtener_usuario = AsyncMock(
        return_value=SimpleNamespace(id=1, rol="ADMINISTRADOR", activo=True)
    )
    with pytest.raises(DomainError, match="propia cuenta"):
        await service.cambiar_estado_usuario(
            ADMIN, CambiarEstadoUsuarioInput(id=1, activo=False)
        )


# ── Parámetros (HU7.2) ───────────────────────────────────────────────────────


async def test_actualizar_parametro_desconocido(service):
    with pytest.raises(DomainError, match="parámetro no existe"):
        await service.actualizar_parametro(
            ADMIN, ActualizarParametroInput("iva", Decimal(19))
        )


async def test_actualizar_parametro_rechaza_valor_negativo(service, repo):
    repo.obtener_parametro = AsyncMock(
        return_value=SimpleNamespace(valor=Decimal(1300))
    )
    with pytest.raises(DomainError, match="debe ser positivo"):
        await service.actualizar_parametro(
            ADMIN, ActualizarParametroInput("precio_diesel_clp_litro", Decimal(-1))
        )


async def test_actualizar_parametro_deja_auditoria(service, repo, session):
    parametro = SimpleNamespace(valor=Decimal(1300))
    repo.obtener_parametro = AsyncMock(return_value=parametro)

    await service.actualizar_parametro(
        ADMIN, ActualizarParametroInput("precio_diesel_clp_litro", Decimal(1450))
    )

    assert parametro.valor == Decimal(1450)
    auditoria = repo.agregar_auditoria.call_args.args[0]
    assert (auditoria.valor_anterior, auditoria.valor_nuevo) == (
        Decimal(1300),
        Decimal(1450),
    )
    assert auditoria.cambiado_por_username == "admin"
    session.commit.assert_awaited_once()


async def test_actualizar_parametro_con_el_mismo_valor_no_audita(
    service, repo, session
):
    repo.obtener_parametro = AsyncMock(
        return_value=SimpleNamespace(valor=Decimal(1300))
    )
    await service.actualizar_parametro(
        ADMIN, ActualizarParametroInput("precio_diesel_clp_litro", Decimal(1300))
    )
    repo.agregar_auditoria.assert_not_called()
    session.commit.assert_not_awaited()


async def test_actualizar_parametro_redondea_a_dos_decimales(service, repo):
    parametro = SimpleNamespace(valor=Decimal("1300.00"))
    repo.obtener_parametro = AsyncMock(return_value=parametro)

    await service.actualizar_parametro(
        ADMIN, ActualizarParametroInput("precio_diesel_clp_litro", Decimal("1450.555"))
    )

    assert parametro.valor == Decimal("1450.56")
    assert str(repo.agregar_auditoria.call_args.args[0].valor_nuevo) == "1450.56"


# ── Reporte de costos (H6.x) ─────────────────────────────────────────────────


async def test_reporte_rechaza_mes_invalido(service):
    with pytest.raises(DomainError, match="entre 1 y 12"):
        await service.reporte_costos(ADMIN, 2026, 13)


async def test_reporte_suma_costos_y_margen_del_mes(service, repo):
    def viaje(id, ingreso, margen):
        return SimpleNamespace(
            id=id,
            fecha_inicio=datetime(2026, 9, id),
            fecha_llegada=datetime(2026, 9, id, 18),
            fecha_cancelacion=None,
            ingreso_total_clp=Decimal(ingreso),
            costo_diesel_clp=Decimal(100),
            costo_peajes_clp=Decimal(20),
            costo_operacion_clp=Decimal(50),
            costo_viatico_clp=Decimal(30),
            margen_clp=Decimal(margen),
        )

    repo.listar_viajes_periodo = AsyncMock(
        return_value=[viaje(1, 1000, 800), viaje(2, 500, 300)]
    )

    reporte = await service.reporte_costos(ADMIN, 2026, 9)

    assert reporte.cantidad_viajes == 2
    assert reporte.ingresos_clp == Decimal(1500)
    assert reporte.costos_totales_clp == Decimal(400)
    assert reporte.margen_clp == Decimal(1100)
    assert {v.estado for v in reporte.viajes} == {"Finalizado"}
