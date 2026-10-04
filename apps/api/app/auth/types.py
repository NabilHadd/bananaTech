from pydantic import BaseModel


class LoginUsuario(BaseModel):
    id: int
    username: str
    role: str


class LoginResponse(BaseModel):
    token: str
    user: LoginUsuario