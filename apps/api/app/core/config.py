from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuración leída de variables de entorno o de un archivo .env."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "bananaTech API"
    debug: bool = True
    # Origen del frontend de Vite, necesario para CORS en producción
    cors_origins: list[str] = ["http://localhost:5173"]
    # URL de conexión a la base de datos PostgreSQL
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/erp"


@lru_cache
def get_settings() -> Settings:
    return Settings()
