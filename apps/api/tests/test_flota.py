import unittest
from datetime import UTC, date, datetime

from app.models.camion import Documento, DocumentoTipo
from app.models.mantencion import Mantencion, MantencionEstado, MantencionTipo
from app.services.flota import restricciones_operativas


class RestriccionesOperativasTests(unittest.TestCase):
    def setUp(self) -> None:
        self.documentos = [
            Documento(
                id_camion=1,
                tipo=tipo,
                fecha_emision=datetime(2026, 1, 1, tzinfo=UTC),
                fecha_vencimiento=datetime(2027, 12, 31, tzinfo=UTC),
            )
            for tipo in (
                DocumentoTipo.RT,
                DocumentoTipo.PC,
                DocumentoTipo.SOAP,
            )
        ]
        self.inicio = date(2026, 10, 1)
        self.fin = date(2026, 10, 3)

    def test_documentacion_obligatoria_vigente_habilita_camion(self) -> None:
        self.assertEqual(
            restricciones_operativas(self.documentos, [], self.inicio, self.fin),
            [],
        )

    def test_documento_que_vence_durante_operacion_bloquea_camion(self) -> None:
        self.documentos[0].fecha_vencimiento = datetime(2026, 10, 2, tzinfo=UTC)

        restricciones = restricciones_operativas(
            self.documentos,
            [],
            self.inicio,
            self.fin,
        )

        self.assertTrue(any("RT" in restriccion for restriccion in restricciones))

    def test_mantencion_solapada_bloquea_y_mantencion_cancelada_no(self) -> None:
        mantencion = Mantencion(
            id_camion=1,
            tipo=MantencionTipo.CORRECTIVA,
            descripcion="Reparación de frenos",
            fecha_inicio=datetime(2026, 10, 2, tzinfo=UTC),
            estado=MantencionEstado.PROGRAMADA,
        )

        restricciones = restricciones_operativas(
            self.documentos,
            [mantencion],
            self.inicio,
            self.fin,
        )
        self.assertTrue(any("mantención" in item for item in restricciones))

        mantencion.estado = MantencionEstado.CANCELADA
        self.assertEqual(
            restricciones_operativas(
                self.documentos,
                [mantencion],
                self.inicio,
                self.fin,
            ),
            [],
        )

    def test_camion_desactivado_no_es_operativo(self) -> None:
        restricciones = restricciones_operativas(
            self.documentos,
            [],
            self.inicio,
            self.fin,
            activo=False,
        )

        self.assertIn("El camión está desactivado", restricciones)


if __name__ == "__main__":
    unittest.main()
