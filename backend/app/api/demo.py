from fastapi import APIRouter, Response, status

from app.api.deps import DB
from app.schemas import ProjectOut
from app.services.demo import create_demo_project, find_demo_project

router = APIRouter(tags=["demo"])


@router.post("/demo", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
def load_demo(db: DB, response: Response) -> ProjectOut:
    """Return the demo project, creating it on first use (200 if it already existed)."""
    project = find_demo_project(db)
    if project is not None:
        response.status_code = status.HTTP_200_OK
    else:
        project = create_demo_project(db)
    out = ProjectOut.model_validate(project)
    out.n_sessions = len(project.sessions)
    return out
