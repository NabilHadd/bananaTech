"""Reglas de negocio de cargas (HU4.1–4.3).

Una carga agrupa pedidos Creada que van al mismo centro de distribución.
Mientras está Creada se le suman y quitan pedidos; al confirmarla se validan
compatibilidad y capacidad (HU4.2) y queda lista para que un viaje la lleve.
Desde ahí la mueve el viaje (E05): En ruta al generarse, Finalizada al llegar.
"""

from dataclasses import dataclass
from decimal import Decimal
from enum import StrEnum
from itertools import combinations

from sqlmodel.ext.asyncio.session import AsyncSession

from app.cargas.repository import CargaRepository
from app.core.errors import DomainError
from app.flota.repository import CamionRepository
from app.models import Camion
from app.models.pedido import Carga, CargaEstado, MercaderiaTipo, Pedido, PedidoEstado

# Pares de mercadería que no pueden viajar juntos (HU4.2). No hay un tipo
# "alimentos": se asume que los alimentos son la mercadería refrigerada.
INCOMPATIBLES: dict[frozenset[MercaderiaTipo], str] = {
    frozenset({MercaderiaTipo.REFRIGERADA, MercaderiaTipo.GENERAL}): "refrigerada con carga seca",
    frozenset({MercaderiaTipo.REFRIGERADA, MercaderiaTipo.FRAGIL}): "refrigerada con carga seca",
    frozenset({MercaderiaTipo.REFRIGERADA, MercaderiaTipo.PELIGROSA}): "peligrosa con alimentos",
}


class FactorLimitante(StrEnum):
    PESO = "Peso"
    VOLUMEN = "Volumen"


@dataclass
class Ocupacion:
    """Ocupación de una carga respecto de un camión (HU4.3)."""

    camion: Camion
    peso_total_kg: Decimal
    volumen_total_m3: Decimal
    porcentaje_peso: float
    porcentaje_volumen: float
    factor_limitante: FactorLimitante

    @property
    def excede(self) -> bool:
        return max(self.porcentaje_peso, self.porcentaje_volumen) > 100


def totales(pedidos: list[Pedido]) -> tuple[Decimal, Decimal]:
    """Peso (kg) y volumen (m³) sumados de los pedidos."""
    return (
        sum((p.peso_kg for p in pedidos), Decimal(0)),
        sum((p.volumen_m3 for p in pedidos), Decimal(0)),
    )


def incompatibilidad(pedidos: list[Pedido]) -> str | None:
    """Motivo por el que los pedidos no pueden ir juntos; None si pueden (HU4.2)."""
    tipos = sorted({p.tipo_mercaderia for p in pedidos}, key=lambda t: t.value)
    for a, b in combinations(tipos, 2):
        motivo = INCOMPATIBLES.get(frozenset({a, b}))
        if motivo:
            return f"No se puede mezclar mercadería {motivo} ({a.value} y {b.value})."
    return None


def _num(valor: Decimal) -> str:
    return f"{valor:,.2f}".rstrip("0").rstrip(".").replace(",", ".")


