"""Fecha y hora de la operación, compartidas por todos los módulos.

Las columnas de la base son `timestamp` sin zona y el contenedor corre en UTC:
"ahora" y "hoy" se calculan en la zona de la operación (`zona_horaria`).
"""

from datetime import date, datetime, time
from zoneinfo import ZoneInfo

from app.core.config import get_settings


def ahora() -> datetime:
    """Hora local de la operación, sin zona, comparable con los timestamp de la base."""
    return datetime.now(ZoneInfo(get_settings().zona_horaria)).replace(tzinfo=None)


def hoy() -> date:
    return ahora().date()


def a_datetime(dia: date) -> datetime:
    # Las columnas de documentos y licencias son timestamp; la vigencia se evalúa por día.
    return datetime.combine(dia, time())
