# bananaTech

Monorepo del ERP de transporte: API GraphQL en Python (`apps/api`) y dashboard en
React (`apps/web`).

> **Estado:** backend con modelos y migraciones listos; el schema GraphQL todavía
> es el de ejemplo. El frontend está con datos mock.

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

```bash
cp .env.example .env          # sólo la primera vez
docker compose up -d
```

Levanta `db` (PostgreSQL) y `api`. Verifica con `docker compose ps` que `db` diga
`(healthy)`.

| Servicio | URL |
| --- | --- |
| GraphQL | http://localhost:8000/graphql |
| Health | http://localhost:8000/health |
| PostgreSQL | `localhost:5433` |

> El puerto es **5433**, no 5432, para no chocar con un PostgreSQL instalado en el
> sistema.

---

## Migraciones

El volumen de datos es local de cada máquina: por git viajan los archivos de
migración, no los datos. **Después de cada `git pull`, aplica lo pendiente:**

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

Tras un `down -v` hay que volver a aplicar las migraciones.

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

No está dockerizado: corre directo en tu máquina.

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

## Pendientes

1. Conectar la sesión de BD al contexto de GraphQL (`app/core/context.py`).
2. Reemplazar el schema de ejemplo por queries y mutations reales.
3. Definir los tipos de camión y sembrarlos en `tipo_camion`.
4. Conectar el frontend a la API (hoy usa mocks).
