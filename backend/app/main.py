from fastapi import FastAPI

from app.api import routes_health


def create_app() -> FastAPI:
    app = FastAPI(title="PDF PO Extractor", version="0.1.0")
    app.include_router(routes_health.router)
    return app


app = create_app()
