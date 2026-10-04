"""Tests de AuthService: inicio de sesión.

El hash de contraseñas y la firma del token están en test_auth.py.
"""

from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.auth.inputs import LoginInput
from app.auth.service import AuthService
from app.core.auth import _token_user_id, hash_password

HASH = hash_password("clave-segura-123")


def _service(session, usuario):
    repo = MagicMock()
    repo.usuario_por_nombre = AsyncMock(return_value=usuario)
    return AuthService(session, repo)


async def test_login_correcto_devuelve_token_del_usuario(session):
    usuario = SimpleNamespace(
        id=4, username="maria", rol="PLANIFICADOR", activo=True, password_hash=HASH
    )

    resultado = await _service(session, usuario).iniciar_sesion(
        LoginInput(username="maria", password="clave-segura-123")
    )

    assert resultado.user.role == "PLANIFICADOR"
    assert _token_user_id(resultado.token) == 4


@pytest.mark.parametrize(
    ("usuario", "password"),
    [
        (None, "clave-segura-123"),  # no existe
        (
            SimpleNamespace(id=4, rol="PLANIFICADOR", activo=False, password_hash=HASH),
            "clave-segura-123",
        ),
        (
            SimpleNamespace(id=4, rol="PLANIFICADOR", activo=True, password_hash=HASH),
            "otra-clave",
        ),
    ],
    ids=["usuario-inexistente", "usuario-inactivo", "clave-incorrecta"],
)
async def test_login_fallido_no_devuelve_token(session, usuario, password):
    resultado = await _service(session, usuario).iniciar_sesion(
        LoginInput(username="maria", password=password)
    )
    assert resultado is None
