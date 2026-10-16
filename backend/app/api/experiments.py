import logging
import uuid
from typing import Any, Literal

from fastapi import APIRouter, HTTPException, Response, status
from fastapi.responses import HTMLResponse
from sqlalchemy import select

from app.api.deps import DB, get_project_or_404, get_session_or_404
from app.models import Experiment, ExperimentResult, ExperimentStatus, RecordingSession
from app.schemas import ExperimentCreate, ExperimentOut, ExperimentStatusOut
from app.services import experiments as service
from app.services import exports, report
from app.services.compare import compare_pair

router = APIRouter(tags=["experiments"])
logger = logging.getLogger(__name__)


def get_experiment_or_404(db: DB, experiment_id: uuid.UUID) -> Experiment:
    experiment = db.get(Experiment, experiment_id)
    if experiment is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Experiment not found")
    return experiment


def get_result_or_409(experiment: Experiment) -> ExperimentResult:
    if experiment.status != ExperimentStatus.completed or experiment.result is None:
        raise HTTPException(status.HTTP_409_CONFLICT, f"Experiment is {experiment.status.value}")
    return experiment.result


def enqueue_or_503(db: DB, experiment: Experiment) -> None:
    """Queue the experiment; if the queue is down, record the failure and answer 503."""
    try:
        service.enqueue(experiment)
        db.commit()
    except service.QueueUnavailableError as exc:
        experiment.status = ExperimentStatus.failed
        experiment.error_message = str(exc)
        db.commit()
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, str(exc)) from None


@router.get("/experiments", response_model=list[ExperimentOut])
def list_all_experiments(db: DB) -> list[Experiment]:
    return list(db.scalars(select(Experiment).order_by(Experiment.created_at.desc()).limit(200)))


@router.get("/projects/{project_id}/experiments", response_model=list[ExperimentOut])
def list_experiments(project_id: uuid.UUID, db: DB) -> list[Experiment]:
    return get_project_or_404(db, project_id).experiments


@router.post(
    "/projects/{project_id}/experiments",
    response_model=ExperimentOut,
    status_code=status.HTTP_202_ACCEPTED,
)
def create_experiment(project_id: uuid.UUID, body: ExperimentCreate, db: DB) -> Experiment:
    """Validate the configuration, save the experiment and enqueue it."""
    project = get_project_or_404(db, project_id)
    by_id = {s.id: s for s in project.sessions}
    if body.session_ids is None:
        sessions = list(project.sessions)
    else:
        missing = [str(i) for i in body.session_ids if i not in by_id]
        if missing:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, f"Sessions not in project: {missing}")
        sessions = [by_id[i] for i in body.session_ids]

    config: dict[str, Any] = body.model_dump(include={"decoder", "alpha", "zscore", "n_components", "outputs", "train_fraction"})
    try:
        service.validate_sessions(sessions, config)
    except ValueError as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, str(exc)) from None

    default_name = f"{'Ridge α=' + format(body.alpha, 'g') if body.decoder == 'ridge' else 'OLS'} · {len(sessions)} sessions"
    experiment = Experiment(
        project_id=project.id,
        name=(body.name or "").strip() or default_name,
        status=ExperimentStatus.pending,
        config=config,
        sessions=[{"id": str(s.id), "name": s.name, "session_order": s.session_order} for s in sessions],
        random_seed=body.random_seed,
    )
    db.add(experiment)
    db.commit()
    logger.info(
        "experiment_created",
        extra={"experiment_id": str(experiment.id), "n_sessions": len(sessions), "n_pairs": len(sessions) ** 2},
    )
    enqueue_or_503(db, experiment)
    db.refresh(experiment)
    return experiment


@router.get("/experiments/{experiment_id}", response_model=ExperimentOut)
def get_experiment(experiment_id: uuid.UUID, db: DB) -> Experiment:
    return get_experiment_or_404(db, experiment_id)


@router.get("/experiments/{experiment_id}/status", response_model=ExperimentStatusOut)
def get_experiment_status(experiment_id: uuid.UUID, db: DB) -> Experiment:
    return get_experiment_or_404(db, experiment_id)


@router.get("/experiments/{experiment_id}/matrix")
def get_experiment_matrix(experiment_id: uuid.UUID, db: DB) -> dict[str, Any]:
    result = get_result_or_409(get_experiment_or_404(db, experiment_id))
    return {"decoder": result.decoder, "subspace": result.subspace, "summary": result.summary}


