from app.core.errors import DomainError
from app.models.seguridad import Usuario


def require_admin(usuario: Usuario) -> None:
    if usuario.rol != "ADMINISTRADOR":
        raise DomainError("No tienes permisos para esta sección.")