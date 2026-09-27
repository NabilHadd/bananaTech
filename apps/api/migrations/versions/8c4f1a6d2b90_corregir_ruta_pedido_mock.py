"""Retirar del seed la asignación de pedido a una ruta ajena."""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "8c4f1a6d2b90"
down_revision: str | None = "7b2e91c4d6a0"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute(
        sa.text(
            """
            DELETE FROM pedido_carga AS pc
            USING pedido AS p, cliente AS cl, carga AS c, centro_distribucion AS cd
            WHERE pc.id_pedido = p.id
              AND p.id_cliente = cl.id
              AND pc.id_carga = c.id
              AND c.id_centro = cd.id
              AND cl.rut = '76.123.456-7'
              AND p.peso_kg = 8000
              AND p.ventana_inicio = '2026-09-23 08:00:00'
              AND c.estado = 'CREADO'
              AND cd.direccion = 'Antofagasta (La Negra)'
            """
        )
    )


def downgrade() -> None:
    pass