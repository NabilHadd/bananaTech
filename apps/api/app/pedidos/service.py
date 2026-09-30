"""Reglas de negocio de pedidos (HU3.2)."""

from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal

from sqlmodel.ext.asyncio.session import AsyncSession

from app.clientes.repository import CentroDistribucionRepository, ClienteRepository
from app.core.errors import DomainError
from app.models.pedido import MercaderiaTipo, Pedido, PedidoEstado
from app.pedidos.repository import PedidoRepository


@dataclass
class DatosPedido:
    id_cliente: int
    id_centro: int
    peso_kg: Decimal
    volumen_m3: Decimal
    ventana_inicio: datetime
    ventana_fin: datetime
    tipo_mercaderia: MercaderiaTipo


class PedidosService:
    def __init__(
        self,
        session: AsyncSession,
        pedidos: PedidoRepository,
        clientes: ClienteRepository,
        centros: CentroDistribucionRepository,
    ) -> None:
        self.session = session
        self.pedidos = pedidos
        self.clientes = clientes
        self.centros = centros

    async def listar_pedidos(
        self,
        *,
        busqueda: str | None = None,
        estado: PedidoEstado | None = None,
        tipo_mercaderia: MercaderiaTipo | None = None,
        id_cliente: int | None = None,
        fecha: date | None = None,
    ) -> list[Pedido]:
        return await self.pedidos.listar(
            busqueda=busqueda.strip() if busqueda else None,
            estado=estado,
            tipo_mercaderia=tipo_mercaderia,
            id_cliente=id_cliente,
            fecha=fecha,
        )

    async def obtener_pedido(self, id: int) -> Pedido | None:
        return await self.pedidos.obtener(id)

    async def crear_pedido(self, datos: DatosPedido) -> Pedido:
        # Validación de campos numéricos
        if datos.peso_kg <= 0:
            raise DomainError("El peso debe ser mayor a 0 kg.")
        if datos.volumen_m3 <= 0:
            raise DomainError("El volumen debe ser mayor a 0 m³.")

        # Criterio de aceptación HU3.2:
        # "Dado un pedido cuya ventana de entrega termina antes de comenzar,
        # cuando intento guardarlo, entonces el sistema rechaza el registro."
        if datos.ventana_fin <= datos.ventana_inicio:
            raise DomainError("La ventana de entrega termina antes de comenzar.")

        # Verificar existencia del cliente
        cliente = await self.clientes.obtener(datos.id_cliente)
        if not cliente:
            raise DomainError(f"El cliente con ID {datos.id_cliente} no existe.")

        # Verificar existencia del centro de distribución
        centro = await self.centros.obtener(datos.id_centro)
        if not centro:
            raise DomainError(f"El centro de distribución con ID {datos.id_centro} no existe.")

        # Validar que el centro pertenezca al cliente
        centros_cliente_ids = [c.id for c in (cliente.centros or [])]
        if datos.id_centro not in centros_cliente_ids:
            raise DomainError("El centro de distribución seleccionado no pertenece al cliente.")

        pedido = Pedido(
            id_cliente=datos.id_cliente,
            id_centro=datos.id_centro,
            peso_kg=datos.peso_kg,
            volumen_m3=datos.volumen_m3,
            ventana_inicio=datos.ventana_inicio,
            ventana_fin=datos.ventana_fin,
            tipo_mercaderia=datos.tipo_mercaderia,
            estado=PedidoEstado.CREADA,
        )

        self.pedidos.agregar(pedido)
        await self.session.commit()
        await self.session.refresh(pedido)

        # Cargar relaciones completas para la respuesta
        resultado = await self.pedidos.obtener(pedido.id)
        return resultado if resultado is not None else pedido

    async def cancelar_pedido(self, id: int) -> Pedido:
        pedido = await self.obtener_pedido(id)
        if not pedido:
            raise DomainError(f"El pedido con ID {id} no existe.")
            
        # HU3.3: "Dado un pedido no entregado, cuando lo cancelo, entonces pasa a
        # Cancelado". Uno en tránsito va en un camión: se cancela su viaje (E05).
        if pedido.estado == PedidoEstado.CANCELADO:
            raise DomainError("El pedido ya se encuentra cancelado.")
        if pedido.estado != PedidoEstado.CREADA:
            raise DomainError(
                f"Sólo se puede cancelar un pedido en estado '{PedidoEstado.CREADA.value}'; "
                f"este está '{pedido.estado.value}'."
            )
        carga = pedido.carga_activa()
        if carga is not None:
            raise DomainError(
                f"El pedido está en la carga #{carga.id}; quítelo de la carga antes de cancelarlo."
            )
            
        pedido.estado = PedidoEstado.CANCELADO
        await self.session.commit()
        await self.session.refresh(pedido)
        
        resultado = await self.obtener_pedido(id)
        return resultado if resultado is not None else pedido
