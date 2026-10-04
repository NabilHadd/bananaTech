from decimal import Decimal

from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import get_settings
from app.models.seguridad import Parametro


async def leer_parametro(session: AsyncSession, clave: str) -> Decimal:
    parametro = await session.get(Parametro, clave)
    if parametro is not None:
        return parametro.valor
    settings = get_settings()
    defaults = {
        "precio_diesel_clp_litro": settings.precio_diesel_clp_litro,
        "tarifa_peajes_clp_km": settings.tarifa_peajes_clp_km,
        "costo_operacion_clp_km": settings.costo_operacion_clp_km,
        "tarifa_venta_clp_ton_km": settings.tarifa_venta_clp_ton_km,
        "viatico_diario_clp": settings.viatico_diario_clp,
        "descanso_minimo_horas": Decimal(settings.descanso_minimo_horas),
    }
    return defaults[clave]