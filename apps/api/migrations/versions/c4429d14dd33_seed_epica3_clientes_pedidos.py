"""seed_epica3_clientes_pedidos

Revision ID: c4429d14dd33
Revises: 7924965435fc
Create Date: 2026-09-30 01:35:17.113886

"""
from collections.abc import Sequence
from datetime import datetime

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'c4429d14dd33'
down_revision: str | None = '7924965435fc'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    conn = op.get_bind()

    # 1. Insertar nuevos Clientes (si no existen por RUT)
    nuevos_clientes = [
        ('Frutas del Valle SpA', '77.123.456-9', 'Camino Las Parcelas 88, Vicuña', 'contacto@frutasvalle.cl', '+56 9 7777 6666'),
        ('Universidad Católica del Norte', '5.503.413-3', 'Larrondo 1281, Coquimbo', 'ucn@ucn.cl', '+56912345678'),
        ('Frutícola Elqui S.A.', '76.888.777-2', 'Av. Central 999, Vicuña', 'fruticola@elqui.cl', '+56999112233')
    ]
    for razon, rut, direccion, mail, telefono in nuevos_clientes:
        res = conn.execute(sa.text("SELECT id FROM cliente WHERE rut = :rut"), {"rut": rut}).first()
        if not res:
            conn.execute(
                sa.text("""
                    INSERT INTO cliente (razon, rut, direccion, mail, telefono)
                    VALUES (:razon, :rut, :direccion, :mail, :telefono)
                """),
                {"razon": razon, "rut": rut, "direccion": direccion, "mail": mail, "telefono": telefono}
            )

    # 2. Insertar nuevos Centros de Distribución (si no existen por dirección)
    nuevos_centros = [
        ('Camino Las Parcelas 88, Vicuña', 65.5, 50),
        ('Larrondo 1281, Coquimbo', 10.0, 40),
        ('Centro Logístico Elqui 100', 18.5, 25)
    ]
    for direccion, dist_km, dist_min in nuevos_centros:
        res = conn.execute(sa.text("SELECT id FROM centro_distribucion WHERE direccion = :dir"), {"dir": direccion}).first()
        if not res:
            conn.execute(
                sa.text("""
                    INSERT INTO centro_distribucion (direccion, distancia_km, distancia_min)
                    VALUES (:dir, :km, :min)
                """),
                {"dir": direccion, "km": dist_km, "min": dist_min}
            )

    # 3. Vincular Clientes con Centros de Distribución (N:N)
    vinculos = [
        ('77.123.456-9', 'Camino Las Parcelas 88, Vicuña'),
        ('5.503.413-3', 'Larrondo 1281, Coquimbo'),
        ('76.888.777-2', 'Centro Logístico Elqui 100')
    ]
    for rut, dir_centro in vinculos:
        cli = conn.execute(sa.text("SELECT id FROM cliente WHERE rut = :rut"), {"rut": rut}).first()
        cen = conn.execute(sa.text("SELECT id FROM centro_distribucion WHERE direccion = :dir"), {"dir": dir_centro}).first()
        if cli and cen:
            res = conn.execute(
                sa.text("SELECT 1 FROM cliente_centro WHERE id_cliente = :cli AND id_centro = :cen"),
                {"cli": cli[0], "cen": cen[0]}
            ).first()
            if not res:
                conn.execute(
                    sa.text("INSERT INTO cliente_centro (id_cliente, id_centro, estado) VALUES (:cli, :cen, true)"),
                    {"cli": cli[0], "cen": cen[0]}
                )

    # 4. Asegurar pedidos de prueba representativos para cada estado de la HU3.3 y HU3.4
    # Actualizar o insertar pedidos para los clientes
    pedidos_seed = [
        ('78.555.666-1', 'Santiago (Pudahuel)', 15000.0, 50.0, '2026-09-20 08:00:00', '2026-09-20 18:00:00', 'GENERAL', 'ENTREGADO', '2026-09-20 16:30:00', 'Juan Pérez', 'Recibido conforme en bodega 3'),
        ('77.987.654-3', 'Antofagasta (La Negra)', 25000.0, 15.0, '2026-09-21 08:00:00', '2026-09-22 18:00:00', 'GENERAL', 'CANCELADO', None, None, None),
        ('77.987.654-3', 'Antofagasta (La Negra)', 10000.0, 30.0, '2026-09-23 08:00:00', '2026-09-24 18:00:00', 'PELIGROSA', 'EN_ESPERA', None, None, None),
        ('76.123.456-7', 'Coquimbo (Base)', 8000.0, 20.0, '2026-09-23 08:00:00', '2026-09-24 18:00:00', 'REFRIGERADA', 'TRANSITO', None, None, None),
        ('76.123.456-7', 'Coquimbo (Base)', 1200.0, 4.5, '2026-10-01 10:00:00', '2026-10-01 18:00:00', 'REFRIGERADA', 'EN_ESPERA', None, None, None),
        ('78.555.666-1', 'Santiago (Pudahuel)', 2500.0, 12.0, '2026-10-20 18:26:00', '2026-10-21 00:00:00', 'GENERAL', 'EN_ESPERA', None, None, None),
        ('77.123.456-9', 'Camino Las Parcelas 88, Vicuña', 1500.0, 8.5, '2026-10-05 09:00:00', '2026-10-05 18:00:00', 'REFRIGERADA', 'EN_ESPERA', None, None, None),
        ('76.888.777-2', 'Centro Logístico Elqui 100', 1800.0, 6.0, '2026-10-12 08:30:00', '2026-10-12 17:00:00', 'PELIGROSA', 'EN_ESPERA', None, None, None)
    ]

    for rut, dir_centro, peso, vol, inicio_str, fin_str, tipo, estado, f_ent_str, receptor, obs in pedidos_seed:
        cli = conn.execute(sa.text("SELECT id FROM cliente WHERE rut = :rut"), {"rut": rut}).first()
        cen = conn.execute(sa.text("SELECT id FROM centro_distribucion WHERE direccion = :dir"), {"dir": dir_centro}).first()
        if cli and cen:
            inicio_dt = datetime.fromisoformat(inicio_str)
            fin_dt = datetime.fromisoformat(fin_str)
            f_ent_dt = datetime.fromisoformat(f_ent_str) if f_ent_str else None

            # Buscar si ya existe un pedido idéntico para no duplicar
            res = conn.execute(
                sa.text("""
                    SELECT id FROM pedido
                    WHERE id_cliente = :cli AND id_centro = :cen AND peso_kg = :peso AND ventana_inicio = :inicio
                """),
                {"cli": cli[0], "cen": cen[0], "peso": peso, "inicio": inicio_dt}
            ).first()
            if not res:
                conn.execute(
                    sa.text("""
                        INSERT INTO pedido (id_cliente, id_centro, peso_kg, volumen_m3, ventana_inicio, ventana_fin, tipo_mercaderia, estado, fecha_entrega, receptor, observaciones)
                        VALUES (:cli, :cen, :peso, :vol, :inicio, :fin, :tipo, :estado, :f_ent, :receptor, :obs)
                    """),
                    {
                        "cli": cli[0], "cen": cen[0], "peso": peso, "vol": vol,
                        "inicio": inicio_dt, "fin": fin_dt, "tipo": tipo, "estado": estado,
                        "f_ent": f_ent_dt, "receptor": receptor, "obs": obs
                    }
                )


def downgrade() -> None:
    pass
