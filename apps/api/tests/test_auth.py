import unittest

from fastapi import HTTPException

from app.core.auth import _token_user_id, create_token, hash_password, verify_password
from app.models.seguridad import Usuario


class AutenticacionTests(unittest.TestCase):
	def test_hash_de_contrasena_y_token_firmado(self) -> None:
		usuario = Usuario(id=17, username="planificador", password_hash="", rol="PLANIFICADOR")
		usuario.password_hash = hash_password("una-clave-segura-123")
		token = create_token(usuario)

		self.assertTrue(verify_password("una-clave-segura-123", usuario.password_hash))
		self.assertFalse(verify_password("otra-clave", usuario.password_hash))
		self.assertEqual(_token_user_id(token), 17)
		with self.assertRaises(HTTPException):
			_token_user_id(f"{token}x")


if __name__ == "__main__":
	unittest.main()