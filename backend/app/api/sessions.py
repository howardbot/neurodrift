import logging
import uuid
from datetime import date
from pathlib import Path
from typing import Annotated, Any, Literal

from fastapi import APIRouter, File, Form, HTTPException, Query, Request, Response, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError

from app.analysis.dataset import DatasetValidationError
from app.analysis.decoding import DecoderConfig, evaluate_within_session
from app.api.deps import DB, get_project_or_404, get_session_or_404
from app.core.config import get_settings
from app.models import RecordingSession
from app.schemas import SESSION_NAME_PATTERN, SessionMetadataUpdate, SessionOut
from app.services import ingest, storage

router = APIRouter(tags=["sessions"])
logger = logging.getLogger(__name__)


@router.get("/projects/{project_id}/sessions", response_model=list[SessionOut])
def list_sessions(project_id: uuid.UUID, db: DB) -> list[RecordingSession]:
    return get_project_or_404(db, project_id).sessions


def _name_taken(db: DB, project_id: uuid.UUID, name: str, exclude: uuid.UUID | None = None) -> bool:
    query = select(RecordingSession.id).where(
        RecordingSession.project_id == project_id, RecordingSession.name == name
    )
    if exclude is not None:
        query = query.where(RecordingSession.id != exclude)
    return db.scalar(query) is not None


@router.post(
    "/projects/{project_id}/sessions",
    response_model=SessionOut,
    status_code=status.HTTP_201_CREATED,
)
def upload_session(
    project_id: uuid.UUID,
    request: Request,
    db: DB,
    file: Annotated[UploadFile, File(description="Session file (.npz with X and Y)")],
    name: Annotated[str, Form(pattern=SESSION_NAME_PATTERN)],
    subject: Annotated[str | None, Form(max_length=100)] = None,
    recording_date: Annotated[date | None, Form()] = None,
    bin_size_ms: Annotated[float | None, Form(gt=0)] = None,
    notes: Annotated[str, Form(max_length=5000)] = "",
) -> RecordingSession:
    settings = get_settings()
    project = get_project_or_404(db, project_id)
    name = name.strip()

    declared = request.headers.get("content-length")
    if declared and declared.isdigit() and int(declared) > settings.max_upload_bytes + 1024 * 1024:
        raise HTTPException(
            status.HTTP_413_CONTENT_TOO_LARGE, f"Upload exceeds {settings.max_upload_mb} MB"
        )
    if not (file.filename or "").lower().endswith(".npz"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Only .npz files are supported")
    n_existing = db.scalar(
        select(func.count()).select_from(RecordingSession).where(RecordingSession.project_id == project_id)
    )
    if (n_existing or 0) >= settings.max_sessions_per_project:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"Projects are limited to {settings.max_sessions_per_project} sessions",
        )
    if _name_taken(db, project_id, name):
        raise HTTPException(status.HTTP_409_CONFLICT, f"A session named '{name}' already exists")

    session_id = uuid.uuid4()
    rel_dir = storage.session_relpath(project_id, session_id)
    session_dir = storage.resolve(rel_dir)
    session_dir.mkdir(parents=True, exist_ok=False)
    staged = session_dir / (storage.RAW_FILENAME + ".part")
    try:
        try:
            _, sha256 = ingest.copy_stream(file.file, staged, settings.max_upload_bytes)
        except ingest.UploadTooLargeError:
            raise HTTPException(
                status.HTTP_413_CONTENT_TOO_LARGE, f"Upload exceeds {settings.max_upload_mb} MB"
            ) from None
        meta = ingest.SessionMetadata(
            name=name,
            subject=subject.strip() if subject else None,
            recording_date=recording_date,
            bin_size_ms=bin_size_ms,
            notes=notes,
        )
        try:
            session = ingest.create_session_from_file(
                db, project, session_id, staged, meta, Path(file.filename or "").name, sha256
            )
            db.commit()
        except DatasetValidationError as exc:
            logger.info(
                "session_upload_rejected",
                extra={"project_id": str(project_id), "errors": exc.errors},
            )
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_CONTENT,
                {"message": "The uploaded file is not a valid session.", "errors": exc.errors},
            ) from None
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status.HTTP_409_CONFLICT, f"A session named '{name}' already exists"
            ) from None
    except BaseException:
        storage.remove_tree(rel_dir)
        raise
    return session


@router.get("/sessions/{session_id}", response_model=SessionOut)
def get_session(session_id: uuid.UUID, db: DB) -> RecordingSession:
    return get_session_or_404(db, session_id)


@router.patch("/sessions/{session_id}", response_model=SessionOut)
def update_session(session_id: uuid.UUID, body: SessionMetadataUpdate, db: DB) -> RecordingSession:
    session = get_session_or_404(db, session_id)
    changes = body.model_dump(exclude_unset=True)
    if "name" in changes:
        if changes["name"] is None:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "name must not be null")
        changes["name"] = changes["name"].strip()
        if _name_taken(db, session.project_id, changes["name"], exclude=session.id):
            raise HTTPException(
                status.HTTP_409_CONFLICT, f"A session named '{changes['name']}' already exists"
            )
    if changes.get("notes", "") is None:
        changes["notes"] = ""
    if "session_order" in changes and changes["session_order"] is None:
        del changes["session_order"]
    for key, value in changes.items():
        setattr(session, key, value)
    db.commit()
    return session


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(session_id: uuid.UUID, db: DB) -> Response:
    session = get_session_or_404(db, session_id)
    rel_dir = Path(session.file_path).parent
    db.delete(session)
    db.commit()
    storage.remove_tree(rel_dir)
    logger.info("session_deleted", extra={"session_id": str(session_id)})
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/sessions/{session_id}/qc")
def get_session_qc(session_id: uuid.UUID, db: DB) -> dict[str, Any]:
    session = get_session_or_404(db, session_id)
    return ingest.load_qc(session)


@router.get("/sessions/{session_id}/decode")
def decode_session(
    session_id: uuid.UUID,
    db: DB,
    decoder: Literal["ridge", "linear"] = "ridge",
    alpha: Annotated[float, Query(gt=0, le=1e6)] = 1.0,
    zscore: bool = True,
    outputs: Annotated[list[int] | None, Query()] = None,
    train_fraction: Annotated[float, Query(ge=0.5, le=0.95)] = 0.8,
) -> dict[str, Any]:
    """Within-session decoding: train on the first ``train_fraction`` of bins, test on
    the remaining contiguous block (no shuffling)."""
    session = get_session_or_404(db, session_id)
    if outputs is not None:
        outputs = sorted(set(outputs))
        bad = [o for o in outputs if not 0 <= o < session.n_outputs]
        if bad or not outputs:
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_CONTENT,
                f"outputs must be indices in [0, {session.n_outputs - 1}]",
            )
    config = DecoderConfig(
        kind=decoder, alpha=alpha, zscore=zscore, outputs=tuple(outputs) if outputs else None
    )
    data = ingest.load_session_data(session)
    try:
        return evaluate_within_session(data, config, train_fraction=train_fraction)
    except ValueError as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, str(exc)) from None
