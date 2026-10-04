from sqlalchemy.orm import selectinload
from sqlmodel import col, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models import Camion, ClaseLicencia, Cliente, Conductor, Licencia
from app.models.pedido import Carga, Pedido
from app.models.viaje import Viaje


class ViajeRepository:
  def __init__(self, session: AsyncSession) -> None:
    self.session = session

  async def listar(self) -> list[Viaje]:
      stmt = self._con_relaciones().order_by(col(Viaje.fecha_inicio).desc())
      return list((await self.session.exec(stmt)).all())

  async def obtener(self, id: int) -> Viaje | None:
      stmt = self._con_relaciones().where(Viaje.id == id)
      return (await self.session.exec(stmt)).first()
  
  def _con_relaciones(self):
      # En async no hay carga perezosa: se trae todo lo que leen
      # ConductorType, CamionType y CargaType (ver sus _con_relaciones).
      camion = selectinload(Viaje.camion)
      carga = selectinload(Viaje.carga)
      pedidos = carga.selectinload(Carga.pedidos)
      return select(Viaje).options(
          selectinload(Viaje.conductor)
          .selectinload(Conductor.licencias)
          .selectinload(Licencia.clases)
          .selectinload(ClaseLicencia.tipos_camion),
          camion.selectinload(Camion.tipo_camion),
          camion.selectinload(Camion.documentos),
          carga.selectinload(Carga.centro),
          pedidos.selectinload(Pedido.cliente).selectinload(Cliente.centros),
          pedidos.selectinload(Pedido.centro),
          pedidos.selectinload(Pedido.cargas),
      )

  async def agregar(self, viaje: Viaje) -> None:
    self.session.add(viaje)


