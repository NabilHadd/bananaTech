# Auditoría técnica

Fecha: 2026-09-27

## Correcciones aplicadas

- Ruff detectó inicialmente 104 avisos en la API, pruebas y migraciones; ahora `ruff check` pasa en los tres directorios. La normalización mecánica de migraciones históricas fue de imports/anotaciones; también se corrigieron por separado los downgrades destructivos.
- Quitado el import de `engine` que no se usaba desde `main.py` y retirado `app/core/errors.py`, cuyo `DomainError` no tenía referencias.
- Añadida validación de peso y volumen al crear o editar pedidos. Los modelos SQLModel con `table=True` no aplicaban por sí solos `gt=0`; ahora se rechazan valores no positivos, con más de dos decimales o fuera del rango `Numeric(10, 2)`.
- Protegido el ciclo de vida de pedidos: no se editan ni cancelan mientras pertenecen a una carga no cancelada. Los vínculos con cargas canceladas se conservan como historial, pero ya no impiden recalcular o reasignar.
- La confirmación de una carga exige camión, valida centro activo de cada cliente, compatibilidad, peso y volumen, y guarda el camión seleccionado. Se agregó `carga.id_camion` nullable para no invalidar cargas previas.
- Añadida una migración que separa el pedido de AgroNorte de la carga mock de Antofagasta: el cliente solo está asociado activamente a Coquimbo.
- El downgrade del seed mock ahora se bloquea para no borrar datos ajenos. Las migraciones nuevas bloquean downgrades que perderían camiones asignados o cargas entregadas.
- Eliminada `apps/web/src/App.css`, que contenía estilos del starter y no se importaba. El HTML ahora declara español y un título de producto; textos de la interfaz ya no afirman que los datos mock vienen de la base de datos.

## Pendientes y riesgos

- El frontend sigue usando datos mock; búsqueda, notificaciones y botones de alta/acciones no están conectados a la API.
- La selección de carga es heurística y prioriza fechas próximas; no garantiza la ocupación global óptima de dos dimensiones.
- El destino se deduce de la asociación activa cliente-centro. Si un pedido necesita destino propio o múltiples paradas, el modelo requiere una entidad de ruta/destino explícita.
- La API no tiene autenticación/autorización. No debe exponerse fuera de un entorno de confianza hasta definir esos controles.
- Las cargas existentes reciben `id_camion = NULL`; deben asignarse explícitamente si se requiere historial completo del camión.
- Las pruebas cubren lógica unitaria, no resolvers contra PostgreSQL. Docker Compose no tenía servicios activos ni configuración `.env`, por lo que no se aplicaron migraciones ni se probaron transacciones reales.
- El downgrade del seed mock está intencionalmente bloqueado. Para retirar los datos de demostración en desarrollo, recrear la base local; no ejecutar un downgrade esperando borrar solo esas filas.
- La migración que corrige la asociación errónea del pedido mock no restaura el vínculo inválido al hacer downgrade.

## Verificaciones ejecutadas

- `uv run ruff check app tests migrations`: sin hallazgos.
- `uv run python -m unittest discover -s tests -v`: 4 pruebas aprobadas.
- `uv run python -m compileall -q app migrations tests`: correcto.
- Importación e impresión del schema GraphQL: correcta.
- `uv run alembic history`: una única cadena hasta `8c4f1a6d2b90`.
- `npm run lint`: correcto.
- `npm run build`: correcto.
- `npm ci`: lockfile instalado; auditoría reportó 0 vulnerabilidades.
