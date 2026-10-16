"""Turning an uploaded (or generated) .npz file into a stored, validated session."""

import hashlib
import json
import logging
import uuid
from dataclasses import dataclass
from datetime import date
from pathlib import Path
from typing import Any, BinaryIO

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.analysis.dataset import SessionData, load_session
from app.analysis.qc import compute_qc
from app.core.config import get_settings
from app.models import Project, RecordingSession
from app.services import storage

logger = logging.getLogger(__name__)

CHUNK_BYTES = 1024 * 1024


class UploadTooLargeError(Exception):
    pass


@dataclass
class SessionMetadata:
    name: str
    subject: str | None = None
    recording_date: date | None = None
    bin_size_ms: float | None = None
    notes: str = ""
    extra_metadata: dict[str, Any] | None = None
    session_order: int | None = None


def copy_stream(src: BinaryIO, dest: Path, max_bytes: int) -> tuple[int, str]:
    """Copy ``src`` to ``dest`` in chunks, enforcing ``max_bytes``. Returns (size, sha256)."""
    digest = hashlib.sha256()
    size = 0
    with open(dest, "wb") as out:
        while chunk := src.read(CHUNK_BYTES):
            size += len(chunk)
            if size > max_bytes:
                raise UploadTooLargeError
            digest.update(chunk)
            out.write(chunk)
    return size, digest.hexdigest()


def next_session_order(db: Session, project_id: uuid.UUID) -> int:
    current = db.scalar(
        select(func.max(RecordingSession.session_order)).where(
            RecordingSession.project_id == project_id
        )
    )
    return 0 if current is None else current + 1


def write_qc(session_dir: Path, data: SessionData) -> dict[str, Any]:
    qc = compute_qc(data)
    (session_dir / storage.QC_FILENAME).write_text(json.dumps(qc))
    return qc


def create_session_from_file(
    db: Session,
    project: Project,
    session_id: uuid.UUID,
    staged_file: Path,
    meta: SessionMetadata,
    original_filename: str = "",
    sha256: str | None = None,
) -> RecordingSession:
    """Validate ``staged_file`` (already inside the session directory), compute QC and
    insert the database row. Raises ``DatasetValidationError`` on invalid data; the
    caller is responsible for removing the session directory on failure.
    """
    settings = get_settings()
    data = load_session(staged_file, settings.max_uncompressed_bytes)

    rel_dir = storage.session_relpath(project.id, session_id)
    session_dir = storage.resolve(rel_dir)
    raw_path = session_dir / storage.RAW_FILENAME
    if staged_file != raw_path:
        staged_file.replace(raw_path)
    if sha256 is None:
        sha256 = hashlib.sha256(raw_path.read_bytes()).hexdigest()

    qc = write_qc(session_dir, data)
    order = meta.session_order if meta.session_order is not None else next_session_order(db, project.id)

    session = RecordingSession(
        id=session_id,
        project_id=project.id,
        name=meta.name,
        session_order=order,
        subject=meta.subject,
        recording_date=meta.recording_date,
        bin_size_ms=meta.bin_size_ms,
        notes=meta.notes,
        extra_metadata=meta.extra_metadata or {},
        n_samples=data.n_samples,
        n_neurons=data.n_neurons,
        n_outputs=data.n_outputs,
        has_timestamps=data.timestamps is not None,
        has_trial_ids=data.trial_ids is not None,
        has_neuron_ids=data.neuron_ids is not None,
        duration_s=data.duration_s,
        file_path=str(rel_dir / storage.RAW_FILENAME),
        file_size_bytes=raw_path.stat().st_size,
        sha256=sha256,
        original_filename=original_filename[:255],
        qc_summary=qc["summary"],
        warnings=data.warnings,
    )
    db.add(session)
    db.flush()
    logger.info(
        "session_ingested",
        extra={
            "project_id": str(project.id),
            "session_id": str(session_id),
            "n_samples": data.n_samples,
            "n_neurons": data.n_neurons,
            "n_outputs": data.n_outputs,
            "file_size_bytes": session.file_size_bytes,
            "n_warnings": len(data.warnings),
        },
    )
    return session


def load_session_data(session: RecordingSession) -> SessionData:
    """Load a stored session's arrays (re-validated on every load)."""
    return load_session(storage.resolve(session.file_path), get_settings().max_uncompressed_bytes)


def load_qc(session: RecordingSession) -> dict[str, Any]:
    """QC payload for a session; recomputed from the raw file if the cache is missing."""
    session_dir = storage.resolve(Path(session.file_path).parent)
    qc_path = session_dir / storage.QC_FILENAME
    if qc_path.exists():
        return json.loads(qc_path.read_text())
    return write_qc(session_dir, load_session_data(session))
