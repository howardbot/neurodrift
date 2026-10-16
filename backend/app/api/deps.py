"""Shared request dependencies. Authentication, when added, belongs here."""

import uuid
from typing import Annotated

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Project, RecordingSession

DB = Annotated[Session, Depends(get_db)]


def get_project_or_404(db: Session, project_id: uuid.UUID) -> Project:
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found")
    return project


def get_session_or_404(db: Session, session_id: uuid.UUID) -> RecordingSession:
    session = db.get(RecordingSession, session_id)
    if session is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Session not found")
    return session
