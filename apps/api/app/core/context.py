from typing import Annotated

from fastapi import Depends, HTTPException, Request
from sqlmodel.ext.asyncio.session import AsyncSession
from strawberry.fastapi import BaseContext

from app.admin.repository import AdministracionRepository
from app.admin.service import AdministracionService
from app.cargas.repository import CargaRepository
from app.cargas.service import CargasService
from app.clientes.repository import CentroDistribucionRepository, ClienteRepository
from app.clientes.service import ClientesService
from app.conductores.repository import (
    ClaseLicenciaRepository,
    ConductorRepository,
    ViajeConductorRepository,
)
from app.conductores.service import ConductoresService
from app.core.auth import authenticate_token
from app.core.db import get_session
from app.dashboard.repository import DashboardRepository
from app.dashboard.service import DashboardService
from app.flota.repository import (
    CamionRepository,
    TipoCamionRepository,
    ViajeCamionRepository,
)
from app.flota.service import FlotaService
from app.pedidos.repository import PedidoRepository
from app.pedidos.service import PedidosService
from app.viajes.repository import ViajeRepository
from app.viajes.service import ViajesService


class Context(BaseContext):
    """Lo que reciben los resolvers en `info.context`.

    Hereda de BaseContext porque Strawberry le inyecta ahí `request`,
    `response` y `background_tasks` (útiles para auth y cookies más adelante).
    """

    def __init__(self, session: AsyncSession, usuario) -> None:
        super().__init__()
        self.session = session
        self.usuario = usuario
        # Service y repositorios comparten la sesión: un commit del service
        # confirma todo lo que hicieron los repositorios en este request.
        cliente_repo = ClienteRepository(session)
        centro_repo = CentroDistribucionRepository(session)
        camion_repo = CamionRepository(session)
        pedido_repo = PedidoRepository(session)
        conductor_repo = ConductorRepository(session)
        tipo_camion_repo = TipoCamionRepository(session)
        viaje_camion_repo = ViajeCamionRepository(session)
        viaje_conductor_repo = ViajeConductorRepository(session)
        clase_licencia_repo = ClaseLicenciaRepository(session)
        cargas_repo = CargaRepository(session)
        viaje_repo = ViajeRepository(session)
        administracion_repo = AdministracionRepository(session)
        dashboard_repo = DashboardRepository(session)

        self.flota = FlotaService(
            session,
            camion_repo,
            tipo_camion_repo,
            viaje_camion_repo,
        )
        self.conductores = ConductoresService(
            session,
            conductor_repo,
            clase_licencia_repo,
            viaje_conductor_repo,
        )
        self.clientes = ClientesService(
            session,
            cliente_repo,
            centro_repo,
        )
        self.pedidos = PedidosService(
            session,
            pedido_repo,
            cliente_repo,
            centro_repo,
        )
        self.cargas = CargasService(
            session,
            cargas_repo,
            camion_repo,
        )
        # Viajes coordina a los demás: usa sus services, no sus repositorios.
        self.viajes = ViajesService(
            session,
            viaje_repo,
            self.cargas,
            self.flota,
            self.conductores,
        )
        self.administracion = AdministracionService(session, administracion_repo)
        self.dashboard = DashboardService(session, dashboard_repo)


async def build_context(
    session: Annotated[AsyncSession, Depends(get_session)],
    request: Request,
) -> Context:
    """Aquí se arma el grafo de dependencias: una sesión por request."""
    authorization = request.headers.get("Authorization", "")
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Debes iniciar sesión.")
    usuario = await authenticate_token(session, token)
    return Context(session, usuario)
