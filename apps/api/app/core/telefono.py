"""Formato de teléfono móvil chileno, compartido por clientes y conductores."""

import re

from app.core.errors import DomainError

# Se ignoran espacios, guiones, puntos y paréntesis; el prefijo +56 o 56 es
# opcional. Lo que queda debe ser un móvil: 9 seguido de 8 dígitos.
_SEPARADORES = re.compile(r"[\s\-.()]")
_MOVIL = re.compile(r"^(?:\+?56)?9(\d{4})(\d{4})$")


def normalizar_telefono(telefono: str) -> str:
    """Valida un móvil chileno y lo devuelve como `+569 1234 5678`.

    Acepta 912345678, 9 1234 5678, +56912345678, +569 1234 5678, etc. Se
    guarda siempre con el mismo formato para que el índice único detecte
    duplicados aunque se escriban distinto.
    """
    coincide = _MOVIL.match(_SEPARADORES.sub("", telefono))
    if not coincide:
        raise DomainError(
            f"El teléfono {telefono.strip()!r} no es válido: use el formato +569 XXXX XXXX"
        )
    return f"+569 {coincide.group(1)} {coincide.group(2)}"
