"""seed_conductores_e02

Corrige el dígito verificador de dos RUT del seed de conductores. Desde la
Épica 2 el backend valida el RUT (HU2.2) y rechazaría editar a estos
conductores con su RUT original.

Revision ID: c3d8e2f1a4b6
Revises: b7e4a1c9d2f3
Create Date: 2026-09-28 18:00:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'c3d8e2f1a4b6'
down_revision: str | None = 'b7e4a1c9d2f3'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

# (RUT del seed original, RUT con el dígito verificador correcto)
CORRECCIONES = [
    ('15.111.222-3', '15.111.222-6'),  # Juan Pérez
    ('17.555.666-7', '17.555.666-4'),  # Luis Silva
]


def upgrade() -> None:
    conn = op.get_bind()
    for original, corregido in CORRECCIONES:
        conn.execute(
            sa.text("UPDATE conductor SET rut = :corregido WHERE rut = :original"),
            {"original": original, "corregido": corregido},
        )


def downgrade() -> None:
    conn = op.get_bind()
    for original, corregido in CORRECCIONES:
        conn.execute(
            sa.text("UPDATE conductor SET rut = :original WHERE rut = :corregido"),
            {"original": original, "corregido": corregido},
        )
