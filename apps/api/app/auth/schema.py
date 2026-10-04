from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession

from app.auth.inputs import LoginInput
from app.auth.repository import AuthRepository
from app.auth.service import AuthService
from app.auth.types import LoginResponse, LoginUsuario
from app.core.bootstrap import ensure_security_data
from app.core.config import get_settings
from app.core.db import get_session

router = APIRouter()


@router.post("/login", response_model=LoginResponse)
async def login(
    input: LoginInput,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> LoginResponse:
    await ensure_security_data(session, get_settings())
    result = await AuthService(session, AuthRepository(session)).iniciar_sesion(input)
    if result is None:
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos.")
    return LoginResponse(
        token=result.token,
        user=LoginUsuario(id=result.user.id, username=result.user.username, role=result.user.role),
    )