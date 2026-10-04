"""viaje id_carga unico

Revision ID: c7e3bb2cc13b
Revises: c7e2a9f4b1d3
Create Date: 2026-10-01 21:21:40.360793

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

import sqlmodel


# revision identifiers, used by Alembic.
revision: str = 'c7e3bb2cc13b'
down_revision: Union[str, None] = 'c7e2a9f4b1d3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_unique_constraint("viaje_id_carga_key", 'viaje', ['id_carga'])
    # ### end Alembic commands ###


def downgrade() -> None:
    op.drop_constraint("viaje_id_carga_key", 'viaje', type_='unique')
    # ### end Alembic commands ###
