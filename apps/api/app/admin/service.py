from dataclasses import dataclass
from datetime import date, datetime, time
from decimal import ROUND_HALF_UP, Decimal

from sqlmodel.ext.asyncio.session import AsyncSession

from app.admin.inputs import (
    ActualizarParametroInput,
    CambiarEstadoUsuarioInput,
    CrearUsuarioInput,
)
from app.admin.repository import AdministracionRepository
from app.core import tiempo
from app.core.auth import hash_password
from app.core.authorization import require_admin
from app.core.errors import DomainError
from app.models.seguridad import Parametro, ParametroAuditoria, Usuario

PARAMETROS_ACTIVOS = {
    "precio_diesel_clp_litro",
    "tarifa_peajes_clp_km",
    "costo_operacion_clp_km",
    "tarifa_venta_clp_ton_km",
    "viatico_diario_clp",
    "descanso_minimo_horas",
}


@dataclass(frozen=True)
class ViajeCosto:
    id: int
    fecha_inicio: datetime
    estado: str
    ingresos_clp: Decimal
    diesel_clp: Decimal
    peajes_clp: Decimal
    operacion_clp: Decimal
    viaticos_clp: Decimal
    margen_clp: Decimal


@dataclass(frozen=True)
class ReporteCostos:
    anio: int
    mes: int
    cantidad_viajes: int
    ingresos_clp: Decimal
    diesel_clp: Decimal
    peajes_clp: Decimal
    operacion_clp: Decimal
    viaticos_clp: Decimal
    costos_totales_clp: Decimal
    margen_clp: Decimal
    viajes: list[ViajeCosto]


