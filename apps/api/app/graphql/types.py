from datetime import UTC, date, datetime
from decimal import Decimal

import strawberry

from app.models.camion import (
    Camion,
    CamionEstadoOperativo,
    Documento,
    DocumentoTipo,
    TipoCamion,
)
from app.models.cliente import CentroDistribucion, Cliente
from app.models.conductor import (
    Conductor,
    Licencia,
    LicenciaClase,
)
from app.models.mantencion import Mantencion, MantencionEstado, MantencionTipo
from app.models.pedido import (
    Carga,
    CargaEstado,
    MercaderiaTipo,
    Pedido,
    PedidoEstado,
)
from app.models.viaje import Viaje, ViajeEstado
from app.services.cargas import DistribucionCargas

MercaderiaTipoGQL = strawberry.enum(MercaderiaTipo, name="MercaderiaTipo")
PedidoEstadoGQL = strawberry.enum(PedidoEstado, name="PedidoEstado")
CargaEstadoGQL = strawberry.enum(CargaEstado, name="CargaEstado")
DocumentoTipoGQL = strawberry.enum(DocumentoTipo, name="DocumentoTipo")
MantencionEstadoGQL = strawberry.enum(MantencionEstado, name="MantencionEstado")
MantencionTipoGQL = strawberry.enum(MantencionTipo, name="MantencionTipo")
LicenciaClaseGQL = strawberry.enum(LicenciaClase, name="LicenciaClase")
ViajeEstadoGQL = strawberry.enum(ViajeEstado, name="ViajeEstado")
CamionEstadoOperativoGQL = strawberry.enum(
    CamionEstadoOperativo,
    name="CamionEstadoOperativo",
)


@strawberry.type
class ClienteGQL:
    """Representa un cliente del sistema."""

    id: int
    razon: str
    rut: str
    direccion: str | None
    mail: str | None
    telefono: str | None

    @classmethod
    def from_model(cls, cliente: Cliente) -> "ClienteGQL":
        return cls(
            id=cliente.id,
            razon=cliente.razon,
            rut=cliente.rut,
            direccion=cliente.direccion,
            mail=cliente.mail,
            telefono=cliente.telefono,
        )


@strawberry.type
class CentroDistribucionGQL:
    id: int
    direccion: str
    distancia_km: Decimal
    distancia_min: int

    @classmethod
    def from_model(cls, centro: CentroDistribucion) -> "CentroDistribucionGQL":
        return cls(
            id=centro.id,
            direccion=centro.direccion,
            distancia_km=centro.distancia_km,
            distancia_min=centro.distancia_min,
        )


@strawberry.type
class PedidoGQL:
    """Representa un pedido que puede ir dentro de una carga."""

    id: int
    id_cliente: int
    peso_kg: Decimal
    volumen_m3: Decimal
    ventana_inicio: datetime
    ventana_fin: datetime
    tipo_mercaderia: MercaderiaTipoGQL
    estado: PedidoEstadoGQL

    @classmethod
    def from_model(cls, pedido: Pedido) -> "PedidoGQL":
        return cls(
            id=pedido.id,
            id_cliente=pedido.id_cliente,
            peso_kg=pedido.peso_kg,
            volumen_m3=pedido.volumen_m3,
            ventana_inicio=pedido.ventana_inicio,
            ventana_fin=pedido.ventana_fin,
            tipo_mercaderia=pedido.tipo_mercaderia,
            estado=pedido.estado,
        )


@strawberry.type
class CargaGQL:
    """Carga consolidada de varios pedidos para un camión."""

    id: int
    id_centro: int
    id_camion: int | None
    estado: CargaEstadoGQL
    pedidos: list[PedidoGQL]

    @classmethod
    def from_model(cls, carga: Carga) -> "CargaGQL":
        return cls(
            id=carga.id,
            id_centro=carga.id_centro,
            id_camion=carga.id_camion,
            estado=carga.estado,
            pedidos=[PedidoGQL.from_model(pedido) for pedido in carga.pedidos],
        )


@strawberry.type
class HistorialEntregadoGQL:
    viajes_eliminados: int
    cargas_eliminadas: int


@strawberry.type
class DocumentoGQL:
    """Documento de cumplimiento operativo del camión."""

    id: int
    id_camion: int
    tipo: DocumentoTipoGQL
    fecha_emision: datetime
    fecha_vencimiento: datetime
    vigente: bool

    @classmethod
    def from_model(cls, documento: Documento, fecha: date) -> "DocumentoGQL":
        return cls(
            id=documento.id,
            id_camion=documento.id_camion,
            tipo=documento.tipo,
            fecha_emision=documento.fecha_emision,
            fecha_vencimiento=documento.fecha_vencimiento,
            vigente=(
                documento.fecha_emision.date() <= fecha
                and documento.fecha_vencimiento.date() >= fecha
            ),
        )


