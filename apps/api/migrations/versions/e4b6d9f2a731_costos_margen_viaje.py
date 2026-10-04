"""costos y margen del viaje

Revision ID: e4b6d9f2a731
Revises: d1a8c5e7f3b2
Create Date: 2026-10-03 00:00:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "e4b6d9f2a731"
down_revision: str | None = "d1a8c5e7f3b2"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
	for name, precision, scale in (
		("precio_diesel_clp_litro", 10, 2),
		("tarifa_peajes_clp_km", 10, 4),
		("costo_operacion_clp_km", 10, 4),
		("tarifa_venta_clp_ton_km", 10, 4),
		("costo_diesel_clp", 14, 2),
		("costo_peajes_clp", 14, 2),
		("costo_operacion_clp", 14, 2),
		("ingreso_total_clp", 14, 2),
		("margen_clp", 14, 2),
		("margen_porcentaje", 8, 2),
	):
		op.add_column("viaje", sa.Column(name, sa.Numeric(precision, scale), nullable=True))


def downgrade() -> None:
	for name in (
		"margen_porcentaje",
		"margen_clp",
		"ingreso_total_clp",
		"costo_operacion_clp",
		"costo_peajes_clp",
		"costo_diesel_clp",
		"tarifa_venta_clp_ton_km",
		"costo_operacion_clp_km",
		"tarifa_peajes_clp_km",
		"precio_diesel_clp_litro",
	):
		op.drop_column("viaje", name)