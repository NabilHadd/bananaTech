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
            estado=PedidoEstado.EN_ESPERA,
        )

        self.pedidos.agregar(pedido)
        await self.session.commit()
        await self.session.refresh(pedido)

        # Cargar relaciones completas para la respuesta
        resultado = await self.pedidos.obtener(pedido.id)
        return resultado if resultado is not None else pedido

    async def avanzar_a_transito(self, id: int) -> Pedido:
        pedido = await self.obtener_pedido(id)
        if not pedido:
            raise DomainError(f"El pedido con ID {id} no existe.")
            
        if pedido.estado != PedidoEstado.EN_ESPERA:
            raise DomainError(f"El pedido debe estar en estado '{PedidoEstado.EN_ESPERA.value}' para pasar a '{PedidoEstado.TRANSITO.value}'.")
            
        pedido.estado = PedidoEstado.TRANSITO
        await self.session.commit()
        await self.session.refresh(pedido)
        
        resultado = await self.obtener_pedido(id)
        return resultado if resultado is not None else pedido

    async def entregar_pedido(self, id: int, fecha_entrega: datetime, receptor: str, observaciones: str | None = None) -> Pedido:
        pedido = await self.obtener_pedido(id)
        if not pedido:
            raise DomainError(f"El pedido con ID {id} no existe.")
            
        # HU3.3: "Dado un pedido en estado Creado, cuando intento pasarlo directamente a Entregado, 
        # entonces el sistema rechaza la transición e indica las transiciones válidas."
        if pedido.estado != PedidoEstado.TRANSITO:
            raise DomainError(
                f"Transición inválida: No se puede pasar de '{pedido.estado.value}' a '{PedidoEstado.ENTREGADO.value}'. "
                f"Las transiciones válidas hacia Entregado son únicamente desde '{PedidoEstado.TRANSITO.value}'."
            )
            
        if not receptor or not receptor.strip():
            raise DomainError("El receptor es obligatorio para entregar el pedido.")
            
        pedido.estado = PedidoEstado.ENTREGADO
        pedido.fecha_entrega = fecha_entrega
        pedido.receptor = receptor
        pedido.observaciones = observaciones
        
        await self.session.commit()
        await self.session.refresh(pedido)
        
        resultado = await self.obtener_pedido(id)
        return resultado if resultado is not None else pedido

    async def cancelar_pedido(self, id: int) -> Pedido:
        pedido = await self.obtener_pedido(id)
        if not pedido:
            raise DomainError(f"El pedido con ID {id} no existe.")
            
        # HU3.3: "Dado un pedido no entregado, cuando lo cancelo, entonces pasa a Cancelado"
        if pedido.estado == PedidoEstado.ENTREGADO:
            raise DomainError("No se puede cancelar un pedido que ya fue entregado.")
            
        if pedido.estado == PedidoEstado.CANCELADO:
            raise DomainError("El pedido ya se encuentra cancelado.")
            
        pedido.estado = PedidoEstado.CANCELADO
        await self.session.commit()
        await self.session.refresh(pedido)
        
        resultado = await self.obtener_pedido(id)
        return resultado if resultado is not None else pedido
