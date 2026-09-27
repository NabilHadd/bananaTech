from datetime import datetime
from decimal import Decimal

import strawberry
from graphql import GraphQLError
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from strawberry import Info

from app.models.camion import Camion
from app.models.cliente import CentroDistribucion, Cliente, ClienteCentro
from app.models.pedido import (
    Carga,
    CargaEstado,
    MercaderiaTipo,
    Pedido,
    PedidoCarga,
    PedidoEstado,
)
from app.services.cargas import DistribucionCargas, calcular_carga_para_camion
from app.services.pedidos import validar_dimensiones_pedido

MercaderiaTipoGQL = strawberry.enum(MercaderiaTipo, name="MercaderiaTipo")
PedidoEstadoGQL = strawberry.enum(PedidoEstado, name="PedidoEstado")
CargaEstadoGQL = strawberry.enum(CargaEstado, name="CargaEstado")


@strawberry.type
class ClienteGQL:
    id: int
    razon: str
    rut: str
    direccion: str | None
    mail: str | None
    telefono: str | None

    @classmethod
    def from_model(cls, cliente: Cliente) -> "ClienteGQL":
        return cls(
            id=cliente.id,
            razon=cliente.razon,
            rut=cliente.rut,
            direccion=cliente.direccion,
            mail=cliente.mail,
            telefono=cliente.telefono,
        )


@strawberry.type
class PedidoGQL:
    id: int
    id_cliente: int
    peso_kg: Decimal
    volumen_m3: Decimal
    ventana_inicio: datetime
    ventana_fin: datetime
    tipo_mercaderia: MercaderiaTipoGQL
    estado: PedidoEstadoGQL

    @classmethod
    def from_model(cls, pedido: Pedido) -> "PedidoGQL":
        return cls(
            id=pedido.id,
            id_cliente=pedido.id_cliente,
            peso_kg=pedido.peso_kg,
            volumen_m3=pedido.volumen_m3,
            ventana_inicio=pedido.ventana_inicio,
            ventana_fin=pedido.ventana_fin,
            tipo_mercaderia=pedido.tipo_mercaderia,
            estado=pedido.estado,
        )


@strawberry.type
class CargaGQL:
    id: int
    id_centro: int
    id_camion: int | None
    estado: CargaEstadoGQL
    pedidos: list[PedidoGQL]

    @classmethod
    def from_model(cls, carga: Carga) -> "CargaGQL":
        return cls(
            id=carga.id,
            id_centro=carga.id_centro,
            id_camion=carga.id_camion,
            estado=carga.estado,
            pedidos=[PedidoGQL.from_model(pedido) for pedido in carga.pedidos],
        )


@strawberry.type
class PedidoNoAsignadoGQL:
    pedido: PedidoGQL
    motivo: str


@strawberry.type
class CargaCalculadaGQL:
    id_camion: int
    patente_camion: str
    id_centro: int
    pedidos: list[PedidoGQL]
    pedidos_no_asignados: list[PedidoNoAsignadoGQL]
    peso_total_kg: Decimal
    volumen_total_m3: Decimal
    peso_disponible_kg: Decimal
    volumen_disponible_m3: Decimal
    porcentaje_peso: Decimal
    porcentaje_volumen: Decimal

    @classmethod
    def from_result(
        cls,
        distribucion: DistribucionCargas,
        camion: Camion,
        id_centro: int,
    ) -> "CargaCalculadaGQL":
        carga = distribucion.cargas[0] if distribucion.cargas else None
        return cls(
            id_camion=camion.id,
            patente_camion=camion.patente,
            id_centro=id_centro,
            pedidos=[PedidoGQL.from_model(pedido) for pedido in carga.pedidos]
            if carga
            else [],
            pedidos_no_asignados=[
                PedidoNoAsignadoGQL(
                    pedido=PedidoGQL.from_model(no_asignado.pedido),
                    motivo=no_asignado.motivo,
                )
                for no_asignado in distribucion.no_asignados
            ],
            peso_total_kg=carga.peso_total_kg if carga else Decimal(0),
            volumen_total_m3=carga.volumen_total_m3 if carga else Decimal(0),
            peso_disponible_kg=carga.peso_disponible_kg if carga else camion.peso_kg,
            volumen_disponible_m3=carga.volumen_disponible_m3
            if carga
            else camion.volumen_m3,
            porcentaje_peso=carga.porcentaje_peso if carga else Decimal(0),
            porcentaje_volumen=carga.porcentaje_volumen if carga else Decimal(0),
        )


