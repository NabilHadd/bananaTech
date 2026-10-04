"""seed_flota_e01

Datos para demostrar la Épica 1: completa la documentación de la flota mock
(para que haya camiones DISPONIBLE, uno BLOQUEADO y uno INACTIVO) y agrega
viajes para el historial de la HU1.3.

Revision ID: b7e4a1c9d2f3
Revises: 687c5988c3bc
Create Date: 2026-09-28 00:50:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'b7e4a1c9d2f3'
down_revision: str | None = '687c5988c3bc'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    conn = op.get_bind()

    # 1. Documentos faltantes. Los tipos van como literales en el SQL, así que
    #    Postgres los convierte solo al enum documentotipo (ver asyncpg + enums).
    #    ABCD-12 e IJKL-56 quedan DISPONIBLE; EFGH-34 sigue BLOQUEADO por su RT vencida.
    conn.execute(sa.text("""
        INSERT INTO documento (id_camion, tipo, fecha_emision, fecha_vencimiento)
        SELECT c.id, d.tipo::documentotipo, d.emision::timestamp, d.vencimiento::timestamp
        FROM (VALUES
            ('ABCD-12', 'SOAP', '2026-03-01', '2027-03-31'),
            ('EFGH-34', 'SOAP', '2026-03-01', '2027-03-31'),
            ('IJKL-56', 'PC',   '2026-03-01', '2027-03-31'),
            ('IJKL-56', 'SOAP', '2026-03-01', '2027-03-31')
        ) AS d(patente, tipo, emision, vencimiento)
        JOIN camion c ON c.patente = d.patente
    """))

    # 2. Un camión dado de baja, para el estado INACTIVO.
    conn.execute(sa.text("""
        INSERT INTO camion (patente, marca, modelo, anio, id_tipo_camion, peso_kg, volumen_m3,
                            rendimiento_base_km_l, kilometraje_actual, activo)
        SELECT 'MNOP-78', 'Volvo', 'FMX 460', 2018, id, 24000, 85, 2.60, 398200, false
        FROM tipo_camion WHERE tipo = 'Rampla plana'
    """))
    conn.execute(sa.text("""
        INSERT INTO documento (id_camion, tipo, fecha_emision, fecha_vencimiento)
        SELECT c.id, d.tipo::documentotipo, d.emision::timestamp, d.vencimiento::timestamp
        FROM (VALUES
            ('RT',   '2025-01-01', '2026-01-01'),
            ('PC',   '2025-03-01', '2026-03-31'),
            ('SOAP', '2025-03-01', '2026-03-31')
        ) AS d(tipo, emision, vencimiento)
        CROSS JOIN camion c WHERE c.patente = 'MNOP-78'
    """))

    # 3. Viajes finalizados sobre las cargas del seed mock. Cada carga se
    #    identifica por el peso de su pedido (15.000 kg a Santiago, 25.000 kg a Antofagasta).
    conn.execute(sa.text("""
        INSERT INTO viaje (id_conductor, id_camion, id_carga, fecha_inicio, fecha_fin)
        SELECT co.id, ca.id, pc.id_carga, v.inicio::timestamp, v.fin::timestamp
        FROM (VALUES
            ('ABCD-12', 'Juan',   15000, '2026-09-10 07:30', '2026-09-10 13:45'),
            ('EFGH-34', 'Carlos', 25000, '2026-05-28 05:30', '2026-05-28 19:00')
        ) AS v(patente, conductor, peso_pedido, inicio, fin)
        JOIN camion ca ON ca.patente = v.patente
        JOIN conductor co ON co.nombres = v.conductor
        JOIN pedido p ON p.peso_kg = v.peso_pedido
        JOIN pedido_carga pc ON pc.id_pedido = p.id
    """))


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text("""
        DELETE FROM viaje
        WHERE fecha_inicio IN ('2026-09-10 07:30', '2026-05-28 05:30')
          AND id_camion IN (SELECT id FROM camion WHERE patente IN ('ABCD-12', 'EFGH-34'))
    """))
    conn.execute(sa.text("""
        DELETE FROM documento WHERE id_camion IN (SELECT id FROM camion WHERE patente = 'MNOP-78')
    """))
    conn.execute(sa.text("DELETE FROM camion WHERE patente = 'MNOP-78'"))
    conn.execute(sa.text("""
        DELETE FROM documento d USING camion c
        WHERE d.id_camion = c.id
          AND (c.patente, d.tipo::text) IN (('ABCD-12', 'SOAP'), ('EFGH-34', 'SOAP'),
                                            ('IJKL-56', 'PC'), ('IJKL-56', 'SOAP'))
    """))
