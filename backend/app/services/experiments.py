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
from app.analysis.cross_session import (
    check_outputs,
    cross_session_decoding,
    cross_session_subspaces,
    summarise_matrix,
)
from app.analysis.dataset import SessionData
from app.analysis.decoding import DecoderConfig
from app.analysis.preprocessing import contiguous_split
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
    too_short = []
    for s in sessions:
        try:
            contiguous_split(s.n_samples, float(config["train_fraction"]))
        except ValueError:
            too_short.append(f"{s.name} ({s.n_samples} bins)")
    if too_short:
        raise ValueError(
            "Too few time bins for a train/test split in: " + ", ".join(too_short)
            + ". Each block needs at least 5 bins."
        )


def _queue():
    from redis import Redis
    from rq import Queue

    return Queue(QUEUE_NAME, connection=Redis.from_url(get_settings().redis_url))


def enqueue(experiment: Experiment) -> None:
    """Hand the experiment to the RQ worker (or run it inline when configured)."""
    settings = get_settings()
    if settings.jobs_inline:
        run_experiment(str(experiment.id))
        return
    from redis.exceptions import RedisError
    from rq.job import Job

    try:
        queue = _queue()
        # A re-run reuses the experiment id as job id: drop the previous, finished job first.
        if Job.exists(str(experiment.id), connection=queue.connection):
            Job.fetch(str(experiment.id), connection=queue.connection).delete()
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


def reset_for_rerun(db: Session, experiment: Experiment) -> None:
    """Return a failed experiment to ``pending`` with its stored configuration and seed.

    Clears the error, progress, timestamps and any stored result so the job starts from
    scratch. The caller enqueues it afterwards.
    """
    if experiment.result is not None:
        db.delete(experiment.result)
    experiment.status = ExperimentStatus.pending
    experiment.progress = 0.0
    experiment.error_message = None
    experiment.started_at = None
    experiment.finished_at = None
    experiment.job_id = None
    db.commit()


def recover_orphaned_experiments() -> int:
    """Re-queue experiments whose job no longer exists or was interrupted.

    Called when the worker starts. With a single worker, nothing can legitimately be
    running at that moment, so ``running`` rows were interrupted (e.g. the container was
    killed). ``pending`` rows whose job is missing from Redis (e.g. Redis restarted
    before the worker picked the job up) would otherwise wait forever. The analysis is
    deterministic given its stored configuration and seed, so re-running is safe.
    """
    from rq.job import Job

    queue = _queue()
    db = get_sessionmaker()()
    recovered = 0
    try:
        stuck = db.query(Experiment).filter(
            Experiment.status.in_([ExperimentStatus.pending, ExperimentStatus.running])
        )
        for experiment in stuck:
            job_id = str(experiment.id)
            if experiment.status == ExperimentStatus.pending and job_id in queue.job_ids:
                continue
            if Job.exists(job_id, connection=queue.connection):
                Job.fetch(job_id, connection=queue.connection).delete()
            experiment.status = ExperimentStatus.pending
            experiment.progress = 0.0
            experiment.started_at = None
            db.commit()
            enqueue(experiment)
            db.commit()
            recovered += 1
            logger.warning("experiment_requeued", extra={"experiment_id": job_id})
    finally:
        db.close()
    return recovered


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

            train_fraction = float(experiment.config["train_fraction"])

            def progress(offset: float):
                def update(fraction: float) -> None:
                    experiment.progress = round(0.99 * (offset + 0.5 * fraction), 4)
                    db.commit()

                return update

            decoder = cross_session_decoding(
                loader, len(sessions), config, train_fraction=train_fraction, progress=progress(0.0)
            )
            subspace = cross_session_subspaces(
                loader,
                len(sessions),
                n_components=int(experiment.config["n_components"]),
                zscore=bool(experiment.config["zscore"]),
                train_fraction=train_fraction,
                seed=experiment.random_seed,
                progress=progress(0.5),
            )
            for ref, info in zip(experiment.sessions, decoder["sessions"], strict=True):
                info.update(id=ref["id"], name=ref["name"])
            summary = {
                "decoder": {k: summarise_matrix(decoder["matrices"][k]) for k in ("mean_r", "mean_r2", "mean_rmse")},
                "subspace": {k: summarise_matrix(subspace["matrices"][k]) for k in ("mean_angle", "alignment_index")},
                "n_unavailable": sum(c.get("status") != "ok" for row in decoder["cells"] for c in row),
                "session_loads": loader.loads,
            }
            db.add(
                ExperimentResult(experiment_id=experiment.id, decoder=decoder, subspace=subspace, summary=summary)
            )
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
