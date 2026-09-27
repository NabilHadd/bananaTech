"""Agregar estado persistido a los viajes."""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "c6d4187a2e51"
down_revision: str | None = "a94e7f3c1b20"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    estado_viaje = postgresql.ENUM(
        "EN_RUTA",
        "FINALIZADO",
        "CANCELADO",
        name="viajeestado",
    )
    estado_viaje.create(op.get_bind(), checkfirst=True)
    op.add_column(
        "viaje",
        sa.Column(
            "estado",
            estado_viaje,
            server_default="FINALIZADO",
            nullable=False,
        ),
    )
    op.alter_column("viaje", "estado", server_default=None)


def downgrade() -> None:
    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (SELECT 1 FROM viaje WHERE estado = 'EN_RUTA') THEN
                RAISE EXCEPTION
                    'Downgrade bloqueado: existen viajes en curso';
            END IF;
        END $$;
        """
    )
    op.drop_column("viaje", "estado")
    op.execute("DROP TYPE viajeestado")