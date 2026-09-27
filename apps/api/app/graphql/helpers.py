from collections.abc import Awaitable, Callable
from datetime import UTC, date, datetime
from functools import wraps

from graphql import GraphQLError
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from strawberry import Info

from app.graphql.types import PedidoInput
from app.models.camion import Camion, Documento
from app.models.cliente import ClienteCentro
from app.models.conductor import ClaseLicencia as ClaseLicenciaModel
from app.models.conductor import Conductor, Licencia
from app.models.mantencion import Mantencion
from app.models.pedido import Carga, CargaEstado, Pedido, PedidoCarga
from app.models.viaje import Viaje, ViajeEstado
from app.services.cargas import calcular_carga_para_camion
from app.services.flota import restricciones_operativas
from app.services.pedidos import validar_dimensiones_pedido


async def commit(session: AsyncSession) -> None:
    """Guarda cambios y convierte errores de integridad en un error GraphQL."""

    try:
        await session.commit()
    except IntegrityError as error:
        await session.rollback()
        raise GraphQLError(
            "Los datos entran en conflicto con un registro existente"
        ) from error


def pedidos_en_cargas_no_canceladas():
    """Subconsulta útil para detectar pedidos ya asignados a cargas activas."""

    return (
        select(PedidoCarga.id_pedido)
        .join(Carga, Carga.id == PedidoCarga.id_carga)
        .where(Carga.estado != CargaEstado.CANCELADA)
    )


def validar_dimensiones_input(input: PedidoInput) -> None:
    """Valida las dimensiones del pedido antes de persistirlo."""

    try:
        validar_dimensiones_pedido(input.peso_kg, input.volumen_m3)
    except ValueError as error:
        raise GraphQLError(str(error)) from error


def datetime_utc_naive(value: datetime) -> datetime:
    """Normaliza un datetime con zona horaria a naive en UTC."""

    if value.tzinfo is None:
        return value
    return value.astimezone(UTC).replace(tzinfo=None)


async def pedido_tiene_carga_no_cancelada(
    session: AsyncSession,
    id_pedido: int,
) -> bool:
    """Devuelve True si un pedido ya pertenece a una carga que aún no fue cancelada."""

    result = await session.exec(
        select(PedidoCarga.id_carga)
        .join(Carga, Carga.id == PedidoCarga.id_carga)
        .where(
            PedidoCarga.id_pedido == id_pedido,
            Carga.estado != CargaEstado.CANCELADA,
        )
    )
    return result.first() is not None


async def obtener_camion(
    session: AsyncSession,
    id_camion: int,
    bloquear: bool = False,
) -> Camion | None:
    """Carga un camión con sus documentos y mantenciones para validaciones."""

    statement = (
        select(Camion)
        .options(selectinload(Camion.documentos), selectinload(Camion.mantenciones))
        .where(Camion.id == id_camion)
    )
    if bloquear:
        statement = statement.with_for_update()
    result = await session.exec(statement)
    return result.first()


async def obtener_conductor(
    session: AsyncSession,
    id_conductor: int,
    bloquear: bool = False,
) -> Conductor | None:
    """Carga un conductor con sus licencias y clases para validar capacidad."""

    statement = (
        select(Conductor)
        .options(
            selectinload(Conductor.licencias)
            .selectinload(Licencia.clases)
            .selectinload(ClaseLicenciaModel.tipos_camion)
        )
        .where(Conductor.id == id_conductor)
    )
    if bloquear:
        statement = statement.with_for_update()
    result = await session.exec(statement)
    return result.first()


async def ids_en_viaje(session: AsyncSession) -> tuple[set[int], set[int]]:
    """Indica qué conductores y camiones tienen un viaje activo en ruta."""

    conductores = await session.exec(
        select(Viaje.id_conductor).where(Viaje.estado == ViajeEstado.EN_RUTA)
    )
    camiones = await session.exec(
        select(Viaje.id_camion).where(Viaje.estado == ViajeEstado.EN_RUTA)
    )
    return set(conductores.all()), set(camiones.all())


async def restricciones_camion(
    session: AsyncSession,
    camion: Camion,
    fecha_inicio: date,
    fecha_fin: date,
) -> list[str]:
    """Evalúa si el camión puede operar en el rango solicitado."""

    documentos = await session.exec(
        select(Documento).where(Documento.id_camion == camion.id)
    )
    mantenciones = await session.exec(
        select(Mantencion).where(Mantencion.id_camion == camion.id)
    )
    return restricciones_operativas(
        documentos.all(),
        mantenciones.all(),
        fecha_inicio,
        fecha_fin,
        camion.activo,
    )


def periodo_operacion(pedidos: list[Pedido]) -> tuple[date, date]:
    """Calcula el rango de operación desde la ventana más temprana hasta la última."""

    hoy = datetime.now(UTC).date()
    if not pedidos:
        return hoy, hoy
    fecha_inicio = max(hoy, min(pedido.ventana_inicio.date() for pedido in pedidos))
    fecha_fin = max(fecha_inicio, max(pedido.ventana_fin.date() for pedido in pedidos))
    return fecha_inicio, fecha_fin


