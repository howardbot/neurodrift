import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, utcnow

if TYPE_CHECKING:
    from app.models.experiment import Experiment
    from app.models.session import RecordingSession


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text, default="")
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )

    sessions: Mapped[list["RecordingSession"]] = relationship(
        back_populates="project",
        cascade="all, delete-orphan",
        order_by="(RecordingSession.session_order, RecordingSession.created_at)",
    )
    experiments: Mapped[list["Experiment"]] = relationship(
        back_populates="project",
        cascade="all, delete-orphan",
        order_by="Experiment.created_at.desc()",
    )
