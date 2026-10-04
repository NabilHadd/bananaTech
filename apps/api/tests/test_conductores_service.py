from datetime import date
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.conductores.service import ConductoresService, DatosConductor, DatosLicencia
from app.core.errors import DomainError
from app.core.telefono import normalizar_telefono
from app.models import LicenciaClase

@pytest.mark.parametrize(
    "entrada",
    [
        "912345678",
        "9 1234 5678",
        "9-1234-5678",
        "+56912345678",
        "56912345678",
        "+56 9 1234 5678",
        "+569 1234 5678",
    ]
)

def test_normaliza_telefono_valido(entrada):
  assert normalizar_telefono(entrada) == "+569 1234 5678"


@pytest.mark.parametrize(
  "entrada",
  [
        "51 222 3333",
        "+56 2 2222 2222",
        "12345678",          # le falta un dígito
        "9123456789",        # le sobra uno
        "",
  ]
)

def test_rechaza_telefono_invalido(entrada):
  with pytest.raises(DomainError, match="no es válido"): 
    normalizar_telefono(entrada)



async def test_registrar_rechaza_rut_duplicado():
  conductores = MagicMock()
  conductores.existe_rut = AsyncMock(return_value = True)
  session = MagicMock()
  session.commit = AsyncMock()
  service = ConductoresService(session, conductores, MagicMock(), MagicMock())

  datos = DatosConductor("12.345.678-5", "Juan", "Pérez", "912345678", "juan@mail.cl")
  licencia = DatosLicencia([LicenciaClase.A5], date(2025, 1, 1), date(2030, 1, 1))

  with pytest.raises(DomainError, match="ya está registrado"):
    await service.registrar(datos, licencia)

  session.commit.assert_not_awaited()
  conductores.existe_rut.assert_awaited_once_with("12.345.678-5")


async def test_registrar_rechaza_rut_invalido():
  session = MagicMock()
  session.commit = AsyncMock()
  service = ConductoresService(session, MagicMock(), MagicMock(), MagicMock())

  datos = DatosConductor("12.345.678-4", "Juan", "Pérez", "912341234", "pérez@mail.com")
  licencia = DatosLicencia([LicenciaClase.A5], date(2025, 1, 1), date(2030, 1, 1))

  with pytest.raises(DomainError, match="dígito verificador"):
    await service.registrar(datos, licencia)

  session.commit.assert_not_awaited()

