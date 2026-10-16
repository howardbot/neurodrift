"""Creating, queueing and running cross-session experiments.

``run_experiment`` is the RQ job. It runs in the worker process, opens its own database
session, and records failures on the experiment row so the API never crashes on them.
"""

from __future__ import annotations

import logging
import platform
import time
import uuid
from collections import OrderedDict
from importlib.metadata import PackageNotFoundError, version
from typing import Any

from sqlalchemy.orm import Session

from app import __version__
from app.analysis.cross_session import check_outputs, cross_session_decoding, summarise_matrix
from app.analysis.dataset import SessionData
from app.analysis.decoding import DecoderConfig
from app.core.config import get_settings
from app.db.base import utcnow
from app.db.session import get_sessionmaker
from app.models import Experiment, ExperimentResult, ExperimentStatus, RecordingSession
from app.services import ingest

logger = logging.getLogger(__name__)

QUEUE_NAME = "neurodrift"
CACHE_BUDGET_BYTES = 1024**3  # keep at most ~1 GB of session arrays resident per job


class QueueUnavailableError(RuntimeError):
    pass


def software_versions() -> dict[str, str]:
    versions = {"neurodrift": __version__, "python": platform.python_version()}
    for pkg in ("numpy", "scipy", "scikit-learn"):
        try:
            versions[pkg] = version(pkg)
        except PackageNotFoundError:  # pragma: no cover
            versions[pkg] = "unknown"
    return versions


def decoder_config(config: dict[str, Any]) -> DecoderConfig:
    outputs = config.get("outputs")
    return DecoderConfig(
        kind=config["decoder"],
        alpha=float(config["alpha"]),
        zscore=bool(config["zscore"]),
        outputs=tuple(outputs) if outputs else None,
    )


def validate_sessions(sessions: list[RecordingSession], config: dict[str, Any]) -> None:
    """Raise ``ValueError`` for configurations that cannot work on these sessions."""
    if not sessions:
        raise ValueError("Select at least one session")
    check_outputs([s.n_outputs for s in sessions], decoder_config(config).outputs)


def enqueue(experiment: Experiment) -> None:
    """Hand the experiment to the RQ worker (or run it inline when configured)."""
    settings = get_settings()
    if settings.jobs_inline:
        run_experiment(str(experiment.id))
        return
    from redis import Redis
    from redis.exceptions import RedisError
    from rq import Queue

    try:
        queue = Queue(QUEUE_NAME, connection=Redis.from_url(settings.redis_url))
        job = queue.enqueue(
            "app.services.experiments.run_experiment",
            str(experiment.id),
            job_id=str(experiment.id),
            job_timeout=settings.job_timeout_s,
            result_ttl=24 * 3600,
            failure_ttl=7 * 24 * 3600,
        )
    except RedisError as exc:
        raise QueueUnavailableError(f"Job queue unavailable: {exc}") from exc
    experiment.job_id = job.id


class _SessionCache:
    """LRU cache of loaded sessions, bounded by total array bytes."""

    def __init__(self, sessions: list[RecordingSession], budget: int = CACHE_BUDGET_BYTES):
        self.sessions = sessions
        self.budget = budget
        self.cache: OrderedDict[int, SessionData] = OrderedDict()
        self.loads = 0

    @staticmethod
    def _nbytes(d: SessionData) -> int:
        return int(d.X.nbytes + d.Y.nbytes)

    def __call__(self, index: int) -> SessionData:
        if index in self.cache:
            self.cache.move_to_end(index)
            return self.cache[index]
        data = ingest.load_session_data(self.sessions[index])
        self.loads += 1
        self.cache[index] = data
        while len(self.cache) > 2 and sum(map(self._nbytes, self.cache.values())) > self.budget:
            self.cache.popitem(last=False)
        return data


def _fail(db: Session, experiment: Experiment, message: str) -> None:
    db.rollback()
    experiment.status = ExperimentStatus.failed
    experiment.error_message = message[:2000]
    experiment.finished_at = utcnow()
    db.commit()


def run_experiment(experiment_id: str) -> None:
    """RQ job: compute the cross-session decoder matrix and store it."""
    db = get_sessionmaker()()
    started = time.perf_counter()
    try:
        experiment = db.get(Experiment, uuid.UUID(experiment_id))
        if experiment is None:
            logger.warning("experiment_missing", extra={"experiment_id": experiment_id})
            return
        experiment.status = ExperimentStatus.running
        experiment.started_at = utcnow()
        experiment.progress = 0.0
        experiment.software = software_versions()
        db.commit()
        logger.info(
            "experiment_started",
            extra={"experiment_id": experiment_id, "n_sessions": len(experiment.sessions)},
        )

        try:
            sessions: list[RecordingSession] = []
            for ref in experiment.sessions:
                s = db.get(RecordingSession, uuid.UUID(ref["id"]))
                if s is None:
                    raise ValueError(f"Session '{ref['name']}' no longer exists")
                sessions.append(s)
            validate_sessions(sessions, experiment.config)
            config = decoder_config(experiment.config)
            loader = _SessionCache(sessions)

            def progress(fraction: float) -> None:
                experiment.progress = round(0.99 * fraction, 4)
                db.commit()

            decoder = cross_session_decoding(
                loader,
                len(sessions),
                config,
                train_fraction=float(experiment.config["train_fraction"]),
                progress=progress,
            )
            for ref, info in zip(experiment.sessions, decoder["sessions"], strict=True):
                info.update(id=ref["id"], name=ref["name"])
            summary = {
                "decoder": {k: summarise_matrix(decoder["matrices"][k]) for k in ("mean_r", "mean_r2", "mean_rmse")},
                "n_unavailable": sum(c.get("status") != "ok" for row in decoder["cells"] for c in row),
                "session_loads": loader.loads,
            }
            db.add(ExperimentResult(experiment_id=experiment.id, decoder=decoder, summary=summary))
            experiment.status = ExperimentStatus.completed
            experiment.progress = 1.0
            experiment.finished_at = utcnow()
            db.commit()
            logger.info(
                "experiment_completed",
                extra={
                    "experiment_id": experiment_id,
                    "duration_s": round(time.perf_counter() - started, 2),
                    "session_loads": loader.loads,
                },
            )
        except Exception as exc:
            logger.exception("experiment_failed", extra={"experiment_id": experiment_id})
            _fail(db, experiment, f"{type(exc).__name__}: {exc}")
    finally:
        db.close()
