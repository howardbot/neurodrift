"""Filesystem layout for uploaded and derived data.

All paths are built from UUIDs only; user-supplied filenames never reach the
filesystem. Paths stored in the database are relative to ``DATA_DIR``.
"""

import shutil
import uuid
from pathlib import Path

from app.core.config import get_settings

RAW_FILENAME = "raw.npz"
QC_FILENAME = "qc.json"


def data_root() -> Path:
    root = get_settings().data_dir.resolve()
    root.mkdir(parents=True, exist_ok=True)
    return root


def project_relpath(project_id: uuid.UUID) -> Path:
    return Path("projects") / str(uuid.UUID(str(project_id)))


def session_relpath(project_id: uuid.UUID, session_id: uuid.UUID) -> Path:
    return project_relpath(project_id) / "sessions" / str(uuid.UUID(str(session_id)))


def resolve(relpath: str | Path) -> Path:
    """Absolute path for a stored relative path, refusing anything outside DATA_DIR."""
    root = data_root()
    path = (root / relpath).resolve()
    if not path.is_relative_to(root):
        raise ValueError(f"Path escapes data directory: {relpath}")
    return path


def remove_tree(relpath: str | Path) -> None:
    path = resolve(relpath)
    if path != data_root():
        shutil.rmtree(path, ignore_errors=True)
