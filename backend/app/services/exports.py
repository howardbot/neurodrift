"""Downloadable exports of a completed experiment (CSV, JSON, ZIP).

Everything is built from the stored results; nothing is recomputed. Matrices are
written with rows = training session and columns = test session, in the experiment's
session order and labelled with session names. Cells that could not be computed are
left empty.
"""

from __future__ import annotations

import csv
import io
import json
import math
import uuid
import zipfile
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app import __version__
from app.analysis.cross_session import per_session_summary
from app.db.base import utcnow
from app.models import Experiment, RecordingSession

CSV_TYPE = "text/csv; charset=utf-8"

# Artifact name -> media type. ``all.zip`` bundles the others plus the HTML report.
MEDIA_TYPES: dict[str, str] = {
    "decoder_matrix.csv": CSV_TYPE,
    "subspace_angles.csv": CSV_TYPE,
    "session_summary.csv": CSV_TYPE,
    "experiment_config.json": "application/json",
    "all.zip": "application/zip",
}

SESSION_SUMMARY_COLUMNS = (
    "position",
    "session",
    "session_id",
    "session_order",
    "subject",
    "recording_date",
    "bin_size_ms",
    "n_samples",
    "n_neurons",
    "n_train",
    "n_test",
    "within_r",
    "out_transfer_r",
    "in_transfer_r",
    "within_angle_deg",
    "out_mean_angle_deg",
    "in_mean_angle_deg",
)


class ArtifactUnavailable(LookupError):
    """The experiment has no data for this artifact (e.g. no subspace results)."""


def download_name(experiment: Experiment, artifact: str) -> str:
    """ASCII-only file name for Content-Disposition, unique per experiment."""
    return f"neurodrift-{str(experiment.id)[:8]}-{artifact}"


def iso(value: datetime | None) -> str | None:
    """ISO 8601 in UTC; naive timestamps (SQLite) are stored as UTC."""
    if value is None:
        return None
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc).isoformat()


def session_metadata(db: Session, experiment: Experiment) -> dict[str, RecordingSession]:
    """Current metadata of the experiment's sessions that still exist, keyed by id."""
    ids = [uuid.UUID(ref["id"]) for ref in experiment.sessions]
    rows = db.scalars(select(RecordingSession).where(RecordingSession.id.in_(ids)))
    return {str(s.id): s for s in rows}


def _cell(value: Any) -> str:
    if value is None or isinstance(value, bool):
        return ""
    if isinstance(value, int):
        return str(value)
    if isinstance(value, float):
        return repr(value) if math.isfinite(value) else ""
    return str(value)


def _csv(rows: list[list[Any]]) -> bytes:
    buf = io.StringIO()
    writer = csv.writer(buf, lineterminator="\n")
    for row in rows:
        writer.writerow([_cell(v) for v in row])
    return buf.getvalue().encode("utf-8")


def _round(value: float | None, digits: int) -> float | None:
    return None if value is None else round(value, digits)


def session_names(experiment: Experiment) -> list[str]:
    return [ref["name"] for ref in experiment.sessions]


def matrix_csv(names: list[str], matrix: list[list[Any]], corner: str) -> bytes:
    """Square matrix as CSV: header row = test sessions, first column = training sessions."""
    if len(matrix) != len(names) or any(len(row) != len(names) for row in matrix):
        raise ValueError("matrix shape does not match the session list")
    return _csv([[corner, *names], *([name, *row] for name, row in zip(names, matrix, strict=True))])


def _result(experiment: Experiment):
    if experiment.result is None:
        raise ArtifactUnavailable("Experiment has no stored results")
    return experiment.result


def decoder_matrix_csv(experiment: Experiment) -> bytes:
    """Mean Pearson r (averaged over the selected outputs) for every train → test pair."""
    matrix = _result(experiment).decoder["matrices"]["mean_r"]
    return matrix_csv(session_names(experiment), matrix, "mean_r: train \\ test")


def subspace_angles_csv(experiment: Experiment) -> bytes:
    """Mean principal angle (degrees) between the pair's PCA subspaces."""
    subspace = _result(experiment).subspace
    if not subspace:
        raise ArtifactUnavailable("This experiment was run before subspace analysis was available")
    return matrix_csv(session_names(experiment), subspace["matrices"]["mean_angle"], "mean_angle_deg: train \\ test")


