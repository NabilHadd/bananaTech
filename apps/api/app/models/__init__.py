# Este archivo es crucial para que SQLModel (y SQLAlchemy) reconozca 
# todas las tablas antes de crear la base de datos o generar migraciones.

from app.models.camion import Camion, CamionTipo, Documento, DocumentoTipo, TipoCamion
from app.models.cliente import CentroDistribucion, Cliente, ClienteCentro
from app.models.conductor import (
    ClaseLicencia,
    ClaseLicenciaTipoCamion,
    Conductor,
    Licencia,
    LicenciaClase,
)
from app.models.pedido import Carga, CargaEstado, MercaderiaTipo, Pedido, PedidoCarga, PedidoEstado
from app.models.viaje import Viaje

__all__ = [
    "Camion",
    "CamionTipo",
    "TipoCamion",
    "Documento",
    "DocumentoTipo",
    "Cliente",
    "CentroDistribucion",
    "ClienteCentro",
    "Conductor",
    "Licencia",
    "ClaseLicencia",
    "LicenciaClase",
    "ClaseLicenciaTipoCamion",
    "Pedido",
    "Carga",
    "PedidoCarga",
    "MercaderiaTipo",
    "PedidoEstado",
    "CargaEstado",
    "Viaje",
]
