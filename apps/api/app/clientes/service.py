"""Reglas de negocio de los clientes (HU3.1).

No conoce GraphQL: recibe y devuelve objetos de Python. Es la única capa que
hace commit, así que cada método público es una operación completa.
"""

import re
from dataclasses import dataclass, field
from decimal import Decimal

from sqlalchemy.exc import IntegrityError
from sqlmodel.ext.asyncio.session import AsyncSession

from app.clientes.repository import CentroDistribucionRepository, ClienteRepository
from app.conductores.service import normalizar_rut
from app.core.errors import DomainError
from app.models import CentroDistribucion, Cliente

_FORMATO_EMAIL = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


@dataclass
class DatosCentro:
    direccion: str
    distancia_km: Decimal
    distancia_min: int


@dataclass
class DatosCliente:
    razon: str
    rut: str
    direccion: str | None = None
    mail: str | None = None
    telefono: str | None = None
    centros_ids: list[int] = field(default_factory=list)
    centros_nuevos: list[DatosCentro] = field(default_factory=list)


class ClientesService:
    def __init__(
        self,
        session: AsyncSession,
        clientes: ClienteRepository,
        centros: CentroDistribucionRepository,
    ) -> None:
        self.session = session
        self.clientes = clientes
        self.centros = centros

    # ── Consultas (HU3.1) ────────────────────────────────────────────────────

    async def listar_clientes(
        self, *, busqueda: str | None = None
    ) -> list[Cliente]:
        return await self.clientes.listar(
            busqueda=busqueda.strip() if busqueda else None
        )

    async def obtener_cliente(self, id: int) -> Cliente | None:
        return await self.clientes.obtener(id)

    async def listar_centros(
        self, *, busqueda: str | None = None
    ) -> list[CentroDistribucion]:
        return await self.centros.listar(
            busqueda=busqueda.strip() if busqueda else None
        )

    # ── Comandos (HU3.1) ─────────────────────────────────────────────────────

    async def crear_centro(self, datos: DatosCentro) -> CentroDistribucion:
        """Registra un centro de distribución nuevo o actualiza sus distancias."""
        if not datos.direccion.strip():
            raise DomainError("La dirección del centro de distribución es obligatoria")
        if datos.distancia_km < 0:
            raise DomainError("La distancia no puede ser negativa")
        if datos.distancia_min < 0:
            raise DomainError("El tiempo estimado de viaje no puede ser negativo")

        centro = await self._asegurar_centro(
            datos.direccion.strip(), datos.distancia_km, datos.distancia_min
        )
        await self.session.commit()
        return centro

    async def registrar(self, datos: DatosCliente) -> Cliente:
        """Registra un cliente nuevo con su contacto y dirección; asocia sus centros de distribución."""
        self._validar_datos(datos)
        rut = normalizar_rut(datos.rut)

        if await self.clientes.existe_rut(rut):
            raise DomainError(f"El RUT {rut} ya está registrado")

        mail_limpio = datos.mail.strip().lower() if datos.mail and datos.mail.strip() else None
        if mail_limpio and await self.clientes.existe_mail(mail_limpio):
            raise DomainError(f"El correo {mail_limpio} ya está registrado")

        telefono_limpio = datos.telefono.strip() if datos.telefono and datos.telefono.strip() else None
        if telefono_limpio and await self.clientes.existe_telefono(telefono_limpio):
            raise DomainError(f"El teléfono {telefono_limpio} ya está registrado")

        direccion_limpia = datos.direccion.strip() if datos.direccion and datos.direccion.strip() else None

        cliente = Cliente(
            razon=datos.razon.strip(),
            rut=rut,
            direccion=direccion_limpia,
            mail=mail_limpio,
            telefono=telefono_limpio,
        )

        centros_a_asignar: list[CentroDistribucion] = []
        if datos.centros_ids:
            centros_existentes = await self.centros.obtener_por_ids(datos.centros_ids)
            centros_a_asignar.extend(centros_existentes)

        for cn in datos.centros_nuevos:
            c = await self._asegurar_centro(
                cn.direccion.strip(), cn.distancia_km, cn.distancia_min
            )
            if not any(existente.id == c.id for existente in centros_a_asignar):
                centros_a_asignar.append(c)

        cliente.centros = centros_a_asignar

        self.clientes.agregar(cliente)
        await self._commit(rut)
        return await self._cliente_existente(cliente.id)

    async def editar(self, id: int, datos: DatosCliente) -> Cliente:
        """Actualiza los datos, dirección y centros de un cliente existente."""
        cliente = await self._cliente_existente(id)
        self._validar_datos(datos)
        rut = normalizar_rut(datos.rut)

        if await self.clientes.existe_rut(rut, excepto_id=id):
            raise DomainError(f"El RUT {rut} ya está registrado")

        mail_limpio = datos.mail.strip().lower() if datos.mail and datos.mail.strip() else None
        if mail_limpio and await self.clientes.existe_mail(mail_limpio, excepto_id=id):
            raise DomainError(f"El correo {mail_limpio} ya está registrado")

        telefono_limpio = datos.telefono.strip() if datos.telefono and datos.telefono.strip() else None
        if telefono_limpio and await self.clientes.existe_telefono(telefono_limpio, excepto_id=id):
            raise DomainError(f"El teléfono {telefono_limpio} ya está registrado")

        direccion_limpia = datos.direccion.strip() if datos.direccion and datos.direccion.strip() else None

        cliente.razon = datos.razon.strip()
        cliente.rut = rut
        cliente.direccion = direccion_limpia
        cliente.mail = mail_limpio
        cliente.telefono = telefono_limpio

        centros_a_asignar: list[CentroDistribucion] = []
        if datos.centros_ids:
            centros_existentes = await self.centros.obtener_por_ids(datos.centros_ids)
            centros_a_asignar.extend(centros_existentes)

        for cn in datos.centros_nuevos:
            c = await self._asegurar_centro(
                cn.direccion.strip(), cn.distancia_km, cn.distancia_min
            )
            if not any(existente.id == c.id for existente in centros_a_asignar):
                centros_a_asignar.append(c)

        cliente.centros = centros_a_asignar

        await self._commit(rut)
        return await self._cliente_existente(id)

    # ── Auxiliares ───────────────────────────────────────────────────────────

    async def _asegurar_centro(
        self, direccion: str, distancia_km: Decimal, distancia_min: int
    ) -> CentroDistribucion:
        centro = await self.centros.obtener_por_direccion(direccion)
        if centro is None:
            centro = CentroDistribucion(
                direccion=direccion,
                distancia_km=distancia_km,
                distancia_min=distancia_min,
            )
            self.centros.agregar(centro)
            await self.session.flush()
        else:
            # Actualiza distancias si fueron reconfiguradas
            centro.distancia_km = distancia_km
            centro.distancia_min = distancia_min
            await self.session.flush()
        return centro

    async def _cliente_existente(self, id: int) -> Cliente:
        cliente = await self.clientes.obtener(id)
        if cliente is None:
            raise DomainError(f"No existe un cliente con id {id}")
        return cliente

    async def _commit(self, rut: str) -> None:
        try:
            await self.session.commit()
        except IntegrityError as e:
            await self.session.rollback()
            raise DomainError(
                f"Error de integridad: el RUT {rut} o el correo ya se encuentra registrado"
            ) from e

    @staticmethod
    def _validar_datos(datos: DatosCliente) -> None:
        if not datos.razon.strip():
            raise DomainError("La razón social es obligatoria")
        if not datos.rut.strip():
            raise DomainError("El RUT es obligatorio")
        if datos.mail and datos.mail.strip() and not _FORMATO_EMAIL.match(datos.mail.strip()):
            raise DomainError(f"El correo {datos.mail.strip()!r} no es válido")
        for cn in datos.centros_nuevos:
            if not cn.direccion.strip():
                raise DomainError("La dirección del centro de distribución es obligatoria")
            if cn.distancia_km < 0:
                raise DomainError("La distancia no puede ser negativa")
            if cn.distancia_min < 0:
                raise DomainError("El tiempo estimado de viaje no puede ser negativo")
