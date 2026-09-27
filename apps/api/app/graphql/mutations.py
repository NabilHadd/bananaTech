from datetime import UTC, datetime

import strawberry
from graphql import GraphQLError
from sqlalchemy import delete as sql_delete
from sqlalchemy.orm import selectinload
from sqlmodel import select
from strawberry import Info

from app.graphql.helpers import (
    camion_tiene_carga_en_ruta,
    commit,
    datetime_utc_naive,
    exigir_conductor_operativo,
    obtener_camion,
    obtener_conductor,
    pedido_tiene_carga_no_cancelada,
    pedidos_en_cargas_no_canceladas,
    periodo_operacion,
    restricciones_camion,
    validar_dimensiones_input,
    validar_ruta_y_capacidad,
)
from app.graphql.types import (
    CamionGQL,
    CamionInput,
    CargaEstadoGQL,
    CargaGQL,
    CentroDistribucionGQL,
    CentroDistribucionInput,
    ClienteGQL,
    ClienteInput,
    ConductorGQL,
    ConductorInput,
    CrearViajeInput,
    DocumentoGQL,
    DocumentoInput,
    HistorialEntregadoGQL,
    LicenciaInput,
    MantencionEstadoGQL,
    MantencionGQL,
    MantencionInput,
    PedidoGQL,
    PedidoInput,
    PerfilConductorInput,
    ViajeEstadoGQL,
    ViajeGQL,
)
from app.models.camion import Camion, Documento, TipoCamion
from app.models.cliente import CentroDistribucion, Cliente, ClienteCentro
from app.models.conductor import ClaseLicencia as ClaseLicenciaModel
from app.models.conductor import Conductor, Licencia, LicenciaClaseLink
from app.models.mantencion import Mantencion, MantencionEstado
from app.models.pedido import Carga, CargaEstado, Pedido, PedidoCarga, PedidoEstado
from app.models.viaje import Viaje, ViajeEstado
from app.services.cargas import distribuir_pedidos_en_camiones
from app.services.flota import mantencion_se_solapa
from app.services.pedidos import validar_dimensiones