@strawberry.input
class ClienteInput:
    razon: str
    rut: str
    direccion: str | None = None
    mail: str | None = None
    telefono: str | None = None


@strawberry.input
class PedidoInput:
    id_cliente: int
    peso_kg: Decimal
    volumen_m3: Decimal
    ventana_inicio: datetime
    ventana_fin: datetime
    tipo_mercaderia: MercaderiaTipoGQL


async def _commit(session: AsyncSession) -> None:
    try:
        await session.commit()
    except IntegrityError as error:
        await session.rollback()
        raise GraphQLError(
            "Los datos entran en conflicto con un registro existente"
        ) from error


def _pedidos_en_cargas_no_canceladas():
    return (
        select(PedidoCarga.id_pedido)
        .join(Carga, Carga.id == PedidoCarga.id_carga)
        .where(Carga.estado != CargaEstado.CANCELADA)
    )


def _validar_dimensiones(input: PedidoInput) -> None:
    try:
        validar_dimensiones_pedido(input.peso_kg, input.volumen_m3)
    except ValueError as error:
        raise GraphQLError(str(error)) from error


async def _pedido_tiene_carga_no_cancelada(
    session: AsyncSession,
    id_pedido: int,
) -> bool:
    result = await session.exec(
        select(PedidoCarga.id_carga)
        .join(Carga, Carga.id == PedidoCarga.id_carga)
        .where(
            PedidoCarga.id_pedido == id_pedido,
            Carga.estado != CargaEstado.CANCELADA,
        )
    )
    return result.first() is not None


@strawberry.type
class Query:
    @strawberry.field
    async def calcular_carga_valida(
        self,
        info: Info,
        camion_id: int,
        centro_id: int,
    ) -> CargaCalculadaGQL:
        session = info.context.session
        camion = await session.get(Camion, camion_id)
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
                ~Pedido.id.in_(_pedidos_en_cargas_no_canceladas()),
            )
            .order_by(Pedido.ventana_inicio, Pedido.ventana_fin, Pedido.id)
        )
        distribucion = calcular_carga_para_camion(pedidos_result.all(), camion)
        return CargaCalculadaGQL.from_result(distribucion, camion, centro_id)

    @strawberry.field
    async def clientes(self, info: Info) -> list[ClienteGQL]:
        result = await info.context.session.exec(
            select(Cliente).order_by(Cliente.razon)
        )
        return [ClienteGQL.from_model(cliente) for cliente in result.all()]

    @strawberry.field
    async def cliente(self, info: Info, id: int) -> ClienteGQL | None:
        cliente = await info.context.session.get(Cliente, id)
        return ClienteGQL.from_model(cliente) if cliente else None

    @strawberry.field
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
    async def pedido(self, info: Info, id: int) -> PedidoGQL | None:
        pedido = await info.context.session.get(Pedido, id)
        return PedidoGQL.from_model(pedido) if pedido else None

    @strawberry.field
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


