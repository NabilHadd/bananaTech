"""seed_datos_mock

Revision ID: 39ccd34b8fc7
Revises: 5d54c50ca37d
Create Date: 2026-09-19 23:34:55.961521

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = '39ccd34b8fc7'
down_revision: str | None = '5d54c50ca37d'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    conn = op.get_bind()
    
    # 1. Tipos de Camión
    res = conn.execute(sa.text("""
        INSERT INTO tipo_camion (tipo) VALUES 
        ('3/4'), ('Semirremolque'), ('Rampla plana') 
        RETURNING id, tipo
    """))
    tipos = {row[1]: row[0] for row in res.fetchall()}
    
    # 2. Clases de Licencia
    res = conn.execute(sa.text("SELECT id, clase::text FROM clase_licencia"))
    clases = {row[1]: row[0] for row in res.fetchall()}
    
    # Clase-Tipo Camión (A4 y A5 para pesados, B para 3/4)
    conn.execute(sa.text(f"""
        INSERT INTO clase_licencia_tipo_camion (id_clase, id_tipo_camion) VALUES
        ({clases['A4']}, {tipos['Semirremolque']}),
        ({clases['A5']}, {tipos['Semirremolque']}),
        ({clases['A4']}, {tipos['Rampla plana']}),
        ({clases['A5']}, {tipos['Rampla plana']}),
        ({clases['B']}, {tipos['3/4']})
    """))
    
    # 3. Centros de Distribución
    res = conn.execute(sa.text("""
        INSERT INTO centro_distribucion (direccion, distancia_km, distancia_min) VALUES 
        ('Coquimbo (Base)', 0.0, 0),
        ('Santiago (Pudahuel)', 460.5, 300),
        ('Antofagasta (La Negra)', 890.0, 720)
        RETURNING id, direccion
    """))
    centros = {row[1]: row[0] for row in res.fetchall()}
    
    # 4. Clientes
    res = conn.execute(sa.text("""
        INSERT INTO cliente (razon, rut, direccion, mail, telefono) VALUES 
        ('AgroNorte S.A.', '76.123.456-7', 'Parcela 15, Valle del Elqui', 'logistica@agronorte.cl', '+56911112222'),
        ('Minería San José', '77.987.654-3', 'Ruta 5 Norte Km 750', 'despachos@msanjose.cl', '+56933334444'),
        ('Retail Express', '78.555.666-1', 'Av. Apoquindo 1234, Santiago', 'cd@retailexpress.cl', '+56955556666')
        RETURNING id, razon
    """))
    clientes = {row[1]: row[0] for row in res.fetchall()}
    
    # Cliente-Centro
    conn.execute(sa.text(f"""
        INSERT INTO cliente_centro (id_cliente, id_centro, estado) VALUES
        ({clientes['AgroNorte S.A.']}, {centros['Coquimbo (Base)']}, true),
        ({clientes['Retail Express']}, {centros['Santiago (Pudahuel)']}, true),
        ({clientes['Minería San José']}, {centros['Antofagasta (La Negra)']}, true)
    """))
    
    # 5. Conductores
    res = conn.execute(sa.text("""
        INSERT INTO conductor (rut, nombres, apellidos, telefono, email) VALUES 
        ('15.111.222-3', 'Juan', 'Pérez', '+56988887777', 'jperez@tnc.cl'),
        ('16.333.444-5', 'Carlos', 'Gómez', '+56999998888', 'cgomez@tnc.cl'),
        ('17.555.666-7', 'Luis', 'Silva', '+56977776666', 'lsilva@tnc.cl')
        RETURNING id, nombres
    """))
    conductores = {row[1]: row[0] for row in res.fetchall()}
    
    # Licencias
    res = conn.execute(sa.text(f"""
        INSERT INTO licencia (id_conductor, fecha_emision, fecha_vencimiento) VALUES 
        ({conductores['Juan']}, '2024-01-15', '2028-01-15'),  -- Juan: Al día
        ({conductores['Carlos']}, '2021-05-10', '2023-05-10'), -- Carlos: Vencida!
        ({conductores['Luis']}, '2023-08-20', '2027-08-20')   -- Luis: Al día
        RETURNING id, id_conductor
    """))
    licencias = {row[1]: row[0] for row in res.fetchall()}
    
    # Licencia-Clase (Juan: A5, Carlos: A4, Luis: B)
    conn.execute(sa.text(f"""
        INSERT INTO licencia_clase (id_licencia, id_clase) VALUES
        ({licencias[conductores['Juan']]}, {clases['A5']}),
        ({licencias[conductores['Carlos']]}, {clases['A4']}),
        ({licencias[conductores['Luis']]}, {clases['B']})
    """))
    
    # 6. Camiones
    res = conn.execute(sa.text(f"""
        INSERT INTO camion (patente, id_tipo_camion, peso_kg, volumen_m3) VALUES 
        ('ABCD-12', {tipos['Rampla plana']}, 25000.0, 90.0),
        ('EFGH-34', {tipos['Semirremolque']}, 28000.0, 110.0),
        ('IJKL-56', {tipos['3/4']}, 4000.0, 20.0)
        RETURNING id, patente
    """))
    camiones = {row[1]: row[0] for row in res.fetchall()}
    
    # Documentos
    conn.execute(sa.text(f"""
        INSERT INTO documento (id_camion, tipo, fecha_emision, fecha_vencimiento) VALUES
        ({camiones['ABCD-12']}, 'RT', '2026-01-01', '2027-01-01'),
        ({camiones['ABCD-12']}, 'PC', '2026-03-01', '2027-03-31'),
        ({camiones['EFGH-34']}, 'RT', '2024-06-01', '2025-06-01'), -- RT Vencida
        ({camiones['EFGH-34']}, 'PC', '2026-03-01', '2027-03-31'),
        ({camiones['IJKL-56']}, 'RT', '2026-01-01', '2027-01-01')
    """))
    
    # 7. Pedidos y Cargas
    res = conn.execute(sa.text(f"""
        INSERT INTO pedido (id_cliente, peso_kg, volumen_m3, ventana_inicio, ventana_fin, tipo_mercaderia, estado) VALUES 
        ({clientes['Retail Express']}, 15000.0, 50.0, '2026-09-20 08:00:00', '2026-09-20 18:00:00', 'GENERAL', 'EN_ESPERA'),
        ({clientes['Minería San José']}, 25000.0, 15.0, '2026-09-21 08:00:00', '2026-09-22 18:00:00', 'GENERAL', 'EN_ESPERA'),
        ({clientes['Minería San José']}, 10000.0, 30.0, '2026-09-23 08:00:00', '2026-09-24 18:00:00', 'PELIGROSA', 'EN_ESPERA'),
        ({clientes['AgroNorte S.A.']}, 8000.0, 20.0, '2026-09-23 08:00:00', '2026-09-24 18:00:00', 'REFRIGERADA', 'EN_ESPERA')
        RETURNING id, peso_kg
    """))
    pedidos = {row[1]: row[0] for row in res.fetchall()}
    p_15k = pedidos[15000.0]
    p_25k = pedidos[25000.0]
    p_10k = pedidos[10000.0]
    p_8k = pedidos[8000.0]
    
    res = conn.execute(sa.text(f"""
        INSERT INTO carga (id_centro, estado) VALUES 
        ({centros['Santiago (Pudahuel)']}, 'CREADO'),
        ({centros['Antofagasta (La Negra)']}, 'CREADO'),
        ({centros['Antofagasta (La Negra)']}, 'CREADO')
        RETURNING id
    """))
    cargas = [row[0] for row in res.fetchall()]
    
    conn.execute(sa.text(f"""
        INSERT INTO pedido_carga (id_carga, id_pedido) VALUES 
        ({cargas[0]}, {p_15k}),
        ({cargas[1]}, {p_25k}),
        ({cargas[2]}, {p_10k}),
        ({cargas[2]}, {p_8k})
    """))


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text("DELETE FROM pedido_carga"))
    conn.execute(sa.text("DELETE FROM carga"))
    conn.execute(sa.text("DELETE FROM pedido"))
    conn.execute(sa.text("DELETE FROM documento"))
    conn.execute(sa.text("DELETE FROM camion"))
    conn.execute(sa.text("DELETE FROM licencia_clase"))
    conn.execute(sa.text("DELETE FROM licencia"))
    conn.execute(sa.text("DELETE FROM conductor"))
    conn.execute(sa.text("DELETE FROM cliente_centro"))
    conn.execute(sa.text("DELETE FROM cliente"))
    conn.execute(sa.text("DELETE FROM centro_distribucion"))
    conn.execute(sa.text("DELETE FROM clase_licencia_tipo_camion"))
    conn.execute(sa.text("DELETE FROM tipo_camion"))
