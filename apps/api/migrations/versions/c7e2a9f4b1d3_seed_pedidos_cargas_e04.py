"""seed_pedidos_cargas_e04

Datos para probar el armado de cargas (HU4.1–4.3): varias cargas por centro de
distribución, en distintos estados, y pedidos libres con los mismos destinos
para sumarlos a ellas.

- Coquimbo (Base): cargas refrigeradas Creada y Confirmada; entre los libres
  hay uno General que la HU4.2 no deja confirmar junto a refrigerados.
- Santiago (Pudahuel): tres cargas de General y Frágil; la de 8.200 kg supera al camión
  chico IJKL-56 (4.000 kg), útil para ver la ocupación excedida.
- Antofagasta: una carga pesada de Peligrosa con General.
- Vicuña, Larrondo y Elqui: una carga o sólo pedidos libres.

También alinea el destino de las cargas del seed antiguo con el de sus pedidos
(la carga #3 decía Antofagasta y su pedido va a Coquimbo).

Revision ID: c7e2a9f4b1d3
Revises: b5c1e8d4f7a2
Create Date: 2026-09-30 18:00:00.000000

"""
from collections.abc import Sequence
from datetime import datetime, timedelta
from decimal import Decimal

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'c7e2a9f4b1d3'
down_revision: str | None = 'b5c1e8d4f7a2'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

# asyncpg exige el tipo real de las columnas enum; ya existen, no se recrean.
mercaderia_t = postgresql.ENUM(
    "GENERAL", "REFRIGERADA", "PELIGROSA", "FRAGIL", name="mercaderiatipo", create_type=False
)
pedido_estado_t = postgresql.ENUM(
    "CREADA", "TRANSITO", "ENTREGADO", "CANCELADO", name="pedidoestado", create_type=False
)
carga_estado_t = postgresql.ENUM(
    "CREADA", "CONFIRMADA", "EN_RUTA", "FINALIZADA", "CANCELADA", name="cargaestado", create_type=False
)

pedido = sa.table(
    "pedido",
    sa.column("id", sa.Integer),
    sa.column("id_cliente", sa.Integer),
    sa.column("id_centro", sa.Integer),
    sa.column("peso_kg", sa.Numeric),
    sa.column("volumen_m3", sa.Numeric),
    sa.column("ventana_inicio", sa.DateTime),
    sa.column("ventana_fin", sa.DateTime),
    sa.column("tipo_mercaderia", mercaderia_t),
    sa.column("estado", pedido_estado_t),
)
carga = sa.table(
    "carga",
    sa.column("id", sa.Integer),
    sa.column("id_centro", sa.Integer),
    sa.column("estado", carga_estado_t),
)
pedido_carga = sa.table(
    "pedido_carga",
    sa.column("id_carga", sa.Integer),
    sa.column("id_pedido", sa.Integer),
)

# Cargas del seed: etiqueta → estado. Los pedidos las referencian por etiqueta.
CARGAS = {
    "K1": "CREADA",
    "K2": "CONFIRMADA",
    "K3": "CREADA",
    "K4": "CREADA",
    "K5": "CONFIRMADA",
    "K6": "CREADA",
    "K7": "CREADA",
}

COQUIMBO = ("76.123.456-7", "Coquimbo (Base)")
SANTIAGO = ("78.555.666-1", "Santiago (Pudahuel)")
ANTOFAGASTA = ("77.987.654-3", "Antofagasta (La Negra)")
VICUNA = ("77.123.456-9", "Camino Las Parcelas 88, Vicuña")
LARRONDO = ("5.503.413-3", "Larrondo 1281, Coquimbo")
ELQUI = ("76.888.777-2", "Centro Logístico Elqui 100")

