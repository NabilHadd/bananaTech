from decimal import Decimal

_MAXIMO_DECIMAL_PEDIDO = Decimal("99999999.99")


def validar_dimensiones_pedido(peso_kg: Decimal, volumen_m3: Decimal) -> None:
    validar_dimensiones(peso_kg, volumen_m3, "pedido")


def validar_dimensiones(
    peso_kg: Decimal,
    volumen_m3: Decimal,
    entidad: str,
) -> None:
    """Valida dimensiones Numeric(10, 2) positivas."""
    for nombre, valor in (("peso", peso_kg), ("volumen", volumen_m3)):
        if not valor.is_finite() or valor <= 0:
            raise ValueError(f"El {nombre} del {entidad} debe ser mayor que cero")
        if valor > _MAXIMO_DECIMAL_PEDIDO:
            raise ValueError(f"El {nombre} del {entidad} supera el máximo permitido")
        if valor != valor.quantize(Decimal("0.01")):
            raise ValueError(
                f"El {nombre} del {entidad} admite como máximo 2 decimales"
            )
