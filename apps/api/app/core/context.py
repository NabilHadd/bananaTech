from strawberry.fastapi import BaseContext

class Context(BaseContext):
    """Lo que reciben los resolvers en `info.context`.

    Hereda de BaseContext porque Strawberry le inyecta ahí `request`,
    `response` y `background_tasks` (útiles para auth y cookies más adelante).
    """

    def __init__(self) -> None:
        super().__init__()


def build_context() -> Context:
    """Aquí se arma el grafo de dependencias."""
    return Context()