@router.post("/experiments/{experiment_id}/rerun", response_model=ExperimentOut, status_code=status.HTTP_202_ACCEPTED)
def rerun_experiment(experiment_id: uuid.UUID, db: DB) -> Experiment:
    """Reset a failed experiment to pending and queue it again with its stored configuration and seed."""
    experiment = get_experiment_or_404(db, experiment_id)
    if experiment.status != ExperimentStatus.failed:
        raise HTTPException(
            status.HTTP_409_CONFLICT, f"Only failed experiments can be re-run (this one is {experiment.status.value})"
        )
    sessions = [db.get(RecordingSession, uuid.UUID(ref["id"])) for ref in experiment.sessions]
    missing = [ref["name"] for ref, s in zip(experiment.sessions, sessions, strict=True) if s is None]
    if missing:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT,
            f"Sessions no longer exist: {', '.join(missing)}. Create a new experiment instead.",
        )
    try:
        service.validate_sessions([s for s in sessions if s is not None], experiment.config)
    except ValueError as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, str(exc)) from None

    service.reset_for_rerun(db, experiment)
    logger.info("experiment_rerun", extra={"experiment_id": str(experiment.id)})
    enqueue_or_503(db, experiment)
    db.refresh(experiment)
    return experiment


ExportArtifact = Literal[
    "decoder_matrix.csv", "subspace_angles.csv", "session_summary.csv", "experiment_config.json", "all.zip"
]


@router.get(
    "/experiments/{experiment_id}/export/{artifact}",
    response_class=Response,
    responses={200: {"content": {t: {} for t in sorted(set(exports.MEDIA_TYPES.values()))}}},
)
def export_experiment(experiment_id: uuid.UUID, artifact: ExportArtifact, db: DB) -> Response:
    """Download stored results: matrices (rows train, columns test) and session summary as CSV,
    configuration/seed/sessions/versions as JSON, or everything (plus the HTML report) as ZIP."""
    experiment = get_experiment_or_404(db, experiment_id)
    get_result_or_409(experiment)
    metadata = exports.session_metadata(db, experiment)
    if artifact == "all.zip":
        files = exports.export_files(experiment, metadata)
        files["report.html"] = report.render_report(experiment, metadata).encode("utf-8")
        content = exports.zip_bytes(files, folder=exports.download_name(experiment, "export"))
    else:
        try:
            content = exports.export_file(experiment, artifact, metadata)
        except exports.ArtifactUnavailable as exc:
            raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from None
    return Response(
        content,
        media_type=exports.MEDIA_TYPES[artifact],
        headers={"Content-Disposition": f'attachment; filename="{exports.download_name(experiment, artifact)}"'},
    )


@router.get("/experiments/{experiment_id}/report.html", response_class=HTMLResponse)
def experiment_report(experiment_id: uuid.UUID, db: DB, download: bool = False) -> HTMLResponse:
    """Self-contained HTML report (inline CSS and SVG, no external requests)."""
    experiment = get_experiment_or_404(db, experiment_id)
    get_result_or_409(experiment)
    html = report.render_report(experiment, exports.session_metadata(db, experiment))
    disposition = "attachment" if download else "inline"
    return HTMLResponse(
        html,
        headers={
            "Content-Disposition": f'{disposition}; filename="{exports.download_name(experiment, "report.html")}"',
            "Content-Security-Policy": report.REPORT_CSP,
        },
    )


@router.delete("/experiments/{experiment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_experiment(experiment_id: uuid.UUID, db: DB) -> Response:
    experiment = get_experiment_or_404(db, experiment_id)
    if experiment.status == ExperimentStatus.running:
        raise HTTPException(status.HTTP_409_CONFLICT, "Cannot delete a running experiment")
    db.delete(experiment)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/experiments/{experiment_id}/compare/{train_id}/{test_id}")
def compare(experiment_id: uuid.UUID, train_id: uuid.UUID, test_id: uuid.UUID, db: DB) -> dict[str, Any]:
    """Detailed comparison of one train → test pair under this experiment's settings."""
    experiment = get_experiment_or_404(db, experiment_id)
    in_experiment = {ref["id"] for ref in experiment.sessions}
    if str(train_id) not in in_experiment or str(test_id) not in in_experiment:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Session is not part of this experiment")
    train = get_session_or_404(db, train_id)
    test = get_session_or_404(db, test_id)
    return compare_pair(experiment, train, test)
