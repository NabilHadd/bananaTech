import unittest
from datetime import UTC, datetime
from decimal import Decimal

from app.models.camion import Camion
from app.models.pedido import MercaderiaTipo, Pedido, PedidoEstado
from app.services.cargas import calcular_carga_para_camion
from app.services.pedidos import validar_dimensiones_pedido


class CalcularCargaParaCamionTests(unittest.TestCase):
    def setUp(self) -> None:
        self.camion = Camion(
            id=1,
            patente="TEST-01",
            id_tipo_camion=1,
            peso_kg=Decimal(1000),
            volumen_m3=Decimal(10),
        )

    def crear_pedido(
        self,
        id_pedido: int,
        peso_kg: str,
        volumen_m3: str,
        tipo: MercaderiaTipo,
        ventana_inicio: datetime,
    ) -> Pedido:
        return Pedido(
            id=id_pedido,
            id_cliente=id_pedido,
            peso_kg=Decimal(peso_kg),
            volumen_m3=Decimal(volumen_m3),
            ventana_inicio=ventana_inicio,
            ventana_fin=ventana_inicio.replace(hour=18),
            tipo_mercaderia=tipo,
            estado=PedidoEstado.EN_ESPERA,
        )

    def test_prioriza_ventana_cercana_y_respeta_capacidades(self) -> None:
        pedidos = [
            self.crear_pedido(
                1,
                "800",
                "8",
                MercaderiaTipo.GENERAL,
                datetime(2026, 10, 1, 8, tzinfo=UTC),
            ),
            self.crear_pedido(
                2,
                "500",
                "5",
                MercaderiaTipo.GENERAL,
                datetime(2026, 10, 2, 8, tzinfo=UTC),
            ),
        ]

        resultado = calcular_carga_para_camion(pedidos, self.camion)

        self.assertEqual([pedido.id for pedido in resultado.cargas[0].pedidos], [1])
        self.assertEqual(resultado.no_asignados[0].pedido.id, 2)
        self.assertEqual(resultado.cargas[0].peso_total_kg, Decimal(800))
        self.assertEqual(resultado.cargas[0].volumen_total_m3, Decimal(8))

    def test_permite_general_con_refrigerada_y_separa_peligrosa(self) -> None:
        inicio = datetime(2026, 10, 1, 8, tzinfo=UTC)
        pedidos = [
            self.crear_pedido(1, "400", "4", MercaderiaTipo.GENERAL, inicio),
            self.crear_pedido(2, "300", "3", MercaderiaTipo.REFRIGERADA, inicio),
            self.crear_pedido(3, "100", "1", MercaderiaTipo.PELIGROSA, inicio),
        ]

        resultado = calcular_carga_para_camion(pedidos, self.camion)

        self.assertEqual([pedido.id for pedido in resultado.cargas[0].pedidos], [1, 2])
        self.assertEqual(resultado.no_asignados[0].pedido.id, 3)
        self.assertIn("compatible", resultado.no_asignados[0].motivo)


class ValidarDimensionesPedidoTests(unittest.TestCase):
    def test_rechaza_peso_o_volumen_no_positivo(self) -> None:
        with self.assertRaisesRegex(ValueError, "peso.*mayor que cero"):
            validar_dimensiones_pedido(Decimal(0), Decimal(1))
        with self.assertRaisesRegex(ValueError, "volumen.*mayor que cero"):
            validar_dimensiones_pedido(Decimal(1), Decimal(-1))

    def test_rechaza_precision_y_magnitud_fuera_del_modelo(self) -> None:
        with self.assertRaisesRegex(ValueError, "2 decimales"):
            validar_dimensiones_pedido(Decimal("1.001"), Decimal(1))
        with self.assertRaisesRegex(ValueError, "máximo permitido"):
            validar_dimensiones_pedido(Decimal(100000000), Decimal(1))


if __name__ == "__main__":
    unittest.main()
