import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import __version__
from app.api import demo, health, projects, sessions
from app.core.config import get_settings
from app.core.logging import configure_logging


def create_app() -> FastAPI:
    settings = get_settings()
    configure_logging(settings.log_level)

    app = FastAPI(
        title="NeuroDrift API",
        version=__version__,
        description="Cross-session neural representation drift and decoder generalisation.",
        docs_url="/api/docs",
        redoc_url=None,
        openapi_url="/api/openapi.json",
        debug=False,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_methods=["GET", "POST", "PATCH", "DELETE"],
        allow_headers=["Content-Type"],
    )
    for module in (health, projects, sessions, demo):
        app.include_router(module.router, prefix="/api")

    logging.getLogger(__name__).info(
        "app_started", extra={"environment": settings.environment, "version": __version__}
    )
    return app


app = create_app()
