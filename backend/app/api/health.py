from fastapi import APIRouter
from sqlalchemy import text

from app import __version__
from app.api.deps import DB
from app.schemas import HealthOut

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthOut)
def health(db: DB) -> HealthOut:
    try:
        db.execute(text("SELECT 1"))
        database = "ok"
    except Exception:
        database = "unavailable"
    return HealthOut(status="ok", database=database, version=__version__)