@strawberry.type
class Mutation:
    @strawberry.mutation
    async def crear_cliente(self, info: Info, input: ClienteInput) -> ClienteGQL:
        cliente = Cliente(
            razon=input.razon,
            rut=input.rut,
            direccion=input.direccion,
            mail=input.mail,
            telefono=input.telefono,
        )
        info.context.session.add(cliente)
        await _commit(info.context.session)
        await info.context.session.refresh(cliente)
        return ClienteGQL.from_model(cliente)

    @strawberry.mutation
    async def actualizar_cliente(
        self,
        info: Info,
        id: int,
        input: ClienteInput,
    ) -> ClienteGQL:
        session = info.context.session
        cliente = await session.get(Cliente, id)
        if cliente is None:
            raise GraphQLError("Cliente no encontrado")
        cliente.razon = input.razon
        cliente.rut = input.rut
        cliente.direccion = input.direccion
        cliente.mail = input.mail
        cliente.telefono = input.telefono
        await _commit(session)
        await session.refresh(cliente)
        return ClienteGQL.from_model(cliente)

    @strawberry.mutation
    async def eliminar_cliente(self, info: Info, id: int) -> bool:
        session = info.context.session
        cliente = await session.get(Cliente, id)
        if cliente is None:
            return False
        pedidos = await session.exec(select(Pedido.id).where(Pedido.id_cliente == id))
        if pedidos.first() is not None:
            raise GraphQLError(
                "No se puede eliminar un cliente que tiene pedidos registrados"
            )
        await session.delete(cliente)
        await _commit(session)
        return True

    @strawberry.mutation
    async def crear_pedido(self, info: Info, input: PedidoInput) -> PedidoGQL:
        session = info.context.session
        _validar_dimensiones(input)
        if input.ventana_inicio >= input.ventana_fin:
            raise GraphQLError(
                "La ventana de entrega debe finalizar después de su inicio"
            )
        cliente = await session.get(Cliente, input.id_cliente)
        if cliente is None:
            raise GraphQLError("Cliente no encontrado")
        pedido = Pedido(
            id_cliente=input.id_cliente,
            peso_kg=input.peso_kg,
            volumen_m3=input.volumen_m3,
            ventana_inicio=input.ventana_inicio,
            ventana_fin=input.ventana_fin,
            tipo_mercaderia=input.tipo_mercaderia,
            estado=PedidoEstado.EN_ESPERA,
        )
        session.add(pedido)
        await _commit(session)
        await session.refresh(pedido)
        return PedidoGQL.from_model(pedido)

    @strawberry.mutation
    async def actualizar_pedido(
        self,
        info: Info,
        id: int,
        input: PedidoInput,
    ) -> PedidoGQL:
        session = info.context.session
        _validar_dimensiones(input)
        pedido = await session.get(Pedido, id)
        if pedido is None:
            raise GraphQLError("Pedido no encontrado")
        if pedido.estado != PedidoEstado.EN_ESPERA:
            raise GraphQLError("Solo se pueden editar pedidos que estén en espera")
        if await _pedido_tiene_carga_no_cancelada(session, id):
            raise GraphQLError("No se puede editar un pedido asignado a una carga")
        if input.ventana_inicio >= input.ventana_fin:
            raise GraphQLError(
                "La ventana de entrega debe finalizar después de su inicio"
            )
        if await session.get(Cliente, input.id_cliente) is None:
            raise GraphQLError("Cliente no encontrado")
        for campo in (
            "id_cliente",
            "peso_kg",
            "volumen_m3",
            "ventana_inicio",
            "ventana_fin",
            "tipo_mercaderia",
        ):
            setattr(pedido, campo, getattr(input, campo))
        await _commit(session)
        await session.refresh(pedido)
        return PedidoGQL.from_model(pedido)

    @strawberry.mutation
    async def cancelar_pedido(self, info: Info, id: int) -> PedidoGQL:
        session = info.context.session
        pedido = await session.get(Pedido, id)
        if pedido is None:
            raise GraphQLError("Pedido no encontrado")
        if pedido.estado != PedidoEstado.EN_ESPERA:
            raise GraphQLError("Solo se pueden cancelar pedidos que estén en espera")
        if await _pedido_tiene_carga_no_cancelada(session, id):
            raise GraphQLError("No se puede cancelar un pedido asignado a una carga")
        pedido.estado = PedidoEstado.CANCELADO
        await _commit(session)
        await session.refresh(pedido)
        return PedidoGQL.from_model(pedido)

    @strawberry.mutation
    async def crear_carga(
        self,
        info: Info,
        id_centro: int,
        id_camion: int,
        ids_pedidos: list[int],
    ) -> CargaGQL:
        session = info.context.session
        if not ids_pedidos or len(ids_pedidos) != len(set(ids_pedidos)):
            raise GraphQLError("Debe indicar pedidos distintos para crear la carga")
        if await session.get(CentroDistribucion, id_centro) is None:
            raise GraphQLError("Centro de distribución no encontrado")
        camion = await session.get(Camion, id_camion)
        if camion is None:
            raise GraphQLError("Camión no encontrado")
        result = await session.exec(select(Pedido).where(Pedido.id.in_(ids_pedidos)))
        pedidos = result.all()
        if len(pedidos) != len(ids_pedidos):
            raise GraphQLError("Uno o más pedidos no existen")
        if any(pedido.estado != PedidoEstado.EN_ESPERA for pedido in pedidos):
            raise GraphQLError("Solo se pueden agregar pedidos que estén en espera")
        asignaciones = await session.exec(
            _pedidos_en_cargas_no_canceladas().where(
                PedidoCarga.id_pedido.in_(ids_pedidos)
            )
        )
        if asignaciones.first() is not None:
            raise GraphQLError("Uno o más pedidos ya pertenecen a una carga activa")

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

        propuesta = calcular_carga_para_camion(pedidos, camion)
        if propuesta.no_asignados:
            motivos = "; ".join(
                f"pedido {no_asignado.pedido.id}: {no_asignado.motivo}"
                for no_asignado in propuesta.no_asignados
            )
            raise GraphQLError(f"La carga no es válida para el camión: {motivos}")

        carga = Carga(
            id_centro=id_centro,
            id_camion=id_camion,
            estado=CargaEstado.CREADO,
            pedidos=pedidos,
        )
        session.add(carga)
        await _commit(session)
        await session.refresh(carga)
        return CargaGQL.from_model(carga)

    @strawberry.mutation
    async def cambiar_estado_carga(
        self,
        info: Info,
        id: int,
        estado: CargaEstadoGQL,
    ) -> CargaGQL:
        session = info.context.session
        result = await session.exec(
            select(Carga).options(selectinload(Carga.pedidos)).where(Carga.id == id)
        )
        carga = result.first()
        if carga is None:
            raise GraphQLError("Carga no encontrada")
        transiciones = {
            CargaEstado.CREADO: {CargaEstado.EN_RUTA, CargaEstado.CANCELADA},
            CargaEstado.EN_RUTA: {CargaEstado.ENTREGADA, CargaEstado.CANCELADA},
            CargaEstado.ENTREGADA: set(),
            CargaEstado.CANCELADA: set(),
        }
        if estado not in transiciones[carga.estado]:
            raise GraphQLError(
                f"No se puede cambiar una carga de {carga.estado.name} a {estado.name}"
            )
        carga.estado = estado
        if estado == CargaEstado.EN_RUTA:
            for pedido in carga.pedidos:
                pedido.estado = PedidoEstado.TRANSITO
        elif estado == CargaEstado.ENTREGADA:
            for pedido in carga.pedidos:
                pedido.estado = PedidoEstado.ENTREGADO
        elif estado == CargaEstado.CANCELADA:
            for pedido in carga.pedidos:
                if pedido.estado == PedidoEstado.TRANSITO:
                    pedido.estado = PedidoEstado.EN_ESPERA
        await _commit(session)
        return CargaGQL.from_model(carga)


schema = strawberry.Schema(query=Query, mutation=Mutation)
