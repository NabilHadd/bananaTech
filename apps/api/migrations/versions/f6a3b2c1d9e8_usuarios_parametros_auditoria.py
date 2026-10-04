"""usuarios, parametros financieros y auditoria"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "f6a3b2c1d9e8"
down_revision: str | None = "e4b6d9f2a731"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("viaje", sa.Column("viatico_diario_clp", sa.Numeric(10, 2), nullable=True))
    op.add_column("viaje", sa.Column("costo_viatico_clp", sa.Numeric(14, 2), nullable=True))
    op.create_table(
        "usuario",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("username", sa.String(80), nullable=False, unique=True),
        sa.Column("password_hash", sa.String(), nullable=False),
        sa.Column("rol", sa.String(20), nullable=False),
        sa.Column("activo", sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    op.create_index("ix_usuario_username", "usuario", ["username"])
    op.create_table(
        "parametro",
        sa.Column("clave", sa.String(80), primary_key=True),
        sa.Column("valor", sa.Numeric(18, 4), nullable=False),
        sa.Column("unidad", sa.String(30), nullable=False),
    )
    op.create_table(
        "parametroauditoria",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("clave", sa.String(80), sa.ForeignKey("parametro.clave"), nullable=False),
        sa.Column("valor_anterior", sa.Numeric(18, 4), nullable=False),
        sa.Column("valor_nuevo", sa.Numeric(18, 4), nullable=False),
        sa.Column("cambiado_por", sa.Integer(), sa.ForeignKey("usuario.id"), nullable=False),
        sa.Column("cambiado_en", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_parametroauditoria_clave", "parametroauditoria", ["clave"])


def downgrade() -> None:
    op.drop_index("ix_parametroauditoria_clave", table_name="parametroauditoria")
    op.drop_table("parametroauditoria")
    op.drop_table("parametro")
    op.drop_index("ix_usuario_username", table_name="usuario")
    op.drop_table("usuario")
    op.drop_column("viaje", "costo_viatico_clp")
    op.drop_column("viaje", "viatico_diario_clp")
