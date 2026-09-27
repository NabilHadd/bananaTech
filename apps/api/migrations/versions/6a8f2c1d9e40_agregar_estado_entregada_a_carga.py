"""Agregar el estado entregada a carga."""

from collections.abc import Sequence

from alembic import op

revision: str = "6a8f2c1d9e40"
down_revision: str | None = "39ccd34b8fc7"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("ALTER TYPE cargaestado ADD VALUE IF NOT EXISTS 'ENTREGADA'")


def downgrade() -> None:
    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM carga WHERE estado::text = 'ENTREGADA'
            ) THEN
                RAISE EXCEPTION
                    'Downgrade bloqueado: existen cargas entregadas';
            END IF;
        END $$;
        """
    )
    op.execute("ALTER TYPE cargaestado RENAME TO cargaestado_with_entregada")
    op.execute(
        "CREATE TYPE cargaestado AS ENUM ('CREADO', 'EN_RUTA', 'CANCELADA')"
    )
    op.execute(
        "ALTER TABLE carga ALTER COLUMN estado TYPE cargaestado "
        "USING estado::text::cargaestado"
    )
    op.execute("DROP TYPE cargaestado_with_entregada")