@strawberry.type
class MantencionGQL:
    """Mantención programada o ejecutada para un camión."""

    id: int
    id_camion: int
    tipo: MantencionTipoGQL
    descripcion: str
    fecha_inicio: datetime
    fecha_fin: datetime | None
    estado: MantencionEstadoGQL

    @classmethod
    def from_model(cls, mantencion: Mantencion) -> "MantencionGQL":
        return cls(
            id=mantencion.id,
            id_camion=mantencion.id_camion,
            tipo=mantencion.tipo,
            descripcion=mantencion.descripcion,
            fecha_inicio=mantencion.fecha_inicio,
            fecha_fin=mantencion.fecha_fin,
            estado=mantencion.estado,
        )


@strawberry.type
class LicenciaGQL:
    """Licencia asociada a un conductor."""

    id: int
    fecha_emision: datetime
    fecha_vencimiento: datetime
    clases: list[LicenciaClaseGQL]
    tipos_camion_habilitados: list[str]

    @classmethod
    def from_model(cls, licencia: Licencia) -> "LicenciaGQL":
        return cls(
            id=licencia.id,
            fecha_emision=licencia.fecha_emision,
            fecha_vencimiento=licencia.fecha_vencimiento,
            clases=[clase.clase for clase in licencia.clases],
            tipos_camion_habilitados=sorted(
                {
                    tipo_camion.tipo
                    for clase in licencia.clases
                    for tipo_camion in clase.tipos_camion
                }
            ),
        )


@strawberry.type
class ConductorGQL:
    """Resumen de un conductor listo para la toma de decisiones de operación."""

    id: int
    rut: str
    nombres: str
    apellidos: str
    telefono: str
    email: str
    licencias: list[LicenciaGQL]
    habilitado: bool
    en_viaje: bool

    @classmethod
    def from_model(
        cls,
        conductor: Conductor,
        en_viaje: bool = False,
    ) -> "ConductorGQL":
        licencias = sorted(
            conductor.licencias,
            key=lambda licencia: licencia.fecha_emision,
            reverse=True,
        )
        hoy = datetime.now(UTC).date()
        habilitado = bool(
            licencias
            and licencias[0].fecha_emision.date() <= hoy
            and licencias[0].fecha_vencimiento.date() >= hoy
            and licencias[0].clases
        )
        return cls(
            id=conductor.id,
            rut=conductor.rut,
            nombres=conductor.nombres,
            apellidos=conductor.apellidos,
            telefono=conductor.telefono,
            email=conductor.email,
            licencias=[LicenciaGQL.from_model(licencia) for licencia in licencias],
            habilitado=habilitado,
            en_viaje=en_viaje,
        )


@strawberry.type
class CamionGQL:
    """Representa el estado operativo real del camión."""

    id: int
    patente: str
    id_tipo_camion: int
    peso_kg: Decimal
    volumen_m3: Decimal
    activo: bool
    habilitado: bool
    estado_operativo: CamionEstadoOperativoGQL
    restricciones: list[str]
    documentos: list[DocumentoGQL]
    mantenciones: list[MantencionGQL]

    @classmethod
    def from_model(
        cls,
        camion: Camion,
        en_transito: bool = False,
    ) -> "CamionGQL":
        from app.services.flota import restricciones_operativas

        hoy = datetime.now(UTC).date()
        documentos = list(camion.documentos)
        mantenciones = list(camion.mantenciones)
        restricciones = restricciones_operativas(
            documentos,
            mantenciones,
            hoy,
            hoy,
            camion.activo,
        )
        if en_transito:
            estado_operativo = CamionEstadoOperativo.EN_TRANSITO
        elif not camion.activo:
            estado_operativo = CamionEstadoOperativo.INACTIVO
        elif restricciones:
            estado_operativo = CamionEstadoOperativo.NO_HABILITADO
        else:
            estado_operativo = CamionEstadoOperativo.DISPONIBLE
        return cls(
            id=camion.id,
            patente=camion.patente,
            id_tipo_camion=camion.id_tipo_camion,
            peso_kg=camion.peso_kg,
            volumen_m3=camion.volumen_m3,
            activo=camion.activo,
            habilitado=not restricciones,
            estado_operativo=estado_operativo,
            restricciones=restricciones,
            documentos=[
                DocumentoGQL.from_model(documento, hoy) for documento in documentos
            ],
            mantenciones=[MantencionGQL.from_model(item) for item in mantenciones],
        )


@strawberry.type
class TipoCamionGQL:
    """Catálogo de tipos de camión."""

    id: int
    tipo: str

    @classmethod
    def from_model(cls, tipo_camion: TipoCamion) -> "TipoCamionGQL":
        return cls(id=tipo_camion.id, tipo=tipo_camion.tipo)


