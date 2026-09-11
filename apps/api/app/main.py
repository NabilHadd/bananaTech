from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from strawberry.fastapi import GraphQLRouter

from app.core.config import get_settings
from app.core.context import build_context
from app.graphql.schema import schema

settings = get_settings()

app = FastAPI(title=settings.app_name, debug=settings.debug)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    GraphQLRouter(schema, context_getter=build_context),
    prefix="/graphql",
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