def session_rows(experiment: Experiment, metadata: dict[str, RecordingSession]) -> list[dict[str, Any]]:
    """One row per session in experiment order: metadata, block sizes and transfer means."""
    result = _result(experiment)
    decoder = result.decoder
    angles = result.subspace["matrices"]["mean_angle"] if result.subspace else None
    summary = per_session_summary(decoder["matrices"]["mean_r"], angles)
    rows = []
    for position, (ref, info, stats) in enumerate(
        zip(experiment.sessions, decoder["sessions"], summary, strict=True), start=1
    ):
        meta = metadata.get(ref["id"])
        rows.append(
            {
                "position": position,
                "session": ref["name"],
                "session_id": ref["id"],
                "session_order": ref.get("session_order"),
                "subject": meta.subject if meta else None,
                "recording_date": meta.recording_date.isoformat() if meta and meta.recording_date else None,
                "bin_size_ms": meta.bin_size_ms if meta else None,
                "n_samples": info.get("n_samples"),
                "n_neurons": info.get("n_neurons"),
                "n_train": info.get("n_train"),
                "n_test": info.get("n_test"),
                # Same precision as the stored matrices (r: 6 decimals, angles: 4).
                "within_r": _round(stats["within_r"], 6),
                "out_transfer_r": _round(stats["out_transfer_r"], 6),
                "in_transfer_r": _round(stats["in_transfer_r"], 6),
                "within_angle_deg": _round(stats["within_angle"], 4),
                "out_mean_angle_deg": _round(stats["out_mean_angle"], 4),
                "in_mean_angle_deg": _round(stats["in_mean_angle"], 4),
            }
        )
    return rows


def session_summary_csv(experiment: Experiment, metadata: dict[str, RecordingSession]) -> bytes:
    rows = session_rows(experiment, metadata)
    return _csv([list(SESSION_SUMMARY_COLUMNS), *([row[c] for c in SESSION_SUMMARY_COLUMNS] for row in rows)])


def unavailable_pairs(experiment: Experiment) -> list[dict[str, str]]:
    """Decoder cells that could not be computed, with the reason."""
    names = session_names(experiment)
    cells = _result(experiment).decoder["cells"]
    return [
        {"train": names[i], "test": names[j], "reason": cell.get("reason", "")}
        for i, row in enumerate(cells)
        for j, cell in enumerate(row)
        if cell.get("status") != "ok"
    ]


def experiment_config(experiment: Experiment) -> dict[str, Any]:
    """Everything needed to reproduce the experiment: config, seed, sessions, versions."""
    result = _result(experiment)
    train_fraction = float(experiment.config.get("train_fraction", 0.8))
    return {
        "format": "neurodrift-experiment",
        "format_version": 1,
        "exported_at": iso(utcnow()),
        "exported_by": {"neurodrift": __version__},
        "project": {"id": str(experiment.project_id), "name": experiment.project.name},
        "experiment": {
            "id": str(experiment.id),
            "name": experiment.name,
            "status": experiment.status.value,
            "created_at": iso(experiment.created_at),
            "started_at": iso(experiment.started_at),
            "finished_at": iso(experiment.finished_at),
        },
        "config": experiment.config,
        "random_seed": experiment.random_seed,
        "sessions": experiment.sessions,
        "software": experiment.software,
        "summary": result.summary,
        "unavailable_pairs": unavailable_pairs(experiment),
        "conventions": {
            "matrices": "rows = training session, columns = test session, in the order of 'sessions'; "
            "empty cell = not computed (see 'unavailable_pairs')",
            "split": f"the decoder for row i is trained on the first {train_fraction:.0%} of session i; every "
            f"cell in column j is evaluated on the last {1 - train_fraction:.0%} of session j (contiguous blocks)",
            "decoder_matrix.csv": "mean Pearson r between predicted and actual behaviour, averaged over outputs",
            "subspace_angles.csv": "mean principal angle (degrees) between top-k PCA subspaces fit independently "
            "on the training block of the row session and the test block of the column session, shared neurons only",
            "session_summary.csv": "within = diagonal; out = mean over other sessions as training session (row); "
            "in = mean over other sessions as test session (column)",
        },
    }


def experiment_config_json(experiment: Experiment) -> bytes:
    return (json.dumps(experiment_config(experiment), indent=2, ensure_ascii=False) + "\n").encode("utf-8")


def export_file(experiment: Experiment, artifact: str, metadata: dict[str, RecordingSession]) -> bytes:
    """Bytes of one single-file artifact (not ``all.zip``)."""
    if artifact == "decoder_matrix.csv":
        return decoder_matrix_csv(experiment)
    if artifact == "subspace_angles.csv":
        return subspace_angles_csv(experiment)
    if artifact == "session_summary.csv":
        return session_summary_csv(experiment, metadata)
    if artifact == "experiment_config.json":
        return experiment_config_json(experiment)
    raise ValueError(f"Unknown artifact '{artifact}'")


def export_files(experiment: Experiment, metadata: dict[str, RecordingSession]) -> dict[str, bytes]:
    """All single-file artifacts available for this experiment, by file name."""
    files: dict[str, bytes] = {}
    for artifact in MEDIA_TYPES:
        if artifact == "all.zip":
            continue
        try:
            files[artifact] = export_file(experiment, artifact, metadata)
        except ArtifactUnavailable:
            continue
    return files


def zip_bytes(files: dict[str, bytes], folder: str) -> bytes:
    """Deflate-compressed ZIP with every file under ``folder/``."""
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for name, content in files.items():
            archive.writestr(f"{folder}/{name}", content)
    return buf.getvalue()
