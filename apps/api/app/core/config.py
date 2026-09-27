import json
from functools import lru_cache
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def _env_files() -> tuple[Path | str, ...]:
    """Archivos .env a leer, de menor a mayor prioridad.

    Busca hacia arriba el .env compartido del repo (el mismo que usa docker
    compose) para no depender del directorio desde el que se ejecute: uvicorn,
    alembic y los tests se lanzan desde sitios distintos. Dentro del contenedor
    no existe ninguno y la configuración llega por variables de entorno.
    """
    for directory in Path(__file__).resolve().parents:
        compartido = directory / ".env"
        if compartido.is_file():
            return (compartido, ".env")
    return (".env",)


class Settings(BaseSettings):
    """Configuración leída de variables de entorno o de un archivo .env."""

    model_config = SettingsConfigDict(
        env_file=_env_files(),
        extra="ignore",
    )

    app_name: str = "bananaTech API"
    debug: bool = True
    cors_origins: list[str] = ["http://localhost:5173"]
    database_url: str = (
        "postgresql+asyncpg://bananatech:cambiame@localhost:5433/bananatech"
    )

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _parse_cors_origins(cls, value: object) -> list[str]:
        if value is None:
            return []
        if isinstance(value, list):
            return [str(item) for item in value]
        if isinstance(value, str):
            stripped = value.strip()
            if not stripped:
                return []
            try:
                parsed = json.loads(stripped)
                if isinstance(parsed, list):
                    return [str(item) for item in parsed]
            except json.JSONDecodeError:
                pass
            return [part.strip() for part in stripped.split(",") if part.strip()]
        return [str(value)]


@lru_cache
def get_settings() -> Settings:
    return Settings()