async def exigir_camion_operativo(
    session: AsyncSession,
    camion: Camion,
    pedidos: list[Pedido],
) -> None:
    """Lanza excepción si el camión no puede operar con la carga propuesta."""

    fecha_inicio, fecha_fin = periodo_operacion(pedidos)
    restricciones = await restricciones_camion(
        session,
        camion,
        fecha_inicio,
        fecha_fin,
    )
    if restricciones:
        raise GraphQLError(
            f"Camión {camion.patente} no habilitado: {'; '.join(restricciones)}"
        )


async def camion_tiene_carga_en_ruta(
    session: AsyncSession,
    id_camion: int,
) -> bool:
    """Verifica si el camión tiene una carga activa en tránsito."""

    result = await session.exec(
        select(Carga.id).where(
            Carga.id_camion == id_camion,
            Carga.estado == CargaEstado.EN_RUTA,
        )
    )
    return result.first() is not None


async def validar_ruta_y_capacidad(
    session: AsyncSession,
    camion: Camion,
    id_centro: int,
    pedidos: list[Pedido],
) -> None:
    """Comprueba que la ruta y la capacidad del camión sean compatibles."""

    clientes_result = await session.exec(
        select(ClienteCentro.id_cliente).where(
            ClienteCentro.id_cliente.in_({pedido.id_cliente for pedido in pedidos}),
            ClienteCentro.id_centro == id_centro,
            ClienteCentro.estado.is_(True),
        )
    )
    clientes_habilitados = set(clientes_result.all())
    if clientes_habilitados != {pedido.id_cliente for pedido in pedidos}:
        raise GraphQLError("Uno o más pedidos no pertenecen a la ruta seleccionada")

    await exigir_camion_operativo(session, camion, pedidos)
    propuesta = calcular_carga_para_camion(pedidos, camion)
    if propuesta.no_asignados:
        motivos = "; ".join(
            f"pedido {no_asignado.pedido.id}: {no_asignado.motivo}"
            for no_asignado in propuesta.no_asignados
        )
        raise GraphQLError(f"La carga no es válida para el camión: {motivos}")


async def exigir_conductor_operativo(
    session: AsyncSession,
    id_conductor: int,
    camion: Camion,
    fecha_inicio: datetime,
    fecha_fin: datetime,
    bloquear: bool = False,
) -> Conductor:
    """Valida que el conductor puede conducir con la licencia y horario del viaje."""

    conductor = await obtener_conductor(session, id_conductor, bloquear=bloquear)
    if conductor is None:
        raise GraphQLError("Conductor no encontrado")

    viaje_activo = await session.exec(
        select(Viaje.id).where(
            Viaje.id_conductor == id_conductor,
            Viaje.estado == ViajeEstado.EN_RUTA,
        )
    )
    if viaje_activo.first() is not None:
        raise GraphQLError("El conductor ya tiene un viaje en tránsito")

    licencias = sorted(
        conductor.licencias,
        key=lambda licencia: licencia.fecha_emision,
        reverse=True,
    )
    if not licencias:
        raise GraphQLError("El conductor no tiene una licencia registrada")
    licencia = licencias[0]
    if licencia.fecha_emision > fecha_inicio or licencia.fecha_vencimiento < fecha_fin:
        raise GraphQLError("La licencia del conductor no cubre todo el viaje")

    puede_conducir = any(
        tipo.id == camion.id_tipo_camion
        for clase in licencia.clases
        for tipo in clase.tipos_camion
    )
    if not puede_conducir:
        raise GraphQLError("La licencia no habilita el tipo de camión seleccionado")
    return conductor


def serializar_query[QueryResult](
    resolver: Callable[..., Awaitable[QueryResult]],
) -> Callable[..., Awaitable[QueryResult]]:
    """Garanta de exclusividad: bloquea la sesión para que no haya solapes de lectura/escritura."""

    @wraps(resolver)
    async def wrapped(
        self: object,
        info: Info,
        *args: object,
        **kwargs: object,
    ) -> QueryResult:
        async with info.context.session_lock:
            return await resolver(self, info, *args, **kwargs)

    return wrapped


__all__ = [
    "camion_tiene_carga_en_ruta",
    "commit",
    "datetime_utc_naive",
    "exigir_camion_operativo",
    "exigir_conductor_operativo",
    "ids_en_viaje",
    "obtener_camion",
    "obtener_conductor",
    "pedido_tiene_carga_no_cancelada",
    "pedidos_en_cargas_no_canceladas",
    "periodo_operacion",
    "restricciones_camion",
    "serializar_query",
    "validar_dimensiones_input",
    "validar_ruta_y_capacidad",
]
