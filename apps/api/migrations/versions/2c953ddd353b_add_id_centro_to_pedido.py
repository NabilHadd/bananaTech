"""add id_centro to pedido

Revision ID: 2c953ddd353b
Revises: e5f1a7c2d9b4
Create Date: 2026-09-29 22:21:14.201381

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = '2c953ddd353b'
down_revision: str | None = 'e5f1a7c2d9b4'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column('pedido', sa.Column('id_centro', sa.Integer(), nullable=True))
    op.execute("""
        UPDATE pedido p
        SET id_centro = (
            SELECT cc.id_centro
            FROM cliente_centro cc
            WHERE cc.id_cliente = p.id_cliente
            LIMIT 1
        )
    """)
    op.alter_column('pedido', 'id_centro', nullable=False)
    op.create_foreign_key('fk_pedido_id_centro', 'pedido', 'centro_distribucion', ['id_centro'], ['id'])


def downgrade() -> None:
    op.drop_constraint('fk_pedido_id_centro', 'pedido', type_='foreignkey')
    op.drop_column('pedido', 'id_centro')
