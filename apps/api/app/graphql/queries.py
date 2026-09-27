import strawberry
from graphql import GraphQLError
from sqlalchemy.orm import selectinload
from sqlmodel import select
from strawberry import Info

from app.graphql.helpers import (
    exigir_camion_operativo,
    ids_en_viaje,
    obtener_camion,
    obtener_conductor,
    pedidos_en_cargas_no_canceladas,
    serializar_query,
)
from app.graphql.types import (
    CamionGQL,
    CargaCalculadaGQL,
    CargaEstadoGQL,
    CargaGQL,
    CentroDistribucionGQL,
    ClienteGQL,
    ConductorGQL,
    MantencionEstadoGQL,
    MantencionGQL,
    PedidoEstadoGQL,
    PedidoGQL,
    TipoCamionGQL,
    ViajeEstadoGQL,
    ViajeGQL,
)
from app.models.camion import Camion, TipoCamion
from app.models.cliente import CentroDistribucion, Cliente, ClienteCentro
from app.models.conductor import ClaseLicencia as ClaseLicenciaModel
from app.models.conductor import Conductor, Licencia
from app.models.mantencion import Mantencion
from app.models.pedido import Carga, Pedido, PedidoEstado
from app.models.viaje import Viaje
from app.services.cargas import calcular_carga_para_camion


