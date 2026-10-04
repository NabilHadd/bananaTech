import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import SQLAlchemyError
from strawberry.fastapi import GraphQLRouter

# Importar models para que SQLModel.metadata reconozca todas las tablas
import app.models
from app.auth.schema import router as auth_router
from app.core.bootstrap import ensure_security_data
from app.core.config import get_settings
from app.core.context import build_context
from app.core.db import async_session_maker
from app.graphql.schema import schema

settings = get_settings()
logger = logging.getLogger(__name__)

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
app.include_router(auth_router, prefix="/auth")


@app.on_event("startup")
async def initialize_security_data() -> None:
    settings = get_settings()
    if not settings.debug and (
        settings.auth_secret in {"development-only-change-me", "cambiar-por-un-secreto-largo-y-aleatorio"}
        or len(settings.auth_secret) < 32
    ):
        raise RuntimeError("En producción AUTH_SECRET debe ser aleatorio y tener al menos 32 caracteres.")
    async with async_session_maker() as session:
        try:
            await ensure_security_data(session, settings)
        except SQLAlchemyError:
            await session.rollback()
            logger.warning("No fue posible inicializar parámetros. Aplica alembic upgrade head.")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
