from datetime import datetime
from decimal import Decimal

from sqlmodel import Field, SQLModel


class Usuario(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True, max_length=80)
    password_hash: str
    rol: str = Field(max_length=20)
    activo: bool = Field(default=True)


class Parametro(SQLModel, table=True):
    clave: str = Field(primary_key=True, max_length=80)
    valor: Decimal = Field(max_digits=18, decimal_places=4)
    unidad: str = Field(max_length=30)


class ParametroAuditoria(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    clave: str = Field(foreign_key="parametro.clave", index=True)
    valor_anterior: Decimal = Field(max_digits=18, decimal_places=4)
    valor_nuevo: Decimal = Field(max_digits=18, decimal_places=4)
    cambiado_por: int | None = Field(default=None, foreign_key="usuario.id", ondelete="SET NULL")
    cambiado_por_username: str = Field(max_length=80)
    cambiado_en: datetime = Field()