import logging
import uuid
from typing import Any

from fastapi import APIRouter, HTTPException, Response, status
from sqlalchemy import func, select

from app.api.deps import DB, get_project_or_404
from app.models import Project, RecordingSession
from app.schemas import ProjectCreate, ProjectDetail, ProjectOut, ProjectUpdate
from app.services import storage

router = APIRouter(prefix="/projects", tags=["projects"])
logger = logging.getLogger(__name__)


def latest_experiment(project: Project) -> dict[str, Any] | None:
    if not project.experiments:
        return None
    e = project.experiments[0]
    return {"id": str(e.id), "name": e.name, "status": e.status.value, "created_at": e.created_at.isoformat()}


def _project_out(project: Project, n_sessions: int) -> ProjectOut:
    out = ProjectOut.model_validate(project)
    out.n_sessions = n_sessions
    out.latest_experiment = latest_experiment(project)
    return out


@router.get("", response_model=list[ProjectOut])
def list_projects(db: DB) -> list[ProjectOut]:
    counts = (
        select(RecordingSession.project_id, func.count().label("n"))
        .group_by(RecordingSession.project_id)
        .subquery()
    )
    rows = db.execute(
        select(Project, func.coalesce(counts.c.n, 0))
        .outerjoin(counts, counts.c.project_id == Project.id)
        .order_by(Project.created_at.desc())
    ).all()
    return [_project_out(p, n) for p, n in rows]


@router.post("", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
def create_project(body: ProjectCreate, db: DB) -> ProjectOut:
    project = Project(name=body.name, description=body.description)
    db.add(project)
    db.commit()
    logger.info("project_created", extra={"project_id": str(project.id)})
    return _project_out(project, 0)


@router.get("/{project_id}", response_model=ProjectDetail)
def get_project(project_id: uuid.UUID, db: DB) -> ProjectDetail:
    project = get_project_or_404(db, project_id)
    out = ProjectDetail.model_validate(project)
    out.n_sessions = len(out.sessions)
    out.latest_experiment = latest_experiment(project)
    return out


@router.patch("/{project_id}", response_model=ProjectOut)
def update_project(project_id: uuid.UUID, body: ProjectUpdate, db: DB) -> ProjectOut:
    project = get_project_or_404(db, project_id)
    changes = body.model_dump(exclude_unset=True, exclude_none=True)
    if "name" in changes:
        changes["name"] = changes["name"].strip()
        if not changes["name"]:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "name must not be blank")
    for key, value in changes.items():
        setattr(project, key, value)
    db.commit()
    return _project_out(project, len(project.sessions))


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: uuid.UUID, db: DB) -> Response:
    project = get_project_or_404(db, project_id)
    db.delete(project)
    db.commit()
    storage.remove_tree(storage.project_relpath(project_id))
    logger.info("project_deleted", extra={"project_id": str(project_id)})
    return Response(status_code=status.HTTP_204_NO_CONTENT)
