from datetime import date

from app.models.camion import Documento, DocumentoTipo
from app.models.mantencion import Mantencion, MantencionEstado

DOCUMENTOS_OBLIGATORIOS = (
    DocumentoTipo.RT,
    DocumentoTipo.PC,
    DocumentoTipo.SOAP,
)


def restricciones_operativas(
    documentos: list[Documento],
    mantenciones: list[Mantencion],
    fecha_inicio: date,
    fecha_fin: date,
    activo: bool = True,
) -> list[str]:
    restricciones: list[str] = []
    if not activo:
        restricciones.append("El camión está desactivado")
    if fecha_fin < fecha_inicio:
        restricciones.append("El intervalo de operación no es válido")

    for tipo in DOCUMENTOS_OBLIGATORIOS:
        vigente_durante_operacion = any(
            documento.tipo == tipo
            and documento.fecha_emision.date() <= fecha_inicio
            and documento.fecha_vencimiento.date() >= fecha_fin
            for documento in documentos
        )
        if not vigente_durante_operacion:
            restricciones.append(
                f"Falta un documento {tipo.value} vigente durante la operación"
            )

    for mantencion in mantenciones:
        if mantencion_se_solapa(mantencion, fecha_inicio, fecha_fin):
            restricciones.append(
                f"Tiene una mantención {mantencion.estado.value.lower()} que se solapa"
            )

    return restricciones


def mantencion_se_solapa(
    mantencion: Mantencion,
    fecha_inicio: date,
    fecha_fin: date,
) -> bool:
    if mantencion.estado not in {
        MantencionEstado.PROGRAMADA,
        MantencionEstado.EN_CURSO,
    }:
        return False
    inicio_mantencion = mantencion.fecha_inicio.date()
    fin_mantencion = (
        mantencion.fecha_fin.date() if mantencion.fecha_fin is not None else None
    )
    return inicio_mantencion <= fecha_fin and (
        fin_mantencion is None or fin_mantencion >= fecha_inicio
    )
