"""seed catalogos; tipo_camion, clase_licencia

Revision ID: 5d54c50ca37d
Revises: 00b9140141e9
Create Date: 2026-09-18 00:50:26.121996

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '5d54c50ca37d'
down_revision: Union[str, None] = '00b9140141e9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


LICENCIA_CLASES = ["A1", "A2", "A3", "A4", "A5", "B", "C", "D", "E", "F"]

licencia_clase_enum = postgresql.ENUM(*LICENCIA_CLASES, name="licenciaclase", create_type=False)

clase_licencia = sa.table(
    "clase_licencia",
    sa.column("clase", licencia_clase_enum),
    sa.column("descripcion", sa.String),
)



def upgrade() -> None:
    op.bulk_insert(clase_licencia, [
        {"clase": "A1", "descripcion": "Taxis y transporte de pasajeros hasta 17 asientos"},
        {"clase": "A2", "descripcion": "Transporte de pasajeros sobre 17 asientos"},
        {"clase": "A3", "descripcion": "A1 y A2 sin límite de asientos"},
        {"clase": "A4", "descripcion": "Transporte de carga sobre 3.500 kg"},
        {"clase": "A5", "descripcion": "A4 incluyendo vehículos articulados"},
        {"clase": "B",  "descripcion": "Vehículos motorizados livianos"},
        {"clase": "C",  "descripcion": "Vehículos motorizados de dos o tres ruedas"},
        {"clase": "D",  "descripcion": "Maquinaria automotriz"},
        {"clase": "E",  "descripcion": "Vehículos de tracción animal"},
        {"clase": "F",  "descripcion": "Vehículos especiales (FF.AA., Carabineros, Bomberos)"},
    ])




def downgrade() -> None:
    op.execute("DELETE FROM clase_licencia")
