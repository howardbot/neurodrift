import logging
import uuid
from typing import Any

from fastapi import APIRouter, HTTPException, Response, status
from sqlalchemy import select

from app.api.deps import DB, get_project_or_404, get_session_or_404
from app.models import Experiment, ExperimentStatus
from app.schemas import ExperimentCreate, ExperimentOut, ExperimentStatusOut
from app.services import experiments as service
from app.services.compare import compare_pair

router = APIRouter(tags=["experiments"])
logger = logging.getLogger(__name__)


def get_experiment_or_404(db: DB, experiment_id: uuid.UUID) -> Experiment:
    experiment = db.get(Experiment, experiment_id)
    if experiment is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Experiment not found")
    return experiment


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
    try:
        service.enqueue(experiment)
        db.commit()
    except service.QueueUnavailableError as exc:
        experiment.status = ExperimentStatus.failed
        experiment.error_message = str(exc)
        db.commit()
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, str(exc)) from None
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
    experiment = get_experiment_or_404(db, experiment_id)
    if experiment.status != ExperimentStatus.completed or experiment.result is None:
        raise HTTPException(status.HTTP_409_CONFLICT, f"Experiment is {experiment.status.value}")
    result = experiment.result
    return {"decoder": result.decoder, "subspace": result.subspace, "summary": result.summary}


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
