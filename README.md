# bananaTech

ERP de transporte: API GraphQL en Python (`apps/api`) y frontend en React (`apps/web`).

## Levantar el entorno

```bash
cp .env.example .env    # sólo la primera vez
# Define ADMIN_PASSWORD y un AUTH_SECRET aleatorio en .env antes de iniciar.
docker compose up -d    # levanta db (PostgreSQL) y api
docker compose exec api uv run --no-dev alembic upgrade head
```

- GraphQL: http://localhost:8000/graphql
- PostgreSQL: `localhost:5433`
- Inicio de sesión: http://localhost:5173/login. El administrador inicial se
  crea al arrancar la API si `ADMIN_USERNAME` y `ADMIN_PASSWORD` están definidos.
- Usuarios Planificador pueden operar la aplicación; usuarios, parámetros y
  reportes de costos requieren rol Administrador.

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

## Costos de viajes

Los parámetros iniciales se cargan desde `.env` a la base en el primer arranque.
Luego se modifican desde Parámetros y rigen sin reiniciar la API. Cada cambio
registra quién lo realizó, cuándo y los valores anterior y nuevo. Los viajes
conservan la copia económica aplicada al crearse. El reporte mensual agrupa por
fecha de inicio e incluye ingresos, combustible, peajes, desgaste, viáticos y margen.
Los valores iniciales son referencias, no cotizaciones de mercado ni tarifas reales.

El diésel se estima como `distancia / rendimiento del camión * precio`; peajes y
operación usan sus tarifas por kilómetro. El cobro suma `toneladas de pedidos *
distancia * tarifa`. Al finalizar, el margen es ingresos menos esos tres costos.
Por ejemplo, 4 toneladas a 400 km generan $400.000 de ingreso; con rendimiento
de 3 km/L, los costos de referencia suman $313.333 y el margen estimado es
$86.667 (21,7%). Estos parámetros se administran ahora desde la sección Parámetros.

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
