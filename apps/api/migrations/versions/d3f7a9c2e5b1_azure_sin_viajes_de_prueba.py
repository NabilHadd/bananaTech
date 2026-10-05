"""azure: sin viajes de prueba

Sólo en la rama azure-deployment. Borra los dos viajes finalizados que creó el
seed de la E01 (b7e4a1c9d2f3): en la demo los viajes se generan desde el
software. Sus cargas vuelven a Confirmada y sus pedidos a Creada, listas para
salir en un viaje nuevo.

Revision ID: d3f7a9c2e5b1
Revises: b8e2d4f6a1c3
Create Date: 2026-10-04 00:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "d3f7a9c2e5b1"
down_revision: str | None = "b8e2d4f6a1c3"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

# Los mismos viajes que inserta b7e4a1c9d2f3: camión y salida.
VIAJES_SEED = """
    SELECT v.id, v.id_carga FROM viaje v
    JOIN camion ca ON ca.id = v.id_camion
    WHERE (ca.patente, v.fecha_inicio) IN (
        ('ABCD-12', TIMESTAMP '2026-09-10 07:30'),
        ('EFGH-34', TIMESTAMP '2026-05-28 05:30')
    )
"""


def upgrade() -> None:
    conn = op.get_bind()
    cargas = [r.id_carga for r in conn.execute(sa.text(VIAJES_SEED))]
    if not cargas:
        return
    conn.execute(
        sa.text(f"DELETE FROM viaje WHERE id IN (SELECT id FROM ({VIAJES_SEED}) s)")
    )
    # Los estados van como literales: Postgres los convierte al enum.
    conn.execute(
        sa.text("UPDATE carga SET estado = 'CONFIRMADA' WHERE id = ANY(:ids)"),
        {"ids": cargas},
    )
    conn.execute(
        sa.text(
            "UPDATE pedido SET estado = 'CREADA' WHERE id IN "
            "(SELECT id_pedido FROM pedido_carga WHERE id_carga = ANY(:ids))"
        ),
        {"ids": cargas},
    )


def downgrade() -> None:
    # Vuelve a dejar los viajes finalizados como los dejaba el seed (la
    # llegada se registra a la hora de término prevista).
    conn = op.get_bind()
    conn.execute(
        sa.text("""
        INSERT INTO viaje (id_conductor, id_camion, id_carga, fecha_inicio, fecha_fin, fecha_llegada)
        SELECT co.id, ca.id, pc.id_carga, v.inicio::timestamp, v.fin::timestamp, v.fin::timestamp
        FROM (VALUES
            ('ABCD-12', 'Juan',   15000, '2026-09-10 07:30', '2026-09-10 13:45'),
            ('EFGH-34', 'Carlos', 25000, '2026-05-28 05:30', '2026-05-28 19:00')
        ) AS v(patente, conductor, peso_pedido, inicio, fin)
        JOIN camion ca ON ca.patente = v.patente
        JOIN conductor co ON co.nombres = v.conductor
        JOIN pedido p ON p.peso_kg = v.peso_pedido
        JOIN pedido_carga pc ON pc.id_pedido = p.id
    """)
    )
    conn.execute(
        sa.text(f"""
        UPDATE carga SET estado = 'FINALIZADA'
        WHERE id IN (SELECT id_carga FROM ({VIAJES_SEED}) s)
    """)
    )
    conn.execute(
        sa.text(f"""
        UPDATE pedido SET estado = 'ENTREGADO'
        WHERE id IN (
            SELECT pc.id_pedido FROM pedido_carga pc
            WHERE pc.id_carga IN (SELECT id_carga FROM ({VIAJES_SEED}) s)
        )
    """)
    )
