from dataclasses import dataclass


@dataclass(slots=True)
class Farm:
    """Modelo de dominio. No sabe nada de GraphQL ni de la base de datos."""

    id: str
    name: str
    country: str
