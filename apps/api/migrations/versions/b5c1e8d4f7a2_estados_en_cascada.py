"""estados_en_cascada

Los estados de carga y pedido ya no se editan a mano: los mueve el viaje.
Esta migración deja los datos existentes coherentes con esa regla y quita los
campos de entrega del pedido, que pasaron al viaje (`f2b9c4e7a1d5`).

1. Los viajes cuyo término previsto ya pasó se dan por llegados a esa hora.
2. La carga de un viaje llegado queda Finalizada; la de uno en curso, En ruta.
3. Cada pedido no cancelado toma el estado de su carga: En ruta → Tránsito,
   Finalizada → Entregado; si no tiene una de esas, Creada.

Revision ID: b5c1e8d4f7a2
Revises: f2b9c4e7a1d5
Create Date: 2026-09-30 15:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = 'b5c1e8d4f7a2'
down_revision: Union[str, None] = 'f2b9c4e7a1d5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Las columnas son timestamp sin zona en hora de la operación (app/core/tiempo.py).
AHORA = "(now() AT TIME ZONE 'America/Santiago')"


def upgrade() -> None:
    op.execute(f"""
        UPDATE viaje v SET fecha_llegada = v.fecha_fin
        FROM carga c
        WHERE c.id = v.id_carga
          AND c.estado <> 'CANCELADA'
          AND v.fecha_llegada IS NULL
          AND v.fecha_fin <= {AHORA}
    """)
    op.execute("""
        UPDATE carga c
        SET estado = CASE WHEN v.fecha_llegada IS NULL THEN 'EN_RUTA' ELSE 'FINALIZADA' END::cargaestado
        FROM viaje v
        WHERE v.id_carga = c.id AND c.estado <> 'CANCELADA'
    """)
    op.execute("""
        UPDATE pedido p
        SET estado = CASE
            WHEN EXISTS (
                SELECT 1 FROM pedido_carga pc JOIN carga c ON c.id = pc.id_carga
                WHERE pc.id_pedido = p.id AND c.estado = 'EN_RUTA'
            ) THEN 'TRANSITO'
            WHEN EXISTS (
                SELECT 1 FROM pedido_carga pc JOIN carga c ON c.id = pc.id_carga
                WHERE pc.id_pedido = p.id AND c.estado = 'FINALIZADA'
            ) THEN 'ENTREGADO'
            ELSE 'CREADA'
        END::pedidoestado
        WHERE p.estado <> 'CANCELADO'
    """)

    op.drop_column('pedido', 'observaciones')
    op.drop_column('pedido', 'receptor')
    op.drop_column('pedido', 'fecha_entrega')


def downgrade() -> None:
    # Las columnas vuelven vacías, y los estados recalculados no se revierten.
    op.add_column('pedido', sa.Column('fecha_entrega', sa.DateTime(), nullable=True))
    op.add_column('pedido', sa.Column('receptor', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    op.add_column('pedido', sa.Column('observaciones', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
