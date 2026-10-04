from dataclasses import dataclass
from decimal import ROUND_HALF_UP, Decimal

PESO_CLP = Decimal(1)
PRECISION_PORCENTAJE = Decimal("0.01")


def _pesos(valor: Decimal) -> Decimal:
	return valor.quantize(PESO_CLP, rounding=ROUND_HALF_UP)


@dataclass(frozen=True)
class CostosEstimados:
	costo_diesel_clp: Decimal
	costo_peajes_clp: Decimal
	costo_operacion_clp: Decimal
	costo_viatico_clp: Decimal = Decimal(0)


def estimar_costos(
	distancia_km: Decimal,
	rendimiento_km_l: Decimal,
	precio_diesel_clp_litro: Decimal,
	tarifa_peajes_clp_km: Decimal,
	costo_operacion_clp_km: Decimal,
	viatico_diario_clp: Decimal = Decimal(0),
	dias_viaje: int = 1,
) -> CostosEstimados:
	if rendimiento_km_l <= 0:
		raise ValueError("El rendimiento del camión debe ser mayor que cero.")
	litros_estimados = distancia_km / rendimiento_km_l
	return CostosEstimados(
		costo_diesel_clp=_pesos(litros_estimados * precio_diesel_clp_litro),
		costo_peajes_clp=_pesos(distancia_km * tarifa_peajes_clp_km),
		costo_operacion_clp=_pesos(distancia_km * costo_operacion_clp_km),
		costo_viatico_clp=_pesos(viatico_diario_clp * max(dias_viaje, 1)),
	)


def calcular_ingreso(
	peso_total_kg: Decimal,
	distancia_km: Decimal,
	tarifa_venta_clp_ton_km: Decimal,
) -> Decimal:
	toneladas = peso_total_kg / Decimal(1000)
	return _pesos(toneladas * distancia_km * tarifa_venta_clp_ton_km)


def calcular_margen(
	ingreso_clp: Decimal,
	costos: CostosEstimados,
) -> tuple[Decimal, Decimal]:
	costo_total = (
		costos.costo_diesel_clp
		+ costos.costo_peajes_clp
		+ costos.costo_operacion_clp
		+ costos.costo_viatico_clp
	)
	margen = _pesos(ingreso_clp - costo_total)
	porcentaje = (
		(margen / ingreso_clp * Decimal(100)).quantize(
			PRECISION_PORCENTAJE, rounding=ROUND_HALF_UP
		)
		if ingreso_clp
		else Decimal(0)
	)
	return margen, porcentaje