class CargasService:
    def __init__(
        self,
        session: AsyncSession,
        cargas: CargaRepository,
        camiones: CamionRepository,
    ) -> None:
        self.session = session
        self.cargas = cargas
        self.camiones = camiones

    async def listar_cargas(self, *, estado: CargaEstado | None = None) -> list[Carga]:
        return await self.cargas.listar(estado=estado)

    async def obtener_carga(self, id: int) -> Carga | None:
        return await self.cargas.obtener(id)

    async def crear_carga(self, id_pedidos: list[int]) -> Carga:
        """HU4.1: agrupa uno o más pedidos Creada en una carga nueva.

        Un pedido puede tener varias cargas en su historial (se reasigna si su
        carga se cancela), pero solo una activa: Creada, Confirmada o En ruta.
        """
        ids = list(dict.fromkeys(id_pedidos))
        if not ids:
            raise DomainError("Una carga debe tener al menos un pedido.")
        pedidos = await self._pedidos_libres(ids)

        centros = {p.id_centro for p in pedidos}
        if len(centros) > 1:
            raise DomainError(
                "Todos los pedidos de una carga deben ir al mismo centro de distribución."
            )

        carga = Carga(id_centro=centros.pop(), estado=CargaEstado.CREADA, pedidos=pedidos)
        self.cargas.agregar(carga)
        await self.session.commit()
        return await self._carga_existente(carga.id)

    async def agregar_pedidos(self, id_carga: int, id_pedidos: list[int]) -> Carga:
        """HU4.3: suma pedidos a la carga; la ocupación se recalcula al consultarla."""
        carga = await self._carga_editable(id_carga)
        ids = list(dict.fromkeys(id_pedidos))
        if not ids:
            raise DomainError("Seleccione al menos un pedido para agregar.")
        pedidos = await self._pedidos_libres(ids)
        otro_destino = next((p for p in pedidos if p.id_centro != carga.id_centro), None)
        if otro_destino is not None:
            raise DomainError(
                f"El pedido #{otro_destino.id} va a otro centro de distribución que el de la carga."
            )
        carga.pedidos.extend(pedidos)
        await self.session.commit()
        return await self._carga_existente(id_carga)

    async def quitar_pedido(self, id_carga: int, id_pedido: int) -> Carga:
        """HU4.3: quita un pedido de la carga; vuelve a quedar libre."""
        carga = await self._carga_editable(id_carga)
        pedido = next((p for p in carga.pedidos if p.id == id_pedido), None)
        if pedido is None:
            raise DomainError(f"El pedido #{id_pedido} no está en la carga #{id_carga}.")
        if len(carga.pedidos) == 1:
            raise DomainError(
                "No se puede quitar el único pedido de la carga; cancele la carga."
            )
        carga.pedidos.remove(pedido)
        await self.session.commit()
        return await self._carga_existente(id_carga)

    async def confirmar_carga(self, id_carga: int) -> Carga:
        """HU4.1/4.2: valida compatibilidad y que algún camión pueda llevarla.

        La capacidad contra el camión concreto se valida al generar el viaje,
        que es cuando se elige el camión (E05), con `validar_capacidad`.
        """
        carga = await self._carga_editable(id_carga)
        motivo = incompatibilidad(carga.pedidos)
        if motivo:
            raise DomainError(motivo)
        await self._validar_capacidad_flota(carga.pedidos)
        carga.estado = CargaEstado.CONFIRMADA
        await self.session.commit()
        return await self._carga_existente(id_carga)

    async def cancelar_carga(self, id_carga: int) -> Carga:
        """Cancela una carga que aún no sale; sus pedidos quedan libres para otra.

        Una carga En ruta se cancela cancelando su viaje (HU5.3).
        """
        carga = await self._carga_existente(id_carga)
        if carga.estado not in (CargaEstado.CREADA, CargaEstado.CONFIRMADA):
            raise DomainError(
                f"Sólo se puede cancelar una carga Creada o Confirmada; "
                f"esta está '{carga.estado.value}'."
            )
        carga.estado = CargaEstado.CANCELADA
        await self.session.commit()
        return await self._carga_existente(id_carga)

    async def ocupacion(self, id_carga: int, id_camion: int) -> Ocupacion:
        """HU4.3: ocupación de la carga si la llevara ese camión."""
        carga = await self._carga_existente(id_carga)
        camion = await self.camiones.obtener(id_camion)
        if camion is None:
            raise DomainError(f"No existe un camión con id {id_camion}.")
        return self.calcular_ocupacion(carga.pedidos, camion)

    def calcular_ocupacion(self, pedidos: list[Pedido], camion: Camion) -> Ocupacion:
        """HU4.3: % de peso y volumen y cuál de los dos es el factor limitante."""
        peso, volumen = totales(pedidos)
        pct_peso = round(float(peso / camion.peso_kg * 100), 1)
        pct_volumen = round(float(volumen / camion.volumen_m3 * 100), 1)
        return Ocupacion(
            camion=camion,
            peso_total_kg=peso,
            volumen_total_m3=volumen,
            porcentaje_peso=pct_peso,
            porcentaje_volumen=pct_volumen,
            factor_limitante=(
                FactorLimitante.PESO if pct_peso >= pct_volumen else FactorLimitante.VOLUMEN
            ),
        )

    def validar_capacidad(self, pedidos: list[Pedido], camion: Camion) -> None:
        """HU4.2: rechaza si peso o volumen total supera al camión, indicando el límite."""
        peso, volumen = totales(pedidos)
        if peso > camion.peso_kg:
            raise DomainError(
                f"La carga pesa {_num(peso)} kg y el camión {camion.patente} "
                f"admite {_num(camion.peso_kg)} kg."
            )
        if volumen > camion.volumen_m3:
            raise DomainError(
                f"La carga ocupa {_num(volumen)} m³ y el camión {camion.patente} "
                f"admite {_num(camion.volumen_m3)} m³."
            )

    # ── Transiciones que dispara el viaje (E05) ──────────────────────────────
    # No confirman la transacción: las llama el service de viajes dentro de la
    # suya, junto con el cambio del viaje. Requieren la carga con sus pedidos.

    def al_iniciar_viaje(self, carga: Carga) -> None:
        if carga.estado != CargaEstado.CONFIRMADA:
            raise DomainError("Sólo una carga Confirmada puede salir en un viaje.")
        carga.estado = CargaEstado.EN_RUTA
        for p in carga.pedidos:
            p.estado = PedidoEstado.TRANSITO

    def al_finalizar_viaje(self, carga: Carga) -> None:
        carga.estado = CargaEstado.FINALIZADA
        for p in carga.pedidos:
            p.estado = PedidoEstado.ENTREGADO

    def al_cancelar_viaje(self, carga: Carga) -> None:
        # HU5.3: los pedidos vuelven a Creada y quedan libres para otra carga.
        carga.estado = CargaEstado.CANCELADA
        for p in carga.pedidos:
            p.estado = PedidoEstado.CREADA

    # ── Auxiliares ───────────────────────────────────────────────────────────

    async def _carga_existente(self, id: int) -> Carga:
        carga = await self.cargas.obtener(id)
        if carga is None:
            raise DomainError(f"No existe la carga #{id}.")
        return carga

    async def _carga_editable(self, id: int) -> Carga:
        carga = await self._carga_existente(id)
        if carga.estado != CargaEstado.CREADA:
            raise DomainError(
                f"La carga #{id} está '{carga.estado.value}'; sólo se modifica mientras está Creada."
            )
        return carga

    async def _pedidos_libres(self, ids: list[int]) -> list[Pedido]:
        """Los pedidos indicados, validando que existan, estén Creada y sin carga activa."""
        pedidos = await self.cargas.pedidos_por_id(ids)
        faltantes = set(ids) - {p.id for p in pedidos}
        if faltantes:
            raise DomainError(f"No existe el pedido #{min(faltantes)}.")
        for p in pedidos:
            if p.estado != PedidoEstado.CREADA:
                raise DomainError(
                    f"El pedido #{p.id} está '{p.estado.value}'; sólo se cargan pedidos Creada."
                )
            if (activa := p.carga_activa()) is not None:
                raise DomainError(f"El pedido #{p.id} ya está en la carga #{activa.id}.")
        return pedidos

    async def _validar_capacidad_flota(self, pedidos: list[Pedido]) -> None:
        peso, volumen = totales(pedidos)
        camiones = await self.cargas.camiones_activos()
        if any(c.peso_kg >= peso and c.volumen_m3 >= volumen for c in camiones):
            return
        if not camiones:
            raise DomainError("No hay camiones activos en la flota.")
        max_peso = max(c.peso_kg for c in camiones)
        max_volumen = max(c.volumen_m3 for c in camiones)
        raise DomainError(
            f"Ningún camión de la flota puede llevar {_num(peso)} kg y {_num(volumen)} m³ "
            f"(máximo {_num(max_peso)} kg y {_num(max_volumen)} m³)."
        )