@strawberry.type
class Mutation:
    """Mutaciones de escritura del sistema. Aquí están las acciones que cambian estado."""

    @strawberry.mutation
    async def crear_conductor(
        self,
        info: Info,
        input: ConductorInput,
    ) -> ConductorGQL:
        session = info.context.session
        if not input.clases or len(input.clases) != len(set(input.clases)):
            raise GraphQLError(
                "Selecciona al menos una clase de licencia, sin duplicados"
            )
        fecha_emision = datetime_utc_naive(input.fecha_emision_licencia)
        fecha_vencimiento = datetime_utc_naive(input.fecha_vencimiento_licencia)
        if fecha_vencimiento <= fecha_emision:
            raise GraphQLError("La licencia debe vencer después de su emisión")

        clases_result = await session.exec(
            select(ClaseLicenciaModel).where(
                ClaseLicenciaModel.clase.in_(input.clases)
            )
        )
        clases = clases_result.all()
        if len(clases) != len(input.clases):
            raise GraphQLError("Una o más clases de licencia no están registradas")

        conductor = Conductor(
            rut=input.rut.strip(),
            nombres=input.nombres.strip(),
            apellidos=input.apellidos.strip(),
            telefono=input.telefono.strip(),
            email=input.email.strip(),
        )
        session.add(conductor)
        await session.flush()

        licencia = Licencia(
            id_conductor=conductor.id,
            fecha_emision=fecha_emision,
            fecha_vencimiento=fecha_vencimiento,
            clases=clases,
        )
        session.add(licencia)
        await commit(session)
        conductor = await obtener_conductor(session, conductor.id)
        return ConductorGQL.from_model(conductor)

    @strawberry.mutation
    async def actualizar_conductor(
        self,
        info: Info,
        id: int,
        input: PerfilConductorInput,
    ) -> ConductorGQL:
        session = info.context.session
        conductor = await obtener_conductor(session, id, bloquear=True)
        if conductor is None:
            raise GraphQLError("Conductor no encontrado")

        viaje_activo = await session.exec(
            select(Viaje.id).where(
                Viaje.id_conductor == id,
                Viaje.estado == ViajeEstado.EN_RUTA,
            )
        )
        if viaje_activo.first() is not None:
            raise GraphQLError("No se puede editar un conductor en viaje")

        conductor.rut = input.rut.strip()
        conductor.nombres = input.nombres.strip()
        conductor.apellidos = input.apellidos.strip()
        conductor.telefono = input.telefono.strip()
        conductor.email = input.email.strip()
        await commit(session)
        conductor = await obtener_conductor(session, id)
        return ConductorGQL.from_model(conductor)

    @strawberry.mutation
    async def actualizar_licencia(
        self,
        info: Info,
        id: int,
        input: LicenciaInput,
    ) -> ConductorGQL:
        session = info.context.session
        licencia_result = await session.exec(
            select(Licencia).where(Licencia.id == id).with_for_update()
        )
        licencia = licencia_result.first()
        if licencia is None:
            raise GraphQLError("Licencia no encontrada")
        conductor = await obtener_conductor(
            session,
            licencia.id_conductor,
            bloquear=True,
        )
        if conductor is None:
            raise GraphQLError("Conductor no encontrado")

        viaje_activo = await session.exec(
            select(Viaje.id).where(
                Viaje.id_conductor == conductor.id,
                Viaje.estado == ViajeEstado.EN_RUTA,
            )
        )
        if viaje_activo.first() is not None:
            raise GraphQLError("No se puede editar una licencia durante un viaje")
        if not input.clases or len(input.clases) != len(set(input.clases)):
            raise GraphQLError(
                "Selecciona al menos una clase de licencia, sin duplicados"
            )

        fecha_emision = datetime_utc_naive(input.fecha_emision)
        fecha_vencimiento = datetime_utc_naive(input.fecha_vencimiento)
        if fecha_vencimiento <= fecha_emision:
            raise GraphQLError("La licencia debe vencer después de su emisión")

        clases_result = await session.exec(
            select(ClaseLicenciaModel).where(
                ClaseLicenciaModel.clase.in_(input.clases)
            )
        )
        clases = clases_result.all()
        if len(clases) != len(input.clases):
            raise GraphQLError("Una o más clases de licencia no están registradas")

        licencia.fecha_emision = fecha_emision
        licencia.fecha_vencimiento = fecha_vencimiento
        licencia.clases = clases
        await commit(session)
        conductor = await obtener_conductor(session, conductor.id)
        return ConductorGQL.from_model(conductor)

    @strawberry.mutation
    async def eliminar_conductor(self, info: Info, id: int) -> bool:
        session = info.context.session
        conductor = await obtener_conductor(session, id, bloquear=True)
        if conductor is None:
            return False

        viajes = await session.exec(select(Viaje.id).where(Viaje.id_conductor == id))
        if viajes.first() is not None:
            raise GraphQLError(
                "No se puede eliminar un conductor con viajes históricos registrados"
            )

        licencia_ids = [licencia.id for licencia in conductor.licencias]
        if licencia_ids:
            await session.exec(
                sql_delete(LicenciaClaseLink).where(
                    LicenciaClaseLink.id_licencia.in_(licencia_ids)
                )
            )
            for licencia in conductor.licencias:
                await session.delete(licencia)

        await session.delete(conductor)
        await commit(session)
        return True

    @strawberry.mutation
    async def eliminar_camion(self, info: Info, id: int) -> bool:
        session = info.context.session
        camion = await obtener_camion(session, id, bloquear=True)
        if camion is None:
            return False

        referencias = await session.exec(select(Carga.id).where(Carga.id_camion == id))
        viajes = await session.exec(select(Viaje.id).where(Viaje.id_camion == id))
        if (
            referencias.first() is not None
            or viajes.first() is not None
            or camion.documentos
            or camion.mantenciones
        ):
            raise GraphQLError(
                "No se puede eliminar un camión con historial; desactívalo para conservarlo"
            )

        await session.delete(camion)
        await commit(session)
        return True

    @strawberry.mutation
    async def crear_viaje(self, info: Info, input: CrearViajeInput) -> ViajeGQL:
        session = info.context.session
        fecha_inicio = datetime_utc_naive(input.fecha_inicio)
        fecha_fin = datetime_utc_naive(input.fecha_fin)
        ahora = datetime.now(UTC).replace(tzinfo=None)

        if fecha_inicio >= fecha_fin:
            raise GraphQLError("El viaje debe finalizar después de su inicio")
        if fecha_inicio > ahora:
            raise GraphQLError("Solo se puede iniciar un viaje desde su fecha de salida")

        camion = await obtener_camion(session, input.id_camion, bloquear=True)
        if camion is None:
            raise GraphQLError("Camión no encontrado")

        conductor = await exigir_conductor_operativo(
            session,
            input.id_conductor,
            camion,
            fecha_inicio,
            fecha_fin,
            bloquear=True,
        )

        carga_result = await session.exec(
            select(Carga)
            .options(selectinload(Carga.pedidos))
            .where(Carga.id == input.id_carga)
            .with_for_update()
        )
        carga = carga_result.first()
        if carga is None:
            raise GraphQLError("Carga no encontrada")
        if carga.estado != CargaEstado.CREADO:
            raise GraphQLError("Solo se puede iniciar un viaje con una carga creada")
        if not carga.pedidos:
            raise GraphQLError("No se puede iniciar un viaje con una carga vacía")
        if any(pedido.estado != PedidoEstado.EN_ESPERA for pedido in carga.pedidos):
            raise GraphQLError("La carga contiene pedidos que ya no están en espera")

        asignacion_activa = await session.exec(
            select(Carga.id).where(
                Carga.id_camion == camion.id,
                Carga.estado == CargaEstado.CREADO,
                Carga.id != carga.id,
            )
        )
        if asignacion_activa.first() is not None:
            raise GraphQLError("El camión ya está asignado a otra carga creada")

        await validar_ruta_y_capacidad(session, camion, carga.id_centro, carga.pedidos)
        restricciones = await restricciones_camion(
            session,
            camion,
            fecha_inicio.date(),
            fecha_fin.date(),
        )
        if restricciones:
            raise GraphQLError(
                f"Camión {camion.patente} no habilitado: {'; '.join(restricciones)}"
            )

        carga.id_camion = camion.id
        carga.estado = CargaEstado.EN_RUTA
        for pedido in carga.pedidos:
            pedido.estado = PedidoEstado.TRANSITO

        viaje = Viaje(
            id_conductor=conductor.id,
            id_camion=camion.id,
            id_carga=carga.id,
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin,
            estado=ViajeEstado.EN_RUTA,
        )
        session.add(viaje)
        await commit(session)

        result = await session.exec(
            select(Viaje)
            .options(
                selectinload(Viaje.conductor),
                selectinload(Viaje.camion),
                selectinload(Viaje.carga),
            )
            .where(Viaje.id == viaje.id)
        )
        return ViajeGQL.from_model(result.one())

    @strawberry.mutation
    async def cerrar_viaje(
        self,
        info: Info,
        id: int,
        estado: ViajeEstadoGQL,
    ) -> ViajeGQL:
        if estado not in {ViajeEstado.FINALIZADO, ViajeEstado.CANCELADO}:
            raise GraphQLError("Un viaje solo puede cerrarse como finalizado o cancelado")

        session = info.context.session
        result = await session.exec(
            select(Viaje)
            .options(
                selectinload(Viaje.conductor),
                selectinload(Viaje.camion),
                selectinload(Viaje.carga).selectinload(Carga.pedidos),
            )
            .where(Viaje.id == id)
            .with_for_update()
        )
        viaje = result.first()
        if viaje is None:
            raise GraphQLError("Viaje no encontrado")
        if viaje.estado != ViajeEstado.EN_RUTA:
            raise GraphQLError("El viaje ya está cerrado")

        viaje.estado = estado
        viaje.fecha_fin = datetime.now(UTC).replace(tzinfo=None)
        if estado == ViajeEstado.FINALIZADO:
            viaje.carga.estado = CargaEstado.ENTREGADA
            for pedido in viaje.carga.pedidos:
                pedido.estado = PedidoEstado.ENTREGADO
        else:
            viaje.carga.estado = CargaEstado.CANCELADA
            for pedido in viaje.carga.pedidos:
                if pedido.estado == PedidoEstado.TRANSITO:
                    pedido.estado = PedidoEstado.EN_ESPERA

        await commit(session)
        return ViajeGQL.from_model(viaje)

    @strawberry.mutation
    async def crear_camion(self, info: Info, input: CamionInput) -> CamionGQL:
        session = info.context.session
        try:
            validar_dimensiones(input.peso_kg, input.volumen_m3, "camión")
        except ValueError as error:
            raise GraphQLError(str(error)) from error
        if await session.get(TipoCamion, input.id_tipo_camion) is None:
            raise GraphQLError("Tipo de camión no encontrado")

        camion = Camion(
            patente=input.patente,
            id_tipo_camion=input.id_tipo_camion,
            peso_kg=input.peso_kg,
            volumen_m3=input.volumen_m3,
        )
        session.add(camion)
        await commit(session)
        camion = await obtener_camion(session, camion.id)
        return CamionGQL.from_model(camion)

    @strawberry.mutation
    async def actualizar_camion(
        self,
        info: Info,
        id: int,
        input: CamionInput,
    ) -> CamionGQL:
        session = info.context.session
        try:
            validar_dimensiones(input.peso_kg, input.volumen_m3, "camión")
        except ValueError as error:
            raise GraphQLError(str(error)) from error
        camion_result = await session.exec(
            select(Camion).where(Camion.id == id).with_for_update()
        )
        camion = camion_result.first()
        if camion is None:
            raise GraphQLError("Camión no encontrado")
        if await session.get(TipoCamion, input.id_tipo_camion) is None:
            raise GraphQLError("Tipo de camión no encontrado")

        cargas = await session.exec(
            select(Carga.id).where(
                Carga.id_camion == id,
                Carga.estado == CargaEstado.EN_RUTA,
            )
        )
        if cargas.first() is not None:
            raise GraphQLError("No se puede editar un camión que está en ruta")

        camion.patente = input.patente
        camion.id_tipo_camion = input.id_tipo_camion
        camion.peso_kg = input.peso_kg
        camion.volumen_m3 = input.volumen_m3
        await commit(session)
        return CamionGQL.from_model(await obtener_camion(session, id))

    @strawberry.mutation
    async def cambiar_estado_camion(
        self,
        info: Info,
        id: int,
        activo: bool,
    ) -> CamionGQL:
        session = info.context.session
        camion_result = await session.exec(
            select(Camion).where(Camion.id == id).with_for_update()
        )
        camion = camion_result.first()
        if camion is None:
            raise GraphQLError("Camión no encontrado")

        if not activo:
            cargas = await session.exec(
                select(Carga.id).where(
                    Carga.id_camion == id,
                    Carga.estado.in_([CargaEstado.CREADO, CargaEstado.EN_RUTA]),
                )
            )
            if cargas.first() is not None:
                raise GraphQLError(
                    "No se puede desactivar un camión asignado a una carga"
                )

        camion.activo = activo
        await commit(session)
        return CamionGQL.from_model(await obtener_camion(session, id))

    @strawberry.mutation
    async def registrar_documento(
        self,
        info: Info,
        id_camion: int,
        input: DocumentoInput,
    ) -> DocumentoGQL:
        session = info.context.session
        fecha_emision = datetime_utc_naive(input.fecha_emision)
        fecha_vencimiento = datetime_utc_naive(input.fecha_vencimiento)
        if fecha_emision.date() > fecha_vencimiento.date():
            raise GraphQLError(
                "La emisión del documento no puede ser posterior al vencimiento"
            )

        camion = await obtener_camion(session, id_camion, bloquear=True)
        if camion is None:
            raise GraphQLError("Camión no encontrado")

        documento = Documento(
            id_camion=id_camion,
            tipo=input.tipo,
            fecha_emision=fecha_emision,
            fecha_vencimiento=fecha_vencimiento,
        )
        session.add(documento)
        await commit(session)
        await session.refresh(documento)
        return DocumentoGQL.from_model(documento, datetime.now(UTC).date())

    @strawberry.mutation
    async def actualizar_documento(
        self,
        info: Info,
        id: int,
        input: DocumentoInput,
    ) -> DocumentoGQL:
        session = info.context.session
        fecha_emision = datetime_utc_naive(input.fecha_emision)
        fecha_vencimiento = datetime_utc_naive(input.fecha_vencimiento)
        if fecha_emision.date() > fecha_vencimiento.date():
            raise GraphQLError(
                "La emisión del documento no puede ser posterior al vencimiento"
            )

        documento_result = await session.exec(
            select(Documento).where(Documento.id == id).with_for_update()
        )
        documento = documento_result.first()
        if documento is None:
            raise GraphQLError("Documento no encontrado")

        camion = await obtener_camion(session, documento.id_camion, bloquear=True)
        if camion is None:
            raise GraphQLError("Camión no encontrado")
        if await camion_tiene_carga_en_ruta(session, documento.id_camion):
            raise GraphQLError("No se puede editar documentación durante un viaje")

        documento.tipo = input.tipo
        documento.fecha_emision = fecha_emision
        documento.fecha_vencimiento = fecha_vencimiento
        await commit(session)
        await session.refresh(documento)
        return DocumentoGQL.from_model(documento, datetime.now(UTC).date())

    @strawberry.mutation
    async def eliminar_documento(self, info: Info, id: int) -> bool:
        session = info.context.session
        documento = await session.get(Documento, id)
        if documento is None:
            return False

        camion = await obtener_camion(session, documento.id_camion, bloquear=True)
        if camion is None:
            raise GraphQLError("Camión no encontrado")
        if await camion_tiene_carga_en_ruta(session, documento.id_camion):
            raise GraphQLError("No se puede eliminar documentación durante un viaje")

        await session.delete(documento)
        await commit(session)
        return True

    @strawberry.mutation
    async def programar_mantencion(
        self,
        info: Info,
        id_camion: int,
        input: MantencionInput,
    ) -> MantencionGQL:
        session = info.context.session
        fecha_inicio = datetime_utc_naive(input.fecha_inicio)
        fecha_fin = datetime_utc_naive(input.fecha_fin) if input.fecha_fin else None
        if fecha_fin and fecha_fin <= fecha_inicio:
            raise GraphQLError("La mantención debe finalizar después de su inicio")

        camion = await obtener_camion(session, id_camion, bloquear=True)
        if camion is None:
            raise GraphQLError("Camión no encontrado")

        existentes = await session.exec(
            select(Mantencion).where(
                Mantencion.id_camion == id_camion,
                Mantencion.estado.in_([
                    MantencionEstado.PROGRAMADA,
                    MantencionEstado.EN_CURSO,
                ]),
            )
        )
        inicio = fecha_inicio.date()
        fin = fecha_fin.date() if fecha_fin else datetime.max.replace(tzinfo=UTC).date()
        if any(mantencion_se_solapa(mantencion, inicio, fin) for mantencion in existentes.all()):
            raise GraphQLError("Ya existe una mantención activa en ese intervalo")

        cargas = await session.exec(
            select(Carga)
            .options(selectinload(Carga.pedidos))
            .where(
                Carga.id_camion == id_camion,
                Carga.estado.in_([CargaEstado.CREADO, CargaEstado.EN_RUTA]),
            )
        )
        for carga in cargas.all():
            if not carga.pedidos:
                continue
            inicio_carga, fin_carga = periodo_operacion(carga.pedidos)
            if inicio <= fin_carga and fin >= inicio_carga:
                raise GraphQLError("La mantención se solapa con una carga asignada")

        mantencion = Mantencion(
            id_camion=id_camion,
            tipo=input.tipo,
            descripcion=input.descripcion,
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin,
            estado=MantencionEstado.PROGRAMADA,
        )
        session.add(mantencion)
        await commit(session)
        await session.refresh(mantencion)
        return MantencionGQL.from_model(mantencion)

    @strawberry.mutation
    async def cambiar_estado_mantencion(
        self,
        info: Info,
        id: int,
        estado: MantencionEstadoGQL,
        fecha_fin: datetime | None = None,
    ) -> MantencionGQL:
        session = info.context.session
        mantencion_result = await session.exec(
            select(Mantencion).where(Mantencion.id == id).with_for_update()
        )
        mantencion = mantencion_result.first()
        if mantencion is None:
            raise GraphQLError("Mantención no encontrada")

        await obtener_camion(session, mantencion.id_camion, bloquear=True)

        transiciones = {
            MantencionEstado.PROGRAMADA: {
                MantencionEstado.EN_CURSO,
                MantencionEstado.CANCELADA,
            },
            MantencionEstado.EN_CURSO: {MantencionEstado.COMPLETADA},
            MantencionEstado.COMPLETADA: set(),
            MantencionEstado.CANCELADA: set(),
        }
        if estado not in transiciones[mantencion.estado]:
            raise GraphQLError("Transición de estado de mantención no permitida")
        if estado == MantencionEstado.EN_CURSO:
            ahora = datetime.now(UTC).replace(tzinfo=None)
            if mantencion.fecha_inicio > ahora:
                raise GraphQLError("No se puede iniciar una mantención antes de su fecha")
        if estado == MantencionEstado.COMPLETADA:
            fecha_fin = datetime_utc_naive(fecha_fin) if fecha_fin else None
            if fecha_fin is None or fecha_fin <= mantencion.fecha_inicio:
                raise GraphQLError("Indique una fecha fin posterior al inicio")
            mantencion.fecha_fin = fecha_fin

        mantencion.estado = estado
        await commit(session)
        await session.refresh(mantencion)
        return MantencionGQL.from_model(mantencion)

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
        await commit(info.context.session)
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
        await commit(session)
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
        await commit(session)
        return True

    @strawberry.mutation
    async def crear_centro_distribucion(
        self,
        info: Info,
        input: CentroDistribucionInput,
    ) -> CentroDistribucionGQL:
        centro = CentroDistribucion(
            direccion=input.direccion.strip(),
            distancia_km=input.distancia_km,
            distancia_min=input.distancia_min,
        )
        session = info.context.session
        session.add(centro)
        await commit(session)
        await session.refresh(centro)
        return CentroDistribucionGQL.from_model(centro)

    @strawberry.mutation
    async def eliminar_centro_distribucion(self, info: Info, id: int) -> bool:
        session = info.context.session
        centro = await session.get(CentroDistribucion, id)
        if centro is None:
            return False

        clientes = await session.exec(
            select(ClienteCentro.id_cliente).where(ClienteCentro.id_centro == id)
        )
        cargas = await session.exec(select(Carga.id).where(Carga.id_centro == id))
        if clientes.first() is not None or cargas.first() is not None:
            raise GraphQLError(
                "No se puede eliminar un centro asociado a clientes o cargas"
            )

        await session.delete(centro)
        await commit(session)
        return True

    @strawberry.mutation
    async def crear_pedido(self, info: Info, input: PedidoInput) -> PedidoGQL:
        session = info.context.session
        validar_dimensiones_input(input)
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
        await commit(session)
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
        validar_dimensiones_input(input)
        pedido_result = await session.exec(
            select(Pedido).where(Pedido.id == id).with_for_update()
        )
        pedido = pedido_result.first()
        if pedido is None:
            raise GraphQLError("Pedido no encontrado")
        if pedido.estado != PedidoEstado.EN_ESPERA:
            raise GraphQLError("Solo se pueden editar pedidos que estén en espera")
        if await pedido_tiene_carga_no_cancelada(session, id):
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

        await commit(session)
        await session.refresh(pedido)
        return PedidoGQL.from_model(pedido)

    @strawberry.mutation
    async def cancelar_pedido(self, info: Info, id: int) -> PedidoGQL:
        session = info.context.session
        pedido_result = await session.exec(
            select(Pedido).where(Pedido.id == id).with_for_update()
        )
        pedido = pedido_result.first()
        if pedido is None:
            raise GraphQLError("Pedido no encontrado")
        if pedido.estado != PedidoEstado.EN_ESPERA:
            raise GraphQLError("Solo se pueden cancelar pedidos que estén en espera")
        if await pedido_tiene_carga_no_cancelada(session, id):
            raise GraphQLError("No se puede cancelar un pedido asignado a una carga")

        pedido.estado = PedidoEstado.CANCELADO
        await commit(session)
        await session.refresh(pedido)
        return PedidoGQL.from_model(pedido)

    @strawberry.mutation
    async def eliminar_pedido(self, info: Info, id: int) -> bool:
        session = info.context.session
        pedido_result = await session.exec(
            select(Pedido).where(Pedido.id == id).with_for_update()
        )
        pedido = pedido_result.first()
        if pedido is None:
            return False
        if pedido.estado != PedidoEstado.EN_ESPERA:
            raise GraphQLError("Solo se pueden eliminar pedidos que estén en espera")

        historial = await session.exec(
            select(PedidoCarga.id_carga).where(PedidoCarga.id_pedido == id)
        )
        if historial.first() is not None:
            raise GraphQLError("No se puede eliminar un pedido con historial de cargas")

        await session.delete(pedido)
        await commit(session)
        return True

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

        camion = await obtener_camion(session, id_camion, bloquear=True)
        if camion is None:
            raise GraphQLError("Camión no encontrado")

        result = await session.exec(
            select(Pedido)
            .where(Pedido.id.in_(ids_pedidos))
            .order_by(Pedido.id)
            .with_for_update()
        )
        pedidos = result.all()
        if len(pedidos) != len(ids_pedidos):
            raise GraphQLError("Uno o más pedidos no existen")
        if any(pedido.estado != PedidoEstado.EN_ESPERA for pedido in pedidos):
            raise GraphQLError("Solo se pueden agregar pedidos que estén en espera")

        asignaciones = await session.exec(
            pedidos_en_cargas_no_canceladas().where(
                PedidoCarga.id_pedido.in_(ids_pedidos)
            )
        )
        if asignaciones.first() is not None:
            raise GraphQLError("Uno o más pedidos ya pertenecen a una carga activa")

        await validar_ruta_y_capacidad(session, camion, id_centro, pedidos)

        carga = Carga(
            id_centro=id_centro,
            id_camion=id_camion,
            estado=CargaEstado.CREADO,
            pedidos=pedidos,
        )
        session.add(carga)
        await commit(session)
        await session.refresh(carga)
        return CargaGQL.from_model(carga)

    @strawberry.mutation
    async def consolidar_cargas(self, info: Info) -> list[CargaGQL]:
        """Consolida pedidos pendientes por centro usando camiones libres."""
        session = info.context.session
        cargas_asignadas = select(Carga.id_camion).where(
            Carga.id_camion.is_not(None),
            Carga.estado.in_([CargaEstado.CREADO, CargaEstado.EN_RUTA]),
        )
        camiones_result = await session.exec(
            select(Camion)
            .options(
                selectinload(Camion.documentos),
                selectinload(Camion.mantenciones),
            )
            .where(
                Camion.activo.is_(True),
                ~Camion.id.in_(cargas_asignadas),
            )
            .order_by(Camion.id)
            .with_for_update()
        )
        camiones_disponibles = camiones_result.all()
        if not camiones_disponibles:
            return []

        centros_result = await session.exec(
            select(ClienteCentro.id_centro)
            .where(ClienteCentro.estado.is_(True))
            .distinct()
            .order_by(ClienteCentro.id_centro)
        )
        cargas_creadas: list[Carga] = []

        for id_centro in centros_result.all():
            pedidos_result = await session.exec(
                select(Pedido)
                .join(ClienteCentro, ClienteCentro.id_cliente == Pedido.id_cliente)
                .where(
                    ClienteCentro.id_centro == id_centro,
                    ClienteCentro.estado.is_(True),
                    Pedido.estado == PedidoEstado.EN_ESPERA,
                    ~Pedido.id.in_(pedidos_en_cargas_no_canceladas()),
                )
                .order_by(Pedido.ventana_inicio, Pedido.ventana_fin, Pedido.id)
                .with_for_update()
            )
            pedidos = pedidos_result.all()
            if not pedidos:
                continue

            fecha_inicio, fecha_fin = periodo_operacion(pedidos)
            camiones_operativos = []
            for camion in camiones_disponibles:
                restricciones = await restricciones_camion(
                    session,
                    camion,
                    fecha_inicio,
                    fecha_fin,
                )
                if not restricciones:
                    camiones_operativos.append(camion)
            if not camiones_operativos:
                continue

            distribucion = distribuir_pedidos_en_camiones(
                pedidos,
                camiones_operativos,
            )
            for propuesta in distribucion.cargas:
                await validar_ruta_y_capacidad(
                    session,
                    propuesta.camion,
                    id_centro,
                    propuesta.pedidos,
                )
                carga = Carga(
                    id_centro=id_centro,
                    id_camion=propuesta.camion.id,
                    estado=CargaEstado.CREADO,
                    pedidos=propuesta.pedidos,
                )
                session.add(carga)
                cargas_creadas.append(carga)
                camiones_disponibles.remove(propuesta.camion)

            if not camiones_disponibles:
                break

        if not cargas_creadas:
            return []
        await commit(session)
        return [CargaGQL.from_model(carga) for carga in cargas_creadas]

    @strawberry.mutation
    async def asignar_camion_carga(
        self,
        info: Info,
        id_carga: int,
        id_camion: int,
    ) -> CargaGQL:
        session = info.context.session
        carga_result = await session.exec(
            select(Carga)
            .options(selectinload(Carga.pedidos))
            .where(Carga.id == id_carga)
            .with_for_update()
        )
        carga = carga_result.first()
        if carga is None:
            raise GraphQLError("Carga no encontrada")
        if carga.estado != CargaEstado.CREADO:
            raise GraphQLError("Solo se puede asignar un camión a una carga creada")

        camion = await obtener_camion(session, id_camion, bloquear=True)
        if camion is None:
            raise GraphQLError("Camión no encontrado")
        if any(pedido.estado != PedidoEstado.EN_ESPERA for pedido in carga.pedidos):
            raise GraphQLError("La carga contiene pedidos que ya no están en espera")

        await validar_ruta_y_capacidad(
            session,
            camion,
            carga.id_centro,
            carga.pedidos,
        )
        carga.id_camion = id_camion
        await commit(session)
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
            select(Carga)
            .options(selectinload(Carga.pedidos))
            .where(Carga.id == id)
            .with_for_update()
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

        if estado == CargaEstado.EN_RUTA:
            if carga.id_camion is None:
                raise GraphQLError(
                    "La carga debe tener un camión asignado antes de salir"
                )
            camion = await obtener_camion(session, carga.id_camion, bloquear=True)
            if camion is None:
                raise GraphQLError("Camión asignado no encontrado")
            await validar_ruta_y_capacidad(
                session,
                camion,
                carga.id_centro,
                carga.pedidos,
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

        await commit(session)
        return CargaGQL.from_model(carga)

    @strawberry.mutation
    async def limpiar_historial_entregado(
        self,
        info: Info,
    ) -> HistorialEntregadoGQL:
        session = info.context.session
        cargas_result = await session.exec(
            select(Carga.id)
            .where(Carga.estado == CargaEstado.ENTREGADA)
            .with_for_update()
        )
        carga_ids = set(cargas_result.all())

        if carga_ids:
            viajes_activos = await session.exec(
                select(Viaje.id).where(
                    Viaje.id_carga.in_(carga_ids),
                    Viaje.estado == ViajeEstado.EN_RUTA,
                )
            )
            if viajes_activos.first() is not None:
                raise GraphQLError(
                    "No se pueden limpiar cargas entregadas asociadas a viajes activos"
                )

        viajes_result = await session.exec(
            select(Viaje.id).where(Viaje.estado == ViajeEstado.FINALIZADO)
        )
        viaje_ids = set(viajes_result.all())
        if carga_ids:
            viajes_carga_result = await session.exec(
                select(Viaje.id).where(Viaje.id_carga.in_(carga_ids))
            )
            viaje_ids.update(viajes_carga_result.all())

        if viaje_ids:
            await session.exec(sql_delete(Viaje).where(Viaje.id.in_(viaje_ids)))
        if carga_ids:
            await session.exec(
                sql_delete(PedidoCarga).where(PedidoCarga.id_carga.in_(carga_ids))
            )
            await session.exec(sql_delete(Carga).where(Carga.id.in_(carga_ids)))

        if viaje_ids or carga_ids:
            await commit(session)
        return HistorialEntregadoGQL(
            viajes_eliminados=len(viaje_ids),
            cargas_eliminadas=len(carga_ids),
        )
