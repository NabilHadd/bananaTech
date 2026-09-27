# Auditoría técnica

Fecha: 2026-09-27

## Correcciones aplicadas

- Ruff detectó inicialmente 104 avisos en la API, pruebas y migraciones; ahora `ruff check` pasa en los tres directorios. La normalización mecánica de migraciones históricas fue de imports/anotaciones; también se corrigieron por separado los downgrades destructivos.
- Quitado el import de `engine` que no se usaba desde `main.py` y retirado `app/core/errors.py`, cuyo `DomainError` no tenía referencias.
- Añadida validación de peso y volumen al crear o editar pedidos. Los modelos SQLModel con `table=True` no aplicaban por sí solos `gt=0`; ahora se rechazan valores no positivos, con más de dos decimales o fuera del rango `Numeric(10, 2)`.
- Protegido el ciclo de vida de pedidos: no se editan ni cancelan mientras pertenecen a una carga no cancelada. Los vínculos con cargas canceladas se conservan como historial, pero ya no impiden recalcular o reasignar.
- Añadidos bloqueos de fila al editar/cancelar pedidos, confirmar cargas, programar mantenciones y modificar documentación/camiones. La salida a ruta y administración de flota se serializan por el camión para evitar asignaciones concurrentes.
- La confirmación de una carga exige camión, valida centro activo de cada cliente, compatibilidad, peso y volumen, y guarda el camión seleccionado. Se agregó `carga.id_camion` nullable para no invalidar cargas previas.
- Las consultas raíz GraphQL serializan el acceso a la `AsyncSession` por petición; evita que el executor asíncrono ejecute varios campos raíz concurrentes sobre la misma sesión.
- Añadido el ciclo de gestión de flota: alta/edición/desactivación de camiones, CRUD de documentos y programación/transición de mantenciones. RT, PC y SOAP deben cubrir toda la ventana de la carga; la regla se aplica al calcular, confirmar, asignar y salir a ruta.
- Creada la tabla `mantencion`, el indicador `camion.activo` y SOAP faltante para camiones de demostración mediante la migración `a94e7f3c1b20`.
- Añadida una migración que separa el pedido de AgroNorte de la carga mock de Antofagasta: el cliente solo está asociado activamente a Coquimbo.
- El downgrade del seed mock ahora se bloquea para no borrar datos ajenos. Las migraciones nuevas bloquean downgrades que perderían camiones asignados o cargas entregadas.
- Conectadas las pantallas de Flota y Mantenimiento a GraphQL, con formularios para unidades/documentos/mantenciones, estado de carga y errores. El HTML declara español y título de producto; eliminada `apps/web/src/App.css`, que no se importaba.

## Pendientes y riesgos

- Dashboard, Conductores y Rutas/Pedidos aún usan mocks; búsqueda/notificaciones y otras acciones siguen sin conexión a la API.
- La selección de carga es heurística y prioriza fechas próximas; no garantiza la ocupación global óptima de dos dimensiones.
- El destino se deduce de la asociación activa cliente-centro. Si un pedido necesita destino propio o múltiples paradas, el modelo requiere una entidad de ruta/destino explícita.
- La API no calcula compatibilidad por equipamiento especial del camión (por ejemplo, refrigeración); hoy la regla modelada corresponde a mezcla de mercaderías, documentación legal y mantención.
- La habilitación exige RT, PC y SOAP; hay que ampliar el catálogo/regla si la operación requiere PADRON, CEC u otros documentos obligatorios.
- La API no tiene autenticación/autorización. No debe exponerse fuera de un entorno de confianza hasta definir esos controles.
- Las cargas existentes reciben `id_camion = NULL`; deben asignarse explícitamente si se requiere historial completo del camión.
- No hay pruebas automatizadas de resolvers contra PostgreSQL; se verificó manualmente el stack Docker, las migraciones y la consulta GraphQL compuesta de Flota.
- El downgrade del seed mock está intencionalmente bloqueado. Para retirar los datos de demostración en desarrollo, recrear la base local; no ejecutar un downgrade esperando borrar solo esas filas.
- La migración que corrige la asociación errónea del pedido mock no restaura el vínculo inválido al hacer downgrade.

## Verificaciones ejecutadas

- `uv run ruff check app tests migrations`: sin hallazgos.
- `uv run python -m unittest discover -s tests -v`: 8 pruebas aprobadas.
- `uv run python -m compileall -q app migrations tests`: correcto.
- Importación e impresión del schema GraphQL: correcta.
- `uv run alembic history`: una única cadena hasta `a94e7f3c1b20`.
- `docker compose --env-file .env.example up --build -d`: migraciones completadas, API/web activos y healthcheck DB saludable.
- 40 consultas completas de `camiones + tiposCamion + documentos + mantenciones` respondieron sin error de sesión.
- `npm run lint`: correcto.
- `npm run build`: correcto.
- Las pantallas web de Flota/Mantenimiento ahora requieren API disponible en `VITE_API_URL` o `http://localhost:8000/graphql`.
- `npm ci`: lockfile instalado; auditoría reportó 0 vulnerabilidades.
