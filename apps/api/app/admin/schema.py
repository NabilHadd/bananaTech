"""Resolvers GraphQL de administración; delegan reglas y persistencia al service."""

from decimal import Decimal

import strawberry
from strawberry.types import Info

from app.admin.inputs import (
    ActualizarParametroInput,
    CambiarEstadoUsuarioInput,
    CrearUsuarioInput,
)
from app.admin.types import (
    ParametroAuditoriaType,
    ParametroType,
    ReporteCostosType,
    UsuarioAdminType,
)
from app.core.context import Context


@strawberry.type
class AdministracionQuery:
    @strawberry.field
    async def usuarios(self, info: Info[Context, None]) -> list[UsuarioAdminType]:
        usuarios = await info.context.administracion.listar_usuarios(info.context.usuario)
        return [UsuarioAdminType.from_model(usuario) for usuario in usuarios]

    @strawberry.field
    async def parametros(self, info: Info[Context, None]) -> list[ParametroType]:
        parametros = await info.context.administracion.listar_parametros(info.context.usuario)
        return [ParametroType.from_model(parametro) for parametro in parametros]

    @strawberry.field
    async def historial_parametros(
        self, info: Info[Context, None], clave: str | None = None
    ) -> list[ParametroAuditoriaType]:
        historial = await info.context.administracion.historial_parametros(
            info.context.usuario, clave
        )
        return [ParametroAuditoriaType.from_row(evento, username) for evento, username in historial]

    @strawberry.field
    async def reporte_costos(
        self, info: Info[Context, None], anio: int, mes: int
    ) -> ReporteCostosType:
        reporte = await info.context.administracion.reporte_costos(
            info.context.usuario, anio, mes
        )
        return ReporteCostosType.from_data(reporte)


@strawberry.type
class AdministracionMutation:
    @strawberry.mutation
    async def crear_usuario(
        self, info: Info[Context, None], username: str, password: str, rol: str
    ) -> UsuarioAdminType:
        input = CrearUsuarioInput(username=username, password=password, rol=rol)
        usuario = await info.context.administracion.crear_usuario(info.context.usuario, input)
        return UsuarioAdminType.from_model(usuario)

    @strawberry.mutation
    async def cambiar_estado_usuario(
        self, info: Info[Context, None], id: int, activo: bool
    ) -> UsuarioAdminType:
        input = CambiarEstadoUsuarioInput(id=id, activo=activo)
        usuario = await info.context.administracion.cambiar_estado_usuario(
            info.context.usuario, input
        )
        return UsuarioAdminType.from_model(usuario)

    @strawberry.mutation
    async def eliminar_usuario(self, info: Info[Context, None], id: int) -> bool:
        return await info.context.administracion.eliminar_usuario(info.context.usuario, id)

    @strawberry.mutation
    async def actualizar_parametro(
        self, info: Info[Context, None], clave: str, valor: Decimal
    ) -> ParametroType:
        input = ActualizarParametroInput(clave=clave, valor=valor)
        parametro = await info.context.administracion.actualizar_parametro(
            info.context.usuario, input
        )
        return ParametroType.from_model(parametro)