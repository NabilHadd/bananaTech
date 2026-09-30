"""estados_pedido_y_carga

El estado inicial del pedido se llama Creada (backlog HU3.3, HU3.4, HU5.3),
no "En espera"; el de la carga, Creada en vez de Creado. La carga suma
Confirmada (validada por HU4.2, lista para asignarle viaje) y Finalizada
(nota de HU5.3).

Postgres guarda el nombre del miembro del enum (EN_ESPERA, CREADO...), no su
valor en Python: por eso se renombra y agrega por nombre.

Revision ID: a8d3f6b2e1c7
Revises: c4429d14dd33
Create Date: 2026-09-30 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'a8d3f6b2e1c7'
down_revision: Union[str, None] = 'c4429d14dd33'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # RENAME VALUE actualiza también las filas existentes.
    op.execute("ALTER TYPE pedidoestado RENAME VALUE 'EN_ESPERA' TO 'CREADA'")
    op.execute("ALTER TYPE cargaestado RENAME VALUE 'CREADO' TO 'CREADA'")
    # Alembic corre todas las migraciones en una transacción, y Postgres no deja
    # usar un valor de enum en la misma transacción que lo agrega: se agregan
    # fuera de ella para que las migraciones siguientes puedan usarlos.
    # AFTER mantiene el orden del ciclo de vida en el tipo.
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE cargaestado ADD VALUE IF NOT EXISTS 'CONFIRMADA' AFTER 'CREADA'")
        op.execute("ALTER TYPE cargaestado ADD VALUE IF NOT EXISTS 'FINALIZADA' AFTER 'EN_RUTA'")


def downgrade() -> None:
    op.execute("ALTER TYPE pedidoestado RENAME VALUE 'CREADA' TO 'EN_ESPERA'")

    # Postgres no permite quitar valores de un enum: se recrea el tipo sin ellos.
    # Se pierde información: Confirmada vuelve a Creado y Finalizada a En ruta.
    op.execute("ALTER TYPE cargaestado RENAME VALUE 'CREADA' TO 'CREADO'")
    op.execute("UPDATE carga SET estado = 'CREADO' WHERE estado = 'CONFIRMADA'")
    op.execute("UPDATE carga SET estado = 'EN_RUTA' WHERE estado = 'FINALIZADA'")
    op.execute("ALTER TYPE cargaestado RENAME TO cargaestado_old")
    op.execute("CREATE TYPE cargaestado AS ENUM ('CREADO', 'EN_RUTA', 'CANCELADA')")
    op.execute(
        "ALTER TABLE carga ALTER COLUMN estado TYPE cargaestado "
        "USING estado::text::cargaestado"
    )
    op.execute("DROP TYPE cargaestado_old")
