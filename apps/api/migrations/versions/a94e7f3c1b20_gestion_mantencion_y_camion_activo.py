"""Agregar mantenciones y habilitación activa de camiones."""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "a94e7f3c1b20"
down_revision: str | None = "8c4f1a6d2b90"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "camion",
        sa.Column("activo", sa.Boolean(), server_default=sa.true(), nullable=False),
    )
    op.alter_column("camion", "activo", server_default=None)
    op.create_table(
        "mantencion",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("id_camion", sa.Integer(), nullable=False),
        sa.Column(
            "tipo",
            sa.Enum("PREVENTIVA", "CORRECTIVA", name="mantenciontipo"),
            nullable=False,
        ),
        sa.Column("descripcion", sa.String(), nullable=False),
        sa.Column("fecha_inicio", sa.DateTime(), nullable=False),
        sa.Column("fecha_fin", sa.DateTime(), nullable=True),
        sa.Column(
            "estado",
            sa.Enum(
                "PROGRAMADA",
                "EN_CURSO",
                "COMPLETADA",
                "CANCELADA",
                name="mantencionestado",
            ),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["id_camion"], ["camion.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.execute(
        sa.text(
            """
            INSERT INTO documento (id_camion, tipo, fecha_emision, fecha_vencimiento)
            SELECT c.id, 'SOAP', '2026-03-01', '2027-03-31'
            FROM camion AS c
            WHERE c.patente IN ('ABCD-12', 'EFGH-34', 'IJKL-56')
              AND NOT EXISTS (
                  SELECT 1 FROM documento AS d
                  WHERE d.id_camion = c.id AND d.tipo::text = 'SOAP'
              )
            """
        )
    )


def downgrade() -> None:
    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (SELECT 1 FROM mantencion) THEN
                RAISE EXCEPTION
                    'Downgrade bloqueado: existen registros de mantención';
            END IF;
            IF EXISTS (SELECT 1 FROM camion WHERE activo = false) THEN
                RAISE EXCEPTION
                    'Downgrade bloqueado: hay camiones desactivados';
            END IF;
        END $$;
        """
    )
    op.drop_table("mantencion")
    op.drop_column("camion", "activo")
    op.execute("DROP TYPE mantencionestado")
    op.execute("DROP TYPE mantenciontipo")
