# Este archivo es crucial para que SQLModel (y SQLAlchemy) reconozca
# todas las tablas antes de crear la base de datos o generar migraciones.

from app.models.camion import (
    Camion,
    CamionEstadoOperativo,
    Documento,
    DocumentoTipo,
    TipoCamion,
)
from app.models.cliente import CentroDistribucion, Cliente, ClienteCentro
from app.models.conductor import (
    ClaseLicencia,
    ClaseLicenciaTipoCamion,
    Conductor,
    Licencia,
    LicenciaClase,
    LicenciaClaseLink,
)
from app.models.mantencion import Mantencion, MantencionEstado, MantencionTipo
from app.models.pedido import (
    Carga,
    CargaEstado,
    MercaderiaTipo,
    Pedido,
    PedidoCarga,
    PedidoEstado,
)
from app.models.viaje import Viaje, ViajeEstado

__all__ = [
    "Camion",
    "CamionEstadoOperativo",
    "Carga",
    "CargaEstado",
    "CentroDistribucion",
    "ClaseLicencia",
    "ClaseLicenciaTipoCamion",
    "Cliente",
    "ClienteCentro",
    "Conductor",
    "Documento",
    "DocumentoTipo",
    "Licencia",
    "LicenciaClase",
    "LicenciaClaseLink",
    "Mantencion",
    "MantencionEstado",
    "MantencionTipo",
    "MercaderiaTipo",
    "Pedido",
    "PedidoCarga",
    "PedidoEstado",
    "TipoCamion",
    "Viaje",
    "ViajeEstado",
]
