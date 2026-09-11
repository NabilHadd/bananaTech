# bananaTech

Monorepo con backend GraphQL en Python y (más adelante) frontend en React + Vite.

> **Estado actual:** solo está construido el backend (`apps/api`). El frontend
> se añadirá en `apps/web` como paso siguiente.

---

## Stack

| Pieza | Elección | Por qué |
| --- | --- | --- |
| Lenguaje | Python 3.14 | — |
| Entorno y dependencias | [uv](https://docs.astral.sh/uv/) | Maneja venv, lockfile y versión de Python en un solo binario |
| GraphQL | [Strawberry](https://strawberry.rocks) | El schema se genera desde los *type hints* de Python, sin duplicar definiciones |
| Servidor HTTP | FastAPI + uvicorn | Aporta rutas REST, middleware, CORS e inyección de dependencias alrededor de GraphQL |
| Configuración | pydantic-settings | Variables de entorno tipadas |
| Linter y formateador | ruff | — |

---

## Cómo levantarlo

Requisito: [uv](https://docs.astral.sh/uv/getting-started/installation/) instalado.

```bash
cd apps/api
uv sync                     # crea .venv e instala dependencias desde uv.lock
uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

No hace falta activar el entorno virtual: `uv run` lo hace por ti.

Desde la raíz del repo también funciona, con `--directory`:

```bash
uv run --directory apps/api uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

> Se usa `--host 127.0.0.1` a propósito. El valor por defecto de uvicorn es
> `0.0.0.0`, que expone el servidor a toda la red local.

---

## Endpoints HTTP

| Ruta | Método | Qué es |
| --- | --- | --- |
| `/graphql` | GET | GraphiQL: IDE interactivo con autocompletado y documentación del schema |
| `/graphql` | POST | Toda la API GraphQL: queries y mutations |
| `/health` | GET | Comprobación de vida, para Docker u orquestadores. Devuelve `{"status": "ok"}` |
| `/docs` | GET | Swagger autogenerado por FastAPI (solo cubre las rutas REST, **no** GraphQL) |

**Esto es lo primero que sorprende viniendo de REST:** GraphQL tiene un único
endpoint. No hay `/bananas` ni `/farms`. Todo entra por `POST /graphql` y lo que
cambia es el *cuerpo* de la petición. La "forma" de la API no está en las URLs,
está en el schema de tipos.

---

## Operaciones GraphQL de ejemplo

Todas se pueden pegar directamente en GraphiQL (`http://localhost:8000/graphql`).

### 1. Listar bananas filtrando por madurez

```graphql
query {
  bananas(minRipeness: 3) {
    name
    ripeness
  }
}
```

Prueba a **borrar `ripeness`** y ejecutar de nuevo: la respuesta deja de traerlo.
El cliente decide la forma de la respuesta, no el servidor. Eso es el núcleo de
GraphQL.

> **Nota:** en Python el argumento se llama `min_ripeness`, pero se consulta como
> `minRipeness`. Strawberry convierte a camelCase automáticamente porque es la
> convención de GraphQL.

### 2. Traer datos relacionados en una sola petición

```graphql
query {
  bananas {
    name
    farm {
      name
      country
    }
  }
}
```

En REST esto serían dos llamadas (`/bananas` y luego `/farms/1`). Aquí es una.
El campo `farm` tiene su propio resolver (`app/bananas/types.py`) que **solo se
ejecuta si el cliente lo pide**: si preguntas `{ bananas { name } }`, nunca se
consulta la tabla de fincas.

### 3. La relación inversa

```graphql
query {
  farms {
    name
    bananas {
      name
      ripeness
    }
  }
}
```

`Farm.bananas` y `Banana.farm` apuntan uno al otro. El schema es un **grafo**, no
una lista de recursos independientes. Puedes navegarlo en ambas direcciones y a
cualquier profundidad:

```graphql
query {
  farms { name bananas { name farm { country } } }
}
```

### 4. Buscar por id

```graphql
query {
  banana(id: "1") {
    name
    farm { name }
  }
}
```

Si el id no existe, la respuesta es `{"data": {"banana": null}}` — **sin error**.
Eso no es un fallo: está declarado en el schema mediante la *nulabilidad*.

#### La notación `!`

| En el SDL | Significa | Cómo se escribe en Python |
| --- | --- | --- |
| `Banana` | puede ser `null` | `-> BananaType \| None` |
| `Banana!` | nunca es `null` | `-> BananaType` |
| `[Banana!]!` | lista no nula, de elementos no nulos | `-> list[BananaType]` |

Compara los dos resolvers de `app/bananas/resolvers.py` con el SDL que generan:

```python
async def banana(...) -> BananaType | None:   #  banana(id: ID!): Banana
async def bananas(...) -> list[BananaType]:   #  bananas(...): [Banana!]!
```

El `| None` de Python **es** lo que quita el `!` del schema. Nadie escribe el SDL a
mano: se deduce de los *type hints*.

En `banana(id: ID!)` el argumento sí lleva `!`: el id es obligatorio al pedirlo,
pero el resultado puede no existir. Son dos cosas independientes.

Tres cosas que conviene tener claras:

- **En GraphQL todo es nulable por defecto**, al revés de lo que uno esperaría. El
  `!` es lo que *añade* la garantía.
- **Una lista vacía no es `null`.** `bananas(minRipeness: 99)` devuelve `[]`, no
  `null`: la lista existe, solo que sin elementos.
- **Los `null` se propagan hacia arriba.** Si un campo declarado con `!` falla o
  devuelve `null`, GraphQL no puede dejar `null` ahí, así que anula el campo padre,
  y sigue subiendo hasta el primer campo nulable. Un error en un campo profundo
  puede vaciar media respuesta — por eso no conviene poner `!` en todo por reflejo.

Esto importa más de lo que parece: cuando generemos los tipos de TypeScript para el
frontend, `banana` llegará como `Banana | null` y el compilador obligará a manejar
el caso, mientras que `bananas` llegará como `Banana[]` sin comprobaciones. La
garantía viaja desde el Python hasta el TypeScript.

### 5. Crear una banana (mutation)

```graphql
mutation {
  createBanana(data: { name: "Manzanito", farmId: "2", ripeness: 2 }) {
    id
    name
    farm { name country }
  }
}
```

Las **mutations** son para escribir; las **queries** para leer. La diferencia real
es que las mutations se ejecutan en serie, no en paralelo.

Fíjate en que la mutation devuelve el objeto creado y tú eliges qué campos quieres
de vuelta — incluso datos relacionados como `farm`. En REST harías POST y luego un
GET para obtener lo mismo.

El argumento `data` es un **input type** (`CreateBananaInput`), el equivalente a un
DTO de entrada.

### 6. Un error de negocio

```graphql
mutation {
  createBanana(data: { name: "Fantasma", farmId: "99" }) {
    id
  }
}
```

Respuesta:

```json
{
  "data": null,
  "errors": [{
    "message": "La finca 99 no existe",
    "locations": [{ "line": 2, "column": 3 }],
    "path": ["createBanana"]
  }]
}
```

**Llega con HTTP 200.** GraphQL no usa códigos de estado HTTP para errores de
negocio: siempre responde 200 con un array `errors`. Es otra diferencia grande
respecto a REST.

La validación vive en `BananaService.create()`, no en el resolver: el resolver solo
traduce entre GraphQL y el servicio.

### 7. Un campo que no existe

```graphql
query { bananas { color } }
```

```json
{"errors": [{"message": "Cannot query field 'color' on type 'Banana'."}]}
```

GraphQL rechaza la query **antes de ejecutar nada**. El schema es un contrato
validado, no solo documentación.

---

## Estructura del proyecto

```
bananaTech/
├── README.md
├── .gitignore
└── apps/
    └── api/
        ├── pyproject.toml         # dependencias + configuración de ruff
        ├── uv.lock                # versiones exactas (se commitea)
        ├── .python-version        # versión de Python fijada por uv
        └── app/
            ├── main.py            # FastAPI: monta GraphQL, CORS y /health
            ├── core/
            │   ├── config.py      # Settings desde variables de entorno
            │   ├── context.py     # construye los servicios (inyección de dependencias)
            │   └── errors.py      # DomainError
            ├── graphql/
            │   └── schema.py      # composition root: une los Query/Mutation
            ├── bananas/           # una carpeta por entidad (corte vertical)
            │   ├── models.py      # modelo de dominio (dataclass)
            │   ├── types.py       # tipos GraphQL + resolvers de campo
            │   ├── repository.py  # acceso a datos
            │   ├── service.py     # lógica de negocio
            │   └── resolvers.py   # queries y mutations de la entidad
            └── farms/
                └── (misma estructura)
```

### Equivalencias con NestJS

| NestJS | Aquí |
| --- | --- |
| `@Controller` / `@Resolver` | `resolvers.py` — `@strawberry.type class BananaQuery` |
| `@ObjectType()` | `types.py` — `@strawberry.type` |
| `@InputType()` | `@strawberry.input` |
| `@Injectable()` service | `service.py` — una clase normal, sin decorador |
| Repository | `repository.py` |
| Entity de TypeORM/Prisma | `models.py` |
| `@Module()` | **No existe.** En Python el grafo de dependencias son los `import` |
| `AppModule` | `graphql/schema.py` — el único archivo que sabe qué features existen |
| Container de DI | `core/context.py` — las dependencias se arman a mano |

No hay `module.py` porque Nest lo necesita para su container de inyección de
dependencias en runtime. Python no tiene container: `from app.bananas.service
import BananaService` **es** el cableado.

### Cómo fluye una petición

```
POST /graphql
      │
      ▼
  main.py           FastAPI + CORS
      │
      ▼
  GraphQLRouter     valida la query contra el schema
      │
      ▼
  resolvers.py      traduce GraphQL ↔ dominio        (sin lógica de negocio)
      │
      ▼
  service.py        reglas de negocio y validaciones (sin saber de GraphQL)
      │
      ▼
  repository.py     acceso a datos                   (sin saber de negocio)
```

Cada capa solo conoce a la de abajo. Por eso cambiar el almacenamiento de memoria
a PostgreSQL tocará **únicamente** `repository.py`.

---

## Schema GraphQL generado

Se genera automáticamente desde el código Python. Para exportarlo:

```bash
uv run --directory apps/api strawberry export-schema app.graphql.schema:schema
```

```graphql
type Banana {
  id: ID!
  name: String!
  ripeness: Int!
  farm: Farm!
}

input CreateBananaInput {
  name: String!
  farmId: ID!
  ripeness: Int! = 0
}

type Farm {
  id: ID!
  name: String!
  country: String!
  bananas: [Banana!]!
}

type Mutation {
  createBanana(data: CreateBananaInput!): Banana!
}

type Query {
  bananas(minRipeness: Int! = 0): [Banana!]!
  banana(id: ID!): Banana
  farms: [Farm!]!
  farm(id: ID!): Farm
}
```

Notación: `!` significa no-nulo. `[Banana!]!` es una lista no nula de elementos no
nulos.

Fíjate en que `farm_id` **no aparece**: está declarado como `strawberry.Private[str]`
en `BananaType`, así que existe en Python pero no se expone en la API. Los clientes
navegan por `farm`, no por un id suelto.

Este archivo es el **contrato** entre backend y frontend. Cuando exista `apps/web`,
se exportará a `packages/graphql/schema.graphql` y GraphQL Codegen generará desde ahí
los tipos de TypeScript automáticamente.

---

## Limitaciones actuales

- **Los datos viven en memoria** (`repository.py`). Se pierden al reiniciar el
  servidor y no se comparten entre procesos. Es intencional: aísla la persistencia
  en una sola capa para poder cambiarla sin tocar el resto.
- **Sin autenticación.**
- **Sin DataLoader.** Si se piden muchas fincas con sus bananas, el resolver anidado
  se ejecuta una vez por elemento (problema *N+1*). Irrelevante en memoria, crítico
  con base de datos real.

---

## Comandos útiles

```bash
cd apps/api

uv sync                        # instalar dependencias
uv add <paquete>               # añadir una dependencia
uv run ruff check app/         # linter
uv run ruff format app/        # formateador
uv run strawberry export-schema app.graphql.schema:schema
```

---

## Próximos pasos

1. **Frontend** en `apps/web` con Vite + React + TypeScript, con proxy de `/graphql`
   hacia el backend y tipos generados con GraphQL Codegen.
2. **Base de datos**: SQLAlchemy + PostgreSQL, migraciones con Alembic. Solo cambia
   `repository.py` y se añade `core/db.py`.
3. **DataLoader** para resolver el problema N+1.
4. **`package.json` en la raíz** con npm workspaces, para levantar backend y frontend
   con un solo `npm run dev`.
5. **Docker Compose** para api + web + postgres.
