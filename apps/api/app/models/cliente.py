from decimal import Decimal

from sqlmodel import Field, Relationship, SQLModel


class ClienteCentro(SQLModel, table=True):
    __tablename__ = "cliente_centro"
    
    id_cliente: int = Field(foreign_key="cliente.id", primary_key=True)
    id_centro: int = Field(foreign_key="centro_distribucion.id", primary_key=True)
    estado: bool = Field(default=True, description="Indica la vigencia o no de un centro asociado a un cliente.")


class Cliente(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    razon: str = Field(description="Nombre de la empresa")
    rut: str = Field(unique=True)
    direccion: str | None = Field(default=None, description="Dirección de la empresa (solo informativo)")
    mail: str | None = Field(default=None, unique=True)
    telefono: str | None = Field(default=None, unique=True)
    
    # Relación con CentroDistribucion a través de ClienteCentro
    centros: list[CentroDistribucion] = Relationship(
        back_populates="clientes",
        link_model=ClienteCentro
    )


class CentroDistribucion(SQLModel, table=True):
    __tablename__ = "centro_distribucion"
    
    id: int | None = Field(default=None, primary_key=True)
    direccion: str = Field(unique=True)
    distancia_km: Decimal = Field(ge=0, max_digits=10, decimal_places=2)
    distancia_min: int = Field(ge=0)
    
    # Relación con Cliente a través de ClienteCentro
    clientes: list[Cliente] = Relationship(
        back_populates="centros",
        link_model=ClienteCentro
    )
