"""preserve parameter audit history when deleting users"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "a1c4e8d2f6b0"
down_revision: str | None = "f6a3b2c1d9e8"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "parametroauditoria",
        sa.Column("cambiado_por_username", sa.String(length=80), nullable=True),
    )
    op.execute(
        sa.text(
            "UPDATE parametroauditoria AS auditoria "
            "SET cambiado_por_username = usuario.username "
            "FROM usuario WHERE usuario.id = auditoria.cambiado_por"
        )
    )
    op.alter_column("parametroauditoria", "cambiado_por_username", nullable=False)
    op.drop_constraint(
        "parametroauditoria_cambiado_por_fkey", "parametroauditoria", type_="foreignkey"
    )
    op.alter_column("parametroauditoria", "cambiado_por", nullable=True)
    op.create_foreign_key(
        "parametroauditoria_cambiado_por_fkey",
        "parametroauditoria",
        "usuario",
        ["cambiado_por"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint(
        "parametroauditoria_cambiado_por_fkey", "parametroauditoria", type_="foreignkey"
    )
    op.create_foreign_key(
        "parametroauditoria_cambiado_por_fkey",
        "parametroauditoria",
        "usuario",
        ["cambiado_por"],
        ["id"],
    )
    op.alter_column("parametroauditoria", "cambiado_por", nullable=False)
    op.drop_column("parametroauditoria", "cambiado_por_username")