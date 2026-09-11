from dataclasses import dataclass


@dataclass(slots=True)
class Banana:
    id: str
    name: str
    ripeness: int
    farm_id: str
