"""viaje_datos_llegada

`fecha_fin` es el término previsto del viaje. La llegada real al centro de
distribución se registra al finalizarlo: hora, quién recibe y una observación
opcional. Quedan vacíos mientras el viaje está en ruta.

Revision ID: f2b9c4e7a1d5
Revises: a8d3f6b2e1c7
Create Date: 2026-09-30 13:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = 'f2b9c4e7a1d5'
down_revision: Union[str, None] = 'a8d3f6b2e1c7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('viaje', sa.Column('fecha_llegada', sa.DateTime(), nullable=True))
    op.add_column('viaje', sa.Column('receptor', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    op.add_column('viaje', sa.Column('observacion', sqlmodel.sql.sqltypes.AutoString(), nullable=True))


def downgrade() -> None:
    op.drop_column('viaje', 'observacion')
    op.drop_column('viaje', 'receptor')
    op.drop_column('viaje', 'fecha_llegada')
