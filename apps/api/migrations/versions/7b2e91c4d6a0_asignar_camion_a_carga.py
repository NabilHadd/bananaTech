"""Asignar el camión seleccionado a cada carga."""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "7b2e91c4d6a0"
down_revision: str | None = "6a8f2c1d9e40"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("carga", sa.Column("id_camion", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_carga_id_camion_camion",
        "carga",
        "camion",
        ["id_camion"],
        ["id"],
    )


def downgrade() -> None:
    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (SELECT 1 FROM carga WHERE id_camion IS NOT NULL) THEN
                RAISE EXCEPTION
                    'Downgrade bloqueado: cargas tienen camión asignado';
            END IF;
        END $$;
        """
    )
    op.drop_constraint("fk_carga_id_camion_camion", "carga", type_="foreignkey")
    op.drop_column("carga", "id_camion")