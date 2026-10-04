import unittest
from decimal import Decimal

from app.viajes.economia import calcular_ingreso, calcular_margen, estimar_costos


class EconomiaViajeTests(unittest.TestCase):
	def test_calcula_ingreso_costos_y_margen_en_clp(self) -> None:
		costos = estimar_costos(
			Decimal(400),
			Decimal(3),
			Decimal(1300),
			Decimal(50),
			Decimal(300),
		)
		ingreso = calcular_ingreso(
			Decimal(4000), Decimal(400), Decimal(250)
		)
		margen, porcentaje = calcular_margen(ingreso, costos)

		self.assertEqual(costos.costo_diesel_clp, Decimal(173333))
		self.assertEqual(costos.costo_peajes_clp, Decimal(20000))
		self.assertEqual(costos.costo_operacion_clp, Decimal(120000))
		self.assertEqual(ingreso, Decimal(400000))
		self.assertEqual(margen, Decimal(86667))
		self.assertEqual(porcentaje, Decimal("21.67"))


if __name__ == "__main__":
	unittest.main()