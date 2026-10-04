from dataclasses import dataclass
from decimal import Decimal


@dataclass(frozen=True)
class CrearUsuarioInput:
    username: str
    password: str
    rol: str


@dataclass(frozen=True)
class CambiarEstadoUsuarioInput:
    id: int
    activo: bool


@dataclass(frozen=True)
class ActualizarParametroInput:
    clave: str
    valor: Decimal