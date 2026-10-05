"""parametros con dos decimales

Los parámetros son montos en CLP y horas: 4 decimales sólo agregaban ceros
(1300.0000) al mostrarlos.

Revision ID: b8e2d4f6a1c3
Revises: a1c4e8d2f6b0
Create Date: 2026-10-04 00:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "b8e2d4f6a1c3"
down_revision: str | None = "a1c4e8d2f6b0"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

COLUMNAS = (
    ("parametro", "valor"),
    ("parametroauditoria", "valor_anterior"),
    ("parametroauditoria", "valor_nuevo"),
)


def upgrade() -> None:
    # Postgres redondea los valores existentes a 2 decimales al convertir.
    for tabla, columna in COLUMNAS:
        op.alter_column(
            tabla,
            columna,
            type_=sa.Numeric(18, 2),
            existing_type=sa.Numeric(18, 4),
            existing_nullable=False,
        )


def downgrade() -> None:
    for tabla, columna in COLUMNAS:
        op.alter_column(
            tabla,
            columna,
            type_=sa.Numeric(18, 4),
            existing_type=sa.Numeric(18, 2),
            existing_nullable=False,
        )