# (cliente y centro, kg, m³, inicio de la ventana, horas, tipo, carga o None si queda libre)
PEDIDOS = [
    (COQUIMBO, "3200", "14", "2026-10-06 08:00", 10, "REFRIGERADA", "K1"),
    (COQUIMBO, "2600", "11", "2026-10-06 09:00", 9, "REFRIGERADA", "K1"),
    (COQUIMBO, "4100", "18", "2026-10-07 08:00", 10, "REFRIGERADA", "K2"),
    (COQUIMBO, "1900", "8", "2026-10-07 09:00", 9, "REFRIGERADA", None),
    (COQUIMBO, "2200", "9", "2026-10-08 08:00", 9, "REFRIGERADA", None),
    (COQUIMBO, "1500", "9", "2026-10-07 10:00", 8, "GENERAL", None),
    (SANTIAGO, "6000", "28", "2026-10-08 07:00", 11, "GENERAL", "K3"),
    (SANTIAGO, "2200", "15", "2026-10-08 08:00", 10, "FRAGIL", "K3"),
    (SANTIAGO, "4800", "22", "2026-10-09 07:30", 10, "GENERAL", "K4"),
    (SANTIAGO, "5200", "24", "2026-10-09 08:00", 10, "GENERAL", "K5"),
    (SANTIAGO, "1300", "9", "2026-10-09 09:00", 8, "FRAGIL", None),
    (SANTIAGO, "3000", "16", "2026-10-10 08:00", 9, "GENERAL", None),
    (ANTOFAGASTA, "7000", "18", "2026-10-10 06:00", 12, "PELIGROSA", "K6"),
    (ANTOFAGASTA, "9000", "25", "2026-10-10 06:30", 12, "GENERAL", "K6"),
    (ANTOFAGASTA, "5500", "14", "2026-10-11 06:00", 12, "PELIGROSA", None),
    (ANTOFAGASTA, "8000", "30", "2026-10-11 07:00", 11, "GENERAL", None),
    (VICUNA, "2800", "12", "2026-10-06 07:00", 8, "REFRIGERADA", "K7"),
    (VICUNA, "3500", "15", "2026-10-06 07:30", 8, "REFRIGERADA", None),
    (VICUNA, "1600", "7", "2026-10-07 07:00", 8, "REFRIGERADA", None),
    (LARRONDO, "900", "5", "2026-10-13 09:00", 8, "GENERAL", None),
    (LARRONDO, "1100", "7", "2026-10-13 10:00", 7, "FRAGIL", None),
    (ELQUI, "3000", "13", "2026-10-12 08:00", 9, "REFRIGERADA", None),
    (ELQUI, "2400", "10", "2026-10-12 09:00", 8, "REFRIGERADA", None),
]


def _ids(conn) -> tuple[dict[str, int], dict[str, int]]:
    clientes = dict(conn.execute(sa.text("SELECT rut, id FROM cliente")).all())
    centros = dict(conn.execute(sa.text("SELECT direccion, id FROM centro_distribucion")).all())
    return clientes, centros


def upgrade() -> None:
    conn = op.get_bind()
    clientes, centros = _ids(conn)

    ids_carga: dict[str, int] = {}
    for (rut, direccion), kg, m3, inicio, horas, tipo, etiqueta in PEDIDOS:
        if rut not in clientes or direccion not in centros:
            continue  # base sin los clientes del seed de la E03
        desde = datetime.fromisoformat(inicio)
        id_pedido = conn.execute(
            sa.insert(pedido)
            .values(
                id_cliente=clientes[rut],
                id_centro=centros[direccion],
                peso_kg=Decimal(kg),
                volumen_m3=Decimal(m3),
                ventana_inicio=desde,
                ventana_fin=desde + timedelta(hours=horas),
                tipo_mercaderia=tipo,
                estado="CREADA",
            )
            .returning(pedido.c.id)
        ).scalar_one()

        if etiqueta is None:
            continue
        if etiqueta not in ids_carga:
            ids_carga[etiqueta] = conn.execute(
                sa.insert(carga)
                .values(id_centro=centros[direccion], estado=CARGAS[etiqueta])
                .returning(carga.c.id)
            ).scalar_one()
        conn.execute(sa.insert(pedido_carga).values(id_carga=ids_carga[etiqueta], id_pedido=id_pedido))

    # Cargas cuyos pedidos van todos a un mismo centro, distinto del que dice la carga.
    op.execute("""
        UPDATE carga c SET id_centro = d.id_centro
        FROM (
            SELECT pc.id_carga, min(p.id_centro) AS id_centro
            FROM pedido_carga pc JOIN pedido p ON p.id = pc.id_pedido
            GROUP BY pc.id_carga
            HAVING count(DISTINCT p.id_centro) = 1
        ) d
        WHERE d.id_carga = c.id AND c.id_centro <> d.id_centro
    """)


def downgrade() -> None:
    # Borra los pedidos del seed y las cargas que quedan sin pedidos; el destino
    # corregido de las cargas antiguas se mantiene.
    conn = op.get_bind()
    clientes, _ = _ids(conn)
    for (rut, _direccion), kg, _m3, inicio, _horas, _tipo, _etiqueta in PEDIDOS:
        if rut not in clientes:
            continue
        filtro = {"cli": clientes[rut], "kg": Decimal(kg), "inicio": datetime.fromisoformat(inicio)}
        del_pedido = "SELECT id FROM pedido WHERE id_cliente = :cli AND peso_kg = :kg AND ventana_inicio = :inicio"
        conn.execute(sa.text(f"DELETE FROM pedido_carga WHERE id_pedido IN ({del_pedido})"), filtro)
        conn.execute(sa.text(f"DELETE FROM pedido WHERE id IN ({del_pedido})"), filtro)
    conn.execute(sa.text("""
        DELETE FROM carga c
        WHERE NOT EXISTS (SELECT 1 FROM pedido_carga pc WHERE pc.id_carga = c.id)
          AND NOT EXISTS (SELECT 1 FROM viaje v WHERE v.id_carga = c.id)
    """))
