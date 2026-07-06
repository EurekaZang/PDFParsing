from fastapi import FastAPI

from app.api import routes_auth, routes_excel, routes_files, routes_health


def create_app() -> FastAPI:
    app = FastAPI(title="PDF PO Extractor", version="0.1.0")
    app.include_router(routes_health.router)
    app.include_router(routes_auth.router)
    app.include_router(routes_files.router)
    app.include_router(routes_excel.router)
    return app


app = create_app()
