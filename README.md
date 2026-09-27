# bananaTech

Monorepo del ERP de transporte: API GraphQL en Python (`apps/api`) y dashboard en
React (`apps/web`).

> **Estado:** API GraphQL en desarrollo; Flota y Mantenimiento usan la API, mientras
> otras vistas del frontend todavía contienen datos mock.

---

## Stack

| Pieza | Elección |
| --- | --- |
| API | Python 3.14 · FastAPI · Strawberry (GraphQL) |
| ORM / migraciones | SQLModel · Alembic · asyncpg |
| Base de datos | PostgreSQL 17 (en Docker) |
| Entorno Python | [uv](https://docs.astral.sh/uv/) |
| Frontend | React 19 · Vite · TypeScript |

---

## Requisitos

Docker con Compose. Para trabajar en el código además: `uv` y Node 24.

---

## Levantar el entorno

Con Docker Desktop iniciado, desde la raíz del repositorio en PowerShell:

```bash
Copy-Item .env.example .env    # sólo la primera vez
docker compose up --build -d
```

Compose levanta PostgreSQL (`db`), aplica las migraciones (`migrate`), inicia la
API y arranca el frontend Vite (`web`). La web y la API montan el código del host
para recarga en caliente; esta configuración está orientada a desarrollo.

Comprueba los servicios y sus logs:

```bash
docker compose ps
docker compose logs -f web api migrate
```

| Servicio | URL |
| --- | --- |
| Dashboard | http://localhost:5173 |
| GraphQL | http://localhost:8000/graphql |
| Health | http://localhost:8000/health |
| PostgreSQL | `localhost:5433` |

> El puerto es **5433**, no 5432, para no chocar con un PostgreSQL instalado en el
> sistema.

Para aplicar migraciones manualmente después de modificar el esquema:

```bash
docker compose run --rm migrate
```

---

## Migraciones

El volumen de datos es local de cada máquina: por git viajan los archivos de
migración, no los datos. El primer `docker compose up` aplica las revisiones
pendientes antes de iniciar la API. Si agregas migraciones con los contenedores
ya levantados, ejecútalas con:

```bash
docker compose exec api uv run --no-dev alembic upgrade head
```

Para crear una migración nueva, hazlo **desde el host** (si la generas dentro del
contenedor el archivo queda como `root`):

```bash
cd apps/api
uv run alembic revision --autogenerate -m "descripción"   # detecta cambios en los modelos
uv run alembic revision -m "descripción"                  # vacía, para datos/seeds
```

Revisa siempre el archivo generado antes de aplicarlo, y commitéalo.

Otros comandos: `alembic current` (revisión aplicada), `alembic history`,
`alembic downgrade -1`.

---

## Bajar el entorno

```bash
docker compose stop     # pausa; conserva contenedores y datos
docker compose down     # elimina contenedores; CONSERVA los datos
docker compose down -v  # elimina también el volumen: borra la base entera
```

Tras un `down -v`, el siguiente `docker compose up --build -d` crea la base nueva
y vuelve a aplicar todas las migraciones automáticamente.

---

## Trabajar en el código

### Editar la API: no hace falta reiniciar nada

`apps/api` de tu disco y `/app` del contenedor son **la misma carpeta**, montada
con un volumen. Editas con tu editor de siempre, guardas, y uvicorn detecta el
cambio y se reinicia solo. No ejecutas ningún comando de Docker.

Sólo necesitas reconstruir la imagen cuando cambias el `Dockerfile` o agregas una
dependencia al `pyproject.toml`:

```bash
docker compose up -d --build api
```

### Instalar las dependencias también en tu máquina

Hay **dos entornos de Python separados**, y hacen falta los dos:

| Entorno | Quién lo usa |
| --- | --- |
| `/app/.venv` (dentro del contenedor) | uvicorn, al servir la API |
| `apps/api/.venv` (en tu disco) | Tu editor, y tú al correr `uv run …` |

Tu editor corre en tu máquina, no dentro del contenedor: sin el `.venv` local no
encuentra `sqlmodel` ni `fastapi`, subraya los imports en rojo y no autocompleta.
La API funciona igual, pero programas a ciegas.

```bash
cd apps/api
uv sync                   # crea apps/api/.venv
uv run ruff check app/    # linter
uv run ruff format app/   # formateador
```

En VS Code, después del `uv sync`: `Ctrl+Shift+P` → *Python: Select Interpreter* →
`apps/api/.venv/bin/python`.

### Frontend

El frontend corre en el servicio `web` de Compose. Su código está montado desde
`apps/web`, así que Vite recarga los cambios automáticamente. Para ejecutarlo
fuera de Docker (opcional):

```bash
cd apps/web
npm ci          # instala las versiones exactas del package-lock.json
npm run dev     # http://localhost:5173
```

Usa `npm ci` para sincronizarte con el equipo y `npm install <paquete>` sólo cuando
agregues una dependencia nueva a propósito. El puerto 5173 es el que la API
autoriza por CORS en `app/core/config.py`.

---

## Base de datos

```bash
docker compose exec db psql -U bananatech -d bananatech
```

Dentro de `psql`: `\dt` lista tablas, `\d <tabla>` la describe, `\dT+` los tipos
ENUM, `\q` sale. Credenciales para DBeaver/pgAdmin: las del `.env`.

**15 tablas.** Los catálogos (`clase_licencia`, `tipo_camion`) se poblan por
migración, no a mano. El modelo está documentado en el MER y la Documentación DB,
que el equipo mantiene fuera de este repo.

Para regenerar los datos mock de la base de datos ejecutar lo siguiente:

```bash
docker compose exec api uv run --no-dev alembic upgrade head
```

En caso de querer reiniciar la base de datos completa con todo y mock, se debe ejecutar lo siguiente:

```bash
docker compose down -v
docker compose up -d
docker compose exec api uv run --no-dev alembic upgrade head
```

---

## Estructura

```
apps/api/
  app/core/       config, engine y sesión de BD, contexto GraphQL
  app/models/     modelos SQLModel, agrupados por dominio
  app/graphql/    schema y resolvers
  migrations/     revisiones de Alembic
apps/web/src/     componentes React
docker-compose.yml
```

---

## GraphQL: clientes, pedidos y cargas

El backend permite consultar y administrar datos desde `http://localhost:8000/graphql`.
Las consultas incluyen `clientes`, `pedidos`, `camiones`, `camion(id)`,
`tiposCamion`, `mantenciones(idCamion, estado)` y `cargas(estado)`.
Los campos de entrada usan `idCliente`, `pesoKg`, `ventanaInicio`,
`tipoMercaderia`, según la conversión automática de Strawberry a camelCase.

Crear un pedido:

```graphql
mutation {
  crearPedido(input: {
    idCliente: 1
    pesoKg: 8000
    volumenM3: 20
    ventanaInicio: "2026-10-01T08:00:00"
    ventanaFin: "2026-10-01T18:00:00"
    tipoMercaderia: REFRIGERADA
  }) {
    id
    estado
    idCliente
  }
}
```

Los pedidos nuevos comienzan en `EN_ESPERA`. Solo pueden editarse o cancelarse
mientras esperan. `crearCarga(idCentro, idCamion, idsPedidos)` confirma una
propuesta solo si los pedidos corresponden al centro y caben en el camión
seleccionado; el camión queda registrado en la carga.
Luego `cambiarEstadoCarga` permite avanzar por `CREADO → EN_RUTA → ENTREGADA`
(también permite cancelar una carga antes de finalizarla). Al iniciar el viaje,
los pedidos pasan a `TRANSITO`; al completar la carga, pasan a `ENTREGADO`. Si
se cancela una carga en ruta, sus pedidos vuelven a `EN_ESPERA`.

Antes de crear una carga, `calcularCargaValida(camionId, centroId)` devuelve una
propuesta no persistida para el camión y centro elegidos. Considera pedidos en
espera de clientes asociados activamente al centro, excluye pedidos ligados a
cargas no canceladas, prioriza las ventanas cercanas y respeta capacidad y
compatibilidad. La respuesta incluye la ocupación de peso/volumen y los pedidos
no asignados con su motivo.
La selección es una heurística voraz, no una optimización exacta; el planificador
confirma la selección con `crearCarga`.

### Flota

`crearCamion` y `actualizarCamion` gestionan las características de las unidades;
`cambiarEstadoCamion(id, activo)` las activa o desactiva sin borrar su historial.
La consulta `camiones` devuelve documentos, mantenciones, `habilitado` y las
`restricciones` que impiden operar.

Los documentos se gestionan con `registrarDocumento`, `actualizarDocumento` y
`eliminarDocumento`. Cada camión necesita RT, PC y SOAP vigentes durante todo el
intervalo de la operación.

`programarMantencion` registra mantenciones preventivas/correctivas y evita
solapamientos con otras mantenciones o cargas asignadas. Sus transiciones son
`PROGRAMADA → EN_CURSO → COMPLETADA` o `PROGRAMADA → CANCELADA`.

El cálculo, `crearCarga`, `asignarCamionCarga` y la transición a `EN_RUTA` vuelven
a validar habilitación y capacidad para impedir que otra mutation omita las
restricciones. Las cargas antiguas con `idCamion = null` deben recibir asignación
explícita antes de salir.

## Pendientes

1. Conectar las vistas de dashboard, conductores y rutas/pedidos a la API; las pantallas de Flota y Mantenimiento ya consumen GraphQL.
2. Añadir pruebas de integración con PostgreSQL para las operaciones GraphQL.
