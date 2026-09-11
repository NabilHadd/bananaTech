from app.farms.models import Farm

# Datos en memoria. Al conectar SQLAlchemy solo cambia este archivo.
_SEED: dict[str, Farm] = {
    "1": Farm(id="1", name="Finca El Valle", country="Ecuador"),
    "2": Farm(id="2", name="Hacienda Norte", country="Colombia"),
}


class FarmRepository:
    """Única capa que toca el almacenamiento."""

    async def list_all(self) -> list[Farm]:
        return list(_SEED.values())

    async def get(self, farm_id: str) -> Farm | None:
        return _SEED.get(farm_id)
