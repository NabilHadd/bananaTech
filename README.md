# bananaTech

ERP de transporte: API GraphQL en Python (`apps/api`) y frontend en React (`apps/web`).

## Levantar el entorno

```bash
cp .env.example .env    # sólo la primera vez
docker compose up -d    # levanta db (PostgreSQL) y api
```

- GraphQL: http://localhost:8000/graphql
- PostgreSQL: `localhost:5433`

El frontend corre fuera de Docker:

```bash
cd apps/web
npm ci          # sólo la primera vez
npm run dev     # http://localhost:5173
```

## Migraciones

Después de cada `git pull`, lleva la base al head:

```bash
docker compose exec api uv run --no-dev alembic upgrade head
```

## Bajar el entorno

```bash
docker compose stop     # pausa; conserva contenedores y datos
docker compose down     # elimina contenedores; conserva los datos
docker compose down -v  # borra también la base (luego hay que migrar de nuevo)
```

## Estructura

```
apps/
  api/
    app/
      core/          config, sesión de BD, contexto GraphQL
      models/        modelos SQLModel (tablas)
      graphql/       schema: une las queries y mutations de cada módulo
      flota/         módulo Épica 1
      conductores/   módulo Épica 2
    migrations/      revisiones de Alembic
  web/src/
    api/             un <entidad>.api.ts por entidad
    components/
      ui/            piezas genéricas (Button, Badge, Select…)
      common/        estructura compartida (Modal, DataTable, AppLayout…)
      features/      componentes de cada módulo (flota/, conductores/)
    pages/           una página por ruta
docs/                reportes
```

### Frontend

- `api/`: queries y mutations GraphQL de cada entidad. Las páginas sólo llaman a estas funciones.
- `components/ui/`: controles básicos sin lógica de negocio.
- `components/common/`: componentes compartidos por todas las páginas.
- `components/features/<módulo>/`: componentes, tipos y constantes de un módulo.
- `pages/`: arma la página con los componentes y coordina las llamadas a la API.

### Backend

Cada módulo (`flota/`, `conductores/`) tiene las mismas capas:

- `repository.py`: consultas a la base. Sin reglas de negocio.
- `service.py`: reglas de negocio y validaciones; es la única capa que hace commit.
- `schema.py`: resolvers GraphQL; traducen argumentos → service → tipo de salida.
- `types.py`: tipos GraphQL de **salida** (lo que la API devuelve).
- `inputs.py`: tipos GraphQL de **entrada** (lo que recibe una query o mutation).
- `__init__.py`: marca la carpeta como paquete de Python para poder importarla.
