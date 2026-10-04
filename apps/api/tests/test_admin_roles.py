import asyncio
import unittest
from decimal import Decimal
from types import SimpleNamespace

from app.admin.service import AdministracionService, require_admin
from app.core.errors import DomainError
from app.dashboard.service import DashboardService, porcentaje_ocupacion


async def _async_value(value):
	return value


class PermisosAdministrativosTests(unittest.TestCase):
	def test_no_se_puede_eliminar_la_propia_cuenta(self) -> None:
		actor = SimpleNamespace(id=1, username="admin", rol="ADMINISTRADOR")
		repository = SimpleNamespace(obtener_usuario=lambda user_id: _async_value(actor))
		service = AdministracionService(None, repository)
		with self.assertRaises(DomainError):
			asyncio.run(service.eliminar_usuario(actor, 1))

	def test_no_se_puede_eliminar_al_ultimo_administrador_activo(self) -> None:
		actor = SimpleNamespace(id=1, username="admin", rol="ADMINISTRADOR")
		other_admin = SimpleNamespace(id=2, username="admin2", rol="ADMINISTRADOR", activo=True)
		repository = SimpleNamespace(
			obtener_usuario=lambda user_id: _async_value(other_admin),
			contar_administradores_activos=lambda: _async_value(1),
		)
		service = AdministracionService(None, repository)
		with self.assertRaises(DomainError):
			asyncio.run(service.eliminar_usuario(actor, 2))
	def test_solo_administrador_supera_el_control_de_rol(self) -> None:
		admin_info = SimpleNamespace(context=SimpleNamespace(
			usuario=SimpleNamespace(rol="ADMINISTRADOR")
		))
		planner_info = SimpleNamespace(context=SimpleNamespace(
			usuario=SimpleNamespace(rol="PLANIFICADOR")
		))

		require_admin(admin_info.context.usuario)
		with self.assertRaises(DomainError):
			require_admin(planner_info.context.usuario)

	def test_planificador_no_puede_consultar_dashboard(self) -> None:
		service = DashboardService(None, None)
		with self.assertRaises(DomainError):
			asyncio.run(service.resumen(SimpleNamespace(rol="PLANIFICADOR")))

	def test_ocupacion_usa_capacidad_de_flota_y_admite_flota_vacia(self) -> None:
		self.assertEqual(
			porcentaje_ocupacion(Decimal(250), Decimal(1000)), Decimal("25.0")
		)
		self.assertEqual(porcentaje_ocupacion(Decimal(25), Decimal(0)), Decimal(0))


if __name__ == "__main__":
	unittest.main()