"""Fixtures compartidas por todos los tests (pytest carga este archivo solo).

Los tests son unitarios: los services reciben repositorios y una sesión
falsos, así que no se necesita Postgres.
"""

from unittest.mock import AsyncMock, MagicMock

import pytest


@pytest.fixture
def session():
    """Sesión falsa: registra commit/rollback/refresh sin tocar una base.

    `get` devuelve None, así que `leer_parametro` usa los valores de config.
    """
    s = MagicMock()
    s.commit = AsyncMock()
    s.rollback = AsyncMock()
    s.refresh = AsyncMock()
    s.flush = AsyncMock()
    s.get = AsyncMock(return_value=None)
    return s
