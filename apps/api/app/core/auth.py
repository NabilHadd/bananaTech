import base64
import hashlib
import hmac
import json
import secrets
import time

from fastapi import HTTPException
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import get_settings
from app.models.seguridad import Usuario

TOKEN_TTL_SECONDS = 60 * 60 * 12


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 310_000)
    return f"{salt.hex()}${digest.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        salt_hex, digest_hex = stored_hash.split("$", 1)
        digest = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt_hex), 310_000)
        return hmac.compare_digest(digest.hex(), digest_hex)
    except (ValueError, TypeError):
        return False


def create_token(usuario: Usuario) -> str:
    payload = base64.urlsafe_b64encode(
        json.dumps({"sub": usuario.id, "exp": int(time.time()) + TOKEN_TTL_SECONDS}).encode()
    ).decode().rstrip("=")
    signature = hmac.new(
        get_settings().auth_secret.encode(), payload.encode(), hashlib.sha256
    ).hexdigest()
    return f"{payload}.{signature}"


def _token_user_id(token: str) -> int:
    try:
        payload, signature = token.split(".", 1)
        expected = hmac.new(
            get_settings().auth_secret.encode(), payload.encode(), hashlib.sha256
        ).hexdigest()
        if not hmac.compare_digest(signature, expected):
            raise ValueError
        decoded = base64.urlsafe_b64decode(payload + "=" * (-len(payload) % 4))
        data = json.loads(decoded)
        if data["exp"] < int(time.time()):
            raise ValueError
        return int(data["sub"])
    except (ValueError, KeyError, TypeError, json.JSONDecodeError):
        raise HTTPException(status_code=401, detail="Sesión inválida o vencida.") from None


async def authenticate_token(session: AsyncSession, token: str | None) -> Usuario:
    if not token:
        raise HTTPException(status_code=401, detail="Debes iniciar sesión.")
    usuario = await session.get(Usuario, _token_user_id(token))
    if usuario is None or not usuario.activo:
        raise HTTPException(status_code=401, detail="La cuenta no está disponible.")
    return usuario


async def find_user_by_username(session: AsyncSession, username: str) -> Usuario | None:
    result = await session.exec(select(Usuario).where(Usuario.username == username))
    return result.first()