@strawberry.type
class Query:
    """Consultas de lectura del ERP. Todo lo que permite consultar la API."""

    @strawberry.field
    @serializar_query
    async def conductores(self, info: Info) -> list[ConductorGQL]:
        session = info.context.session
        conductores_en_viaje, _ = await ids_en_viaje(session)
        result = await session.exec(
            select(Conductor)
            .options(
                selectinload(Conductor.licencias)
                .selectinload(Licencia.clases)
                .selectinload(ClaseLicenciaModel.tipos_camion)
            )
            .order_by(Conductor.apellidos, Conductor.nombres)
        )
        return [
            ConductorGQL.from_model(
                conductor,
                en_viaje=conductor.id in conductores_en_viaje,
            )
            for conductor in result.all()
        ]

    @strawberry.field
    @serializar_query
    async def conductor(self, info: Info, id: int) -> ConductorGQL | None:
        session = info.context.session
        conductor = await obtener_conductor(session, id)
        if conductor is None:
            return None
        conductores_en_viaje, _ = await ids_en_viaje(session)
        return ConductorGQL.from_model(
            conductor,
            en_viaje=id in conductores_en_viaje,
        )

    @strawberry.field
    @serializar_query
    async def viajes(
        self,
        info: Info,
        estado: ViajeEstadoGQL | None = None,
    ) -> list[ViajeGQL]:
        statement = (
            select(Viaje)
            .options(
                selectinload(Viaje.conductor),
                selectinload(Viaje.camion),
                selectinload(Viaje.carga),
            )
            .order_by(Viaje.fecha_inicio.desc(), Viaje.id.desc())
        )
        if estado is not None:
            statement = statement.where(Viaje.estado == estado)
        result = await info.context.session.exec(statement)
        return [ViajeGQL.from_model(viaje) for viaje in result.all()]

    @strawberry.field
    @serializar_query
    async def tipos_camion(self, info: Info) -> list[TipoCamionGQL]:
        result = await info.context.session.exec(
            select(TipoCamion).order_by(TipoCamion.tipo)
        )
        return [TipoCamionGQL.from_model(tipo) for tipo in result.all()]

    @strawberry.field
    @serializar_query
    async def camiones(self, info: Info) -> list[CamionGQL]:
        _, camiones_en_viaje = await ids_en_viaje(info.context.session)
        result = await info.context.session.exec(
            select(Camion)
            .options(
                selectinload(Camion.documentos),
                selectinload(Camion.mantenciones),
            )
            .order_by(Camion.patente)
        )
        return [
            CamionGQL.from_model(camion, en_transito=camion.id in camiones_en_viaje)
            for camion in result.all()
        ]

    @strawberry.field
    @serializar_query
    async def camion(self, info: Info, id: int) -> CamionGQL | None:
        session = info.context.session
        camion = await obtener_camion(session, id)
        if camion is None:
            return None
        _, camiones_en_viaje = await ids_en_viaje(session)
        return CamionGQL.from_model(
            camion,
            en_transito=id in camiones_en_viaje,
        )

    @strawberry.field
    @serializar_query
    async def mantenciones(
        self,
        info: Info,
        id_camion: int,
        estado: MantencionEstadoGQL | None = None,
    ) -> list[MantencionGQL]:
        statement = (
            select(Mantencion)
            .where(Mantencion.id_camion == id_camion)
            .order_by(Mantencion.fecha_inicio.desc())
        )
        if estado is not None:
            statement = statement.where(Mantencion.estado == estado)
        result = await info.context.session.exec(statement)
        return [MantencionGQL.from_model(mantencion) for mantencion in result.all()]

    @strawberry.field
    @serializar_query
    async def calcular_carga_valida(
        self,
        info: Info,
        camion_id: int,
        centro_id: int,
    ) -> CargaCalculadaGQL:
        session = info.context.session
        camion = await obtener_camion(session, camion_id)
        if camion is None:
            raise GraphQLError("Camión no encontrado")
        if await session.get(CentroDistribucion, centro_id) is None:
            raise GraphQLError("Centro de distribución no encontrado")

        pedidos_result = await session.exec(
            select(Pedido)
            .join(ClienteCentro, ClienteCentro.id_cliente == Pedido.id_cliente)
            .where(
                ClienteCentro.id_centro == centro_id,
                ClienteCentro.estado.is_(True),
                Pedido.estado == PedidoEstado.EN_ESPERA,
                ~Pedido.id.in_(pedidos_en_cargas_no_canceladas()),
            )
            .order_by(Pedido.ventana_inicio, Pedido.ventana_fin, Pedido.id)
        )
        pedidos = pedidos_result.all()
        distribucion = calcular_carga_para_camion(pedidos, camion)
        pedidos_asignados = distribucion.cargas[0].pedidos if distribucion.cargas else []
        await exigir_camion_operativo(session, camion, pedidos_asignados)
        return CargaCalculadaGQL.from_result(distribucion, camion, centro_id)

    @strawberry.field
    @serializar_query
    async def clientes(self, info: Info) -> list[ClienteGQL]:
        result = await info.context.session.exec(
            select(Cliente).order_by(Cliente.razon)
        )
        return [ClienteGQL.from_model(cliente) for cliente in result.all()]

    @strawberry.field
    @serializar_query
    async def centros_distribucion(
        self,
        info: Info,
    ) -> list[CentroDistribucionGQL]:
        result = await info.context.session.exec(
            select(CentroDistribucion).order_by(CentroDistribucion.direccion)
        )
        return [CentroDistribucionGQL.from_model(centro) for centro in result.all()]

    @strawberry.field
    @serializar_query
    async def cliente(self, info: Info, id: int) -> ClienteGQL | None:
        cliente = await info.context.session.get(Cliente, id)
        return ClienteGQL.from_model(cliente) if cliente else None

    @strawberry.field
    @serializar_query
    async def pedidos(
        self,
        info: Info,
        id_cliente: int | None = None,
        estado: PedidoEstadoGQL | None = None,
    ) -> list[PedidoGQL]:
        statement = select(Pedido).order_by(Pedido.ventana_inicio, Pedido.id)
        if id_cliente is not None:
            statement = statement.where(Pedido.id_cliente == id_cliente)
        if estado is not None:
            statement = statement.where(Pedido.estado == estado)
        result = await info.context.session.exec(statement)
        return [PedidoGQL.from_model(pedido) for pedido in result.all()]

    @strawberry.field
    @serializar_query
    async def pedido(self, info: Info, id: int) -> PedidoGQL | None:
        pedido = await info.context.session.get(Pedido, id)
        return PedidoGQL.from_model(pedido) if pedido else None

    @strawberry.field
    @serializar_query
    async def cargas(
        self,
        info: Info,
        estado: CargaEstadoGQL | None = None,
    ) -> list[CargaGQL]:
        statement = (
            select(Carga).options(selectinload(Carga.pedidos)).order_by(Carga.id)
        )
        if estado is not None:
            statement = statement.where(Carga.estado == estado)
        result = await info.context.session.exec(statement)
        return [CargaGQL.from_model(carga) for carga in result.all()]