@strawberry.type
class PedidoNoAsignadoGQL:
    """Pedido que no pudo entrar a la carga por incompatibilidad o capacidad."""

    pedido: PedidoGQL
    motivo: str


@strawberry.type
class CargaCalculadaGQL:
    """Resultado de una validación de capacidad para un camión."""

    id_camion: int
    patente_camion: str
    id_centro: int
    pedidos: list[PedidoGQL]
    pedidos_no_asignados: list[PedidoNoAsignadoGQL]
    peso_total_kg: Decimal
    volumen_total_m3: Decimal
    peso_disponible_kg: Decimal
    volumen_disponible_m3: Decimal
    porcentaje_peso: Decimal
    porcentaje_volumen: Decimal

    @classmethod
    def from_result(
        cls,
        distribucion: DistribucionCargas,
        camion: Camion,
        id_centro: int,
    ) -> "CargaCalculadaGQL":
        carga = distribucion.cargas[0] if distribucion.cargas else None
        return cls(
            id_camion=camion.id,
            patente_camion=camion.patente,
            id_centro=id_centro,
            pedidos=[PedidoGQL.from_model(pedido) for pedido in carga.pedidos]
            if carga
            else [],
            pedidos_no_asignados=[
                PedidoNoAsignadoGQL(
                    pedido=PedidoGQL.from_model(no_asignado.pedido),
                    motivo=no_asignado.motivo,
                )
                for no_asignado in distribucion.no_asignados
            ],
            peso_total_kg=carga.peso_total_kg if carga else Decimal(0),
            volumen_total_m3=carga.volumen_total_m3 if carga else Decimal(0),
            peso_disponible_kg=carga.peso_disponible_kg if carga else camion.peso_kg,
            volumen_disponible_m3=carga.volumen_disponible_m3
            if carga
            else camion.volumen_m3,
            porcentaje_peso=carga.porcentaje_peso if carga else Decimal(0),
            porcentaje_volumen=carga.porcentaje_volumen if carga else Decimal(0),
        )


@strawberry.input
class ClienteInput:
    razon: str
    rut: str
    direccion: str | None = None
    mail: str | None = None
    telefono: str | None = None


@strawberry.input
class CentroDistribucionInput:
    direccion: str
    distancia_km: Decimal
    distancia_min: int


@strawberry.input
class PedidoInput:
    id_cliente: int
    peso_kg: Decimal
    volumen_m3: Decimal
    ventana_inicio: datetime
    ventana_fin: datetime
    tipo_mercaderia: MercaderiaTipoGQL


@strawberry.input
class CamionInput:
    patente: str
    id_tipo_camion: int
    peso_kg: Decimal
    volumen_m3: Decimal


@strawberry.input
class DocumentoInput:
    tipo: DocumentoTipoGQL
    fecha_emision: datetime
    fecha_vencimiento: datetime


@strawberry.input
class MantencionInput:
    tipo: MantencionTipoGQL
    descripcion: str
    fecha_inicio: datetime
    fecha_fin: datetime | None = None


@strawberry.input
class ConductorInput:
    rut: str
    nombres: str
    apellidos: str
    telefono: str
    email: str
    fecha_emision_licencia: datetime
    fecha_vencimiento_licencia: datetime
    clases: list[LicenciaClaseGQL]


@strawberry.type
class ViajeGQL:
    """Estado operativo de un viaje en ejecución o cerrado."""

    id: int
    id_conductor: int
    nombre_conductor: str
    id_camion: int
    patente_camion: str
    id_carga: int
    fecha_inicio: datetime
    fecha_fin: datetime
    estado: ViajeEstadoGQL

    @classmethod
    def from_model(cls, viaje: Viaje) -> "ViajeGQL":
        return cls(
            id=viaje.id,
            id_conductor=viaje.id_conductor,
            nombre_conductor=f"{viaje.conductor.nombres} {viaje.conductor.apellidos}",
            id_camion=viaje.id_camion,
            patente_camion=viaje.camion.patente,
            id_carga=viaje.id_carga,
            fecha_inicio=viaje.fecha_inicio,
            fecha_fin=viaje.fecha_fin,
            estado=viaje.estado,
        )


@strawberry.input
class PerfilConductorInput:
    rut: str
    nombres: str
    apellidos: str
    telefono: str
    email: str


@strawberry.input
class LicenciaInput:
    fecha_emision: datetime
    fecha_vencimiento: datetime
    clases: list[LicenciaClaseGQL]


@strawberry.input
class CrearViajeInput:
    id_conductor: int
    id_camion: int
    id_carga: int
    fecha_inicio: datetime
    fecha_fin: datetime