class AdministracionService:
    def __init__(self, session: AsyncSession, repository: AdministracionRepository) -> None:
        self.session = session
        self.repository = repository

    async def listar_usuarios(self, actor: Usuario) -> list[Usuario]:
        require_admin(actor)
        return await self.repository.listar_usuarios()

    async def listar_parametros(self, actor: Usuario) -> list[Parametro]:
        require_admin(actor)
        return await self.repository.listar_parametros(PARAMETROS_ACTIVOS)

    async def historial_parametros(
        self, actor: Usuario, clave: str | None = None
    ) -> list[tuple[ParametroAuditoria, str]]:
        require_admin(actor)
        if clave is not None and clave not in PARAMETROS_ACTIVOS:
            raise DomainError("El parámetro no existe.")
        return await self.repository.historial_parametros(PARAMETROS_ACTIVOS, clave)

    async def reporte_costos(self, actor: Usuario, anio: int, mes: int) -> ReporteCostos:
        require_admin(actor)
        if mes < 1 or mes > 12:
            raise DomainError("El mes debe estar entre 1 y 12.")
        desde = datetime.combine(date(anio, mes, 1), time.min)
        hasta = datetime.combine(date(anio + (mes == 12), mes % 12 + 1, 1), time.min)
        viajes = await self.repository.listar_viajes_periodo(desde, hasta)

        filas = [self._viaje_costo(viaje) for viaje in viajes]
        diesel = self._sumar(filas, "diesel_clp")
        peajes = self._sumar(filas, "peajes_clp")
        operacion = self._sumar(filas, "operacion_clp")
        viaticos = self._sumar(filas, "viaticos_clp")
        return ReporteCostos(
            anio=anio,
            mes=mes,
            cantidad_viajes=len(filas),
            ingresos_clp=self._sumar(filas, "ingresos_clp"),
            diesel_clp=diesel,
            peajes_clp=peajes,
            operacion_clp=operacion,
            viaticos_clp=viaticos,
            costos_totales_clp=diesel + peajes + operacion + viaticos,
            margen_clp=self._sumar(filas, "margen_clp"),
            viajes=filas,
        )

    async def crear_usuario(self, actor: Usuario, data: CrearUsuarioInput) -> Usuario:
        require_admin(actor)
        username = data.username.strip()
        if len(username) < 3 or len(data.password) < 10:
            raise DomainError("El usuario requiere 3 caracteres y la contraseña al menos 10.")
        if data.rol not in {"ADMINISTRADOR", "PLANIFICADOR"}:
            raise DomainError("El rol debe ser ADMINISTRADOR o PLANIFICADOR.")
        if await self.repository.usuario_por_nombre(username):
            raise DomainError("Ya existe un usuario con ese nombre.")
        usuario = Usuario(
            username=username,
            password_hash=hash_password(data.password),
            rol=data.rol,
        )
        self.repository.agregar_usuario(usuario)
        await self.session.commit()
        await self.session.refresh(usuario)
        return usuario

    async def cambiar_estado_usuario(
        self, actor: Usuario, data: CambiarEstadoUsuarioInput
    ) -> Usuario:
        require_admin(actor)
        usuario = await self.repository.obtener_usuario(data.id)
        if usuario is None:
            raise DomainError("No existe ese usuario.")
        if usuario.id == actor.id and not data.activo:
            raise DomainError("No puedes desactivar tu propia cuenta.")
        if (
            usuario.rol == "ADMINISTRADOR"
            and usuario.activo
            and not data.activo
            and await self.repository.contar_administradores_activos() <= 1
        ):
            raise DomainError("Debe permanecer al menos un administrador activo.")
        usuario.activo = data.activo
        await self.session.commit()
        return usuario

    async def eliminar_usuario(self, actor: Usuario, id: int) -> bool:
        require_admin(actor)
        usuario = await self.repository.obtener_usuario(id)
        if usuario is None:
            raise DomainError("No existe ese usuario.")
        if usuario.id == actor.id:
            raise DomainError("No puedes eliminar tu propia cuenta.")
        if (
            usuario.rol == "ADMINISTRADOR"
            and usuario.activo
            and await self.repository.contar_administradores_activos() <= 1
        ):
            raise DomainError("Debe permanecer al menos un administrador activo.")
        await self.repository.eliminar_usuario(usuario)
        await self.session.commit()
        return True

    async def actualizar_parametro(self, actor: Usuario, data: ActualizarParametroInput) -> Parametro:
        require_admin(actor)
        if data.clave not in PARAMETROS_ACTIVOS:
            raise DomainError("El parámetro no existe.")
        parametro = await self.repository.obtener_parametro(data.clave)
        if parametro is None:
            raise DomainError("El parámetro no existe.")
        # La columna guarda 2 decimales: se redondea antes de comparar y auditar.
        valor = data.valor.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        if valor < 0 or valor > Decimal(1000000000000):
            raise DomainError("El valor debe ser positivo y estar dentro del rango permitido.")
        if parametro.valor != valor:
            self.repository.agregar_auditoria(ParametroAuditoria(
                clave=data.clave,
                valor_anterior=parametro.valor,
                valor_nuevo=valor,
                cambiado_por=actor.id,
                cambiado_por_username=actor.username,
                cambiado_en=tiempo.ahora(),
            ))
            parametro.valor = valor
            await self.session.commit()
        return parametro

    @staticmethod
    def _viaje_costo(viaje) -> ViajeCosto:
        ingreso = viaje.ingreso_total_clp or Decimal(0)
        diesel = viaje.costo_diesel_clp or Decimal(0)
        peajes = viaje.costo_peajes_clp or Decimal(0)
        operacion = viaje.costo_operacion_clp or Decimal(0)
        viaticos = viaje.costo_viatico_clp or Decimal(0)
        margen = viaje.margen_clp if viaje.margen_clp is not None else (
            ingreso - diesel - peajes - operacion - viaticos
        )
        estado = "Finalizado" if viaje.fecha_llegada else "Cancelado" if viaje.fecha_cancelacion else "En ruta"
        return ViajeCosto(
            id=viaje.id,
            fecha_inicio=viaje.fecha_inicio,
            estado=estado,
            ingresos_clp=ingreso,
            diesel_clp=diesel,
            peajes_clp=peajes,
            operacion_clp=operacion,
            viaticos_clp=viaticos,
            margen_clp=margen,
        )

    @staticmethod
    def _sumar(viajes: list[ViajeCosto], campo: str) -> Decimal:
        return sum((getattr(viaje, campo) for viaje in viajes), Decimal(0))