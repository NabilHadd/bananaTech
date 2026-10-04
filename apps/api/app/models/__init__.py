# Este archivo es crucial para que SQLModel (y SQLAlchemy) reconozca 
# todas las tablas antes de crear la base de datos o generar migraciones.

from app.models.camion import Camion, Documento, DocumentoTipo, TipoCamion
from app.models.cliente import CentroDistribucion, Cliente, ClienteCentro
from app.models.conductor import (
    ClaseLicencia,
    ClaseLicenciaTipoCamion,
    Conductor,
    Licencia,
    LicenciaClase,
    LicenciaClaseLink,
)
from app.models.pedido import (
    Carga,
    CargaEstado,
    MercaderiaTipo,
    Pedido,
    PedidoCarga,
    PedidoEstado,
)
from app.models.seguridad import Parametro, ParametroAuditoria, Usuario
from app.models.viaje import Viaje

__all__ = [
    "Camion",
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
    "MercaderiaTipo",
    "Parametro",
    "ParametroAuditoria",
    "Pedido",
    "PedidoCarga",
    "PedidoEstado",
    "TipoCamion",
    "Usuario",
    "Viaje",
]
