import asyncio
from inspect import isawaitable

from strawberry.extensions import SchemaExtension


class SesionSerializada(SchemaExtension):
    """Resuelve de a uno los campos de primer nivel de cada operación.

    GraphQL resuelve en paralelo los campos raíz de una query (p. ej.
    `{ tiposCamion camiones }`), pero todos comparten la AsyncSession del
    request y una sesión async no admite operaciones concurrentes. Los campos
    anidados no se tocan: leen datos ya cargados y no consultan la base.
    """

    def on_operation(self):
        self._lock = asyncio.Lock()
        yield

    def resolve(self, _next, root, info, *args, **kwargs):
        if info.path.prev is not None:
            return _next(root, info, *args, **kwargs)
        return self._en_turno(_next, root, info, *args, **kwargs)

    async def _en_turno(self, _next, root, info, *args, **kwargs):
        async with self._lock:
            resultado = _next(root, info, *args, **kwargs)
            if isawaitable(resultado):
                resultado = await resultado
            return resultado
