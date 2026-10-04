from decimal import Decimal

from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.auth import find_user_by_username, hash_password
from app.core.config import Settings
from app.models.seguridad import Parametro, Usuario


async def ensure_security_data(session: AsyncSession, settings: Settings) -> None:
    defaults = {
        "precio_diesel_clp_litro": (settings.precio_diesel_clp_litro, "CLP/L"),
        "tarifa_peajes_clp_km": (settings.tarifa_peajes_clp_km, "CLP/km"),
        "costo_operacion_clp_km": (settings.costo_operacion_clp_km, "CLP/km"),
        "tarifa_venta_clp_ton_km": (settings.tarifa_venta_clp_ton_km, "CLP/ton-km"),
        "viatico_diario_clp": (settings.viatico_diario_clp, "CLP/día"),
        "descanso_minimo_horas": (Decimal(settings.descanso_minimo_horas), "horas"),
    }
    for clave, (valor, unidad) in defaults.items():
        if await session.get(Parametro, clave) is None:
            session.add(Parametro(clave=clave, valor=valor, unidad=unidad))
    if (
        settings.admin_username
        and settings.admin_password
        and await find_user_by_username(session, settings.admin_username) is None
    ):
        session.add(Usuario(
            username=settings.admin_username,
            password_hash=hash_password(settings.admin_password),
            rol="ADMINISTRADOR",
        ))
    await session.commit()