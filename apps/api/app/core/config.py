from decimal import Decimal
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
    cors_origins: list[str] = ["http://localhost:5174", "http://localhost:5173", "https://nabilhadd.github.io"]
    # URL de conexión a la base de datos PostgreSQL
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/erp"
    auth_secret: str = "development-only-change-me"
    admin_username: str | None = None
    admin_password: str | None = None
    # Zona de la operación. Las fechas de la base no guardan zona y el
    # contenedor corre en UTC: "hoy" (vigencia de documentos) se calcula aquí.
    zona_horaria: str = "America/Santiago"
    # Horas que un conductor debe descansar tras terminar un viaje (RN-06,
    # HU2.1). Cuando exista el panel de parámetros (HU7.2) se leerá de la base.
    descanso_minimo_horas: int = 8
    # Duración mínima de la ventana de entrega de un pedido (HU3.2): una
    # ventana más corta no deja margen para planificar el viaje.
    ventana_minima_horas: int = 24
    viatico_diario_clp: Decimal = Decimal(15000)
    # Valores iniciales de referencia en CLP; los viajes guardan una copia al iniciar.
    precio_diesel_clp_litro: Decimal = Decimal(1300)
    tarifa_peajes_clp_km: Decimal = Decimal(50)
    costo_operacion_clp_km: Decimal = Decimal(300)
    tarifa_venta_clp_ton_km: Decimal = Decimal(250)


@lru_cache
def get_settings() -> Settings:
    return Settings()
