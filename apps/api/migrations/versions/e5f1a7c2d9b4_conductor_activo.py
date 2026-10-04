"""conductor_activo

Agrega `conductor.activo` para dar de baja conductores con una baja lógica
(RNF-06), igual que `camion.activo`. Los conductores existentes quedan activos.

Revision ID: e5f1a7c2d9b4
Revises: c3d8e2f1a4b6
Create Date: 2026-09-28 20:00:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'e5f1a7c2d9b4'
down_revision: str | None = 'c3d8e2f1a4b6'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # server_default para que las filas existentes queden activas.
    op.add_column('conductor', sa.Column('activo', sa.Boolean(), server_default='true', nullable=False))


def downgrade() -> None:
    # Se pierde qué conductores estaban de baja: al volver, todos quedan activos.
    op.drop_column('conductor', 'activo')
