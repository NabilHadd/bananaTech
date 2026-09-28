from functools import lru_cache
from pathlib import Path

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

    # Un .env local en apps/api, si existe, gana sobre el de la raíz.
    model_config = SettingsConfigDict(
        env_file=_env_files(),
        extra="ignore",
    )

    app_name: str = "bananaTech API"
    debug: bool = True
    # Origen del frontend de Vite, necesario para CORS en producción
    cors_origins: list[str] = ["http://localhost:5173"]
    # URL de conexión a la base de datos PostgreSQL
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/erp"
    # Zona de la operación. Las fechas de la base no guardan zona y el
    # contenedor corre en UTC: "hoy" (vigencia de documentos) se calcula aquí.
    zona_horaria: str = "America/Santiago"
    # Horas que un conductor debe descansar tras terminar un viaje (RN-06,
    # HU2.1). Cuando exista el panel de parámetros (HU7.2) se leerá de la base.
    descanso_minimo_horas: int = 8


@lru_cache
def get_settings() -> Settings:
    return Settings()
