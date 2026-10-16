import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, utcnow

if TYPE_CHECKING:
    from app.models.project import Project


class ExperimentStatus(str, enum.Enum):
    pending = "pending"
    running = "running"
    completed = "completed"
    failed = "failed"


class Experiment(Base):
    __tablename__ = "experiments"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(200))
    status: Mapped[ExperimentStatus] = mapped_column(
        Enum(ExperimentStatus, name="experiment_status", native_enum=False, length=16),
        default=ExperimentStatus.pending,
    )
    # Analysis parameters (decoder, alpha, zscore, n_components, outputs, train_fraction).
    config: Mapped[dict[str, Any]] = mapped_column(default=dict)
    # Ordered snapshot of the sessions analysed: [{"id", "name", "session_order"}].
    sessions: Mapped[list[Any]] = mapped_column(default=list)
    random_seed: Mapped[int] = mapped_column(Integer, default=42)
    software: Mapped[dict[str, Any]] = mapped_column(default=dict)
    progress: Mapped[float] = mapped_column(Float, default=0.0)
    error_message: Mapped[str | None] = mapped_column(Text)
    job_id: Mapped[str | None] = mapped_column(String(64))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    project: Mapped["Project"] = relationship(back_populates="experiments")
    result: Mapped["ExperimentResult | None"] = relationship(
        back_populates="experiment", cascade="all, delete-orphan", uselist=False
    )


class ExperimentResult(Base):
    __tablename__ = "experiment_results"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    experiment_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("experiments.id", ondelete="CASCADE"), unique=True
    )
    decoder: Mapped[dict[str, Any]] = mapped_column(default=dict)
    subspace: Mapped[dict[str, Any] | None] = mapped_column(default=None)
    summary: Mapped[dict[str, Any]] = mapped_column(default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    experiment: Mapped[Experiment] = relationship(back_populates="result")
