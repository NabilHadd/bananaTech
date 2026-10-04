"""base fuera de destinos y telefonos

Revision ID: 766f62fe837c
Revises: 583aa6934749
Create Date: 2026-10-02 00:50:07.601183

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '766f62fe837c'
down_revision: Union[str, None] = '583aa6934749'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


from collections.abc import Sequence

from alembic import op

# (deja aquí las líneas revision / down_revision / branch_labels / depends_on
#  que generó Alembic)

# Las columnas son timestamp sin zona en hora de la operación (app/core/tiempo.py).
AHORA = "(now() AT TIME ZONE 'America/Santiago')"
# La base quedó registrada como centro (0 km, 0 min) en los seeds antiguos.
INVALIDOS = "SELECT id FROM centro_distribucion WHERE distancia_km <= 0 OR distancia_min <= 0"

SENTENCIAS = [
    # 1. Viajes en ruta hacia la base: se cancelan.
    f"""
    UPDATE viaje v SET fecha_cancelacion = {AHORA}
    FROM carga c
    WHERE v.id_carga = c.id AND c.id_centro IN ({INVALIDOS})
      AND v.fecha_llegada IS NULL AND v.fecha_cancelacion IS NULL
    """,
    # 2. Cargas sin terminar hacia la base: quedan Canceladas.
    f"""
    UPDATE carga SET estado = 'CANCELADA'
    WHERE id_centro IN ({INVALIDOS}) AND estado IN ('CREADA', 'CONFIRMADA', 'EN_RUTA')
    """,
    # 3. Pedidos sin entregar hacia la base: quedan Cancelados.
    f"""
    UPDATE pedido SET estado = 'CANCELADO'
    WHERE id_centro IN ({INVALIDOS}) AND estado IN ('CREADA', 'TRANSITO')
    """,
    # 4. La base deja de ser destino de sus clientes. La fila del centro se
    #    conserva: la referencian cargas y pedidos del historial.
    f"DELETE FROM cliente_centro WHERE id_centro IN ({INVALIDOS})",
]

# 5. Teléfonos al formato +569 XXXX XXXX (app/core/telefono.py). En clientes
#    es opcional: uno inválido queda en NULL. En conductores es obligatorio:
#    uno inválido se deja como está y se corrige al editar al conductor.
for tabla, si_invalido in (("cliente", "NULL"), ("conductor", "t.telefono")):
    SENTENCIAS.append(rf"""
    UPDATE {tabla} t SET telefono = CASE
        WHEN n.d ~ '^(\+?56)?9[0-9]{{8}}$'
        THEN '+569 ' || substr(right(n.d, 8), 1, 4) || ' ' || substr(right(n.d, 8), 5, 4)
        ELSE {si_invalido}
    END
    FROM (SELECT id, regexp_replace(telefono, '[[:space:].()-]', '', 'g') AS d FROM {tabla}) n
    WHERE t.id = n.id AND t.telefono IS NOT NULL
    """)


def upgrade() -> None:
    for sql in SENTENCIAS:
        op.execute(sql)


def downgrade() -> None:
    # No se puede deshacer: no se guardan los estados ni los teléfonos anteriores.
    pass