"""Create the synthetic demo project (sessions are written exactly like uploads)."""

import logging
import time
import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.analysis.dataset import save_session
from app.analysis.synthetic import generate_demo_sessions
from app.models import Project
from app.services import ingest, storage

logger = logging.getLogger(__name__)

DEMO_NAME = "Demo — synthetic motor-cortex array"
DEMO_DESCRIPTION = (
    "Six synthetic sessions (days 1–21) of 94–96 Poisson units tuned to 2-D reach velocity. "
    "Tuning drifts as a random walk between sessions with unit turnover; generated with seed 42."
)


def find_demo_project(db: Session) -> Project | None:
    return db.scalar(select(Project).where(Project.is_demo.is_(True)).order_by(Project.created_at))


def create_demo_project(db: Session, seed: int = 42) -> Project:
    started = time.perf_counter()
    project = Project(name=DEMO_NAME, description=DEMO_DESCRIPTION, is_demo=True)
    db.add(project)
    db.flush()
    try:
        for order, demo in enumerate(generate_demo_sessions(seed=seed)):
            session_id = uuid.uuid4()
            session_dir = storage.resolve(storage.session_relpath(project.id, session_id))
            session_dir.mkdir(parents=True)
            raw = session_dir / storage.RAW_FILENAME
            save_session(raw, demo.data)
            meta = ingest.SessionMetadata(
                name=demo.name,
                subject="R1",
                recording_date=demo.recording_date,
                bin_size_ms=demo.bin_size_ms,
                notes=f"Synthetic session, day {demo.day}.",
                extra_metadata={"synthetic": True, "day": demo.day, "seed": seed, **demo.params},
                session_order=order,
            )
            ingest.create_session_from_file(db, project, session_id, raw, meta, f"{demo.name}.npz")
        db.commit()
    except BaseException:
        db.rollback()
        storage.remove_tree(storage.project_relpath(project.id))
        raise
    logger.info(
        "demo_project_created",
        extra={"project_id": str(project.id), "duration_s": round(time.perf_counter() - started, 2)},
    )
    return project
