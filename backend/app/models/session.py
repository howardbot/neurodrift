import uuid
from datetime import date, datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import (
    BigInteger,
    Boolean,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, utcnow

if TYPE_CHECKING:
    from app.models.project import Project


class RecordingSession(Base):
    """One uploaded recording session (named to avoid clashing with ORM sessions)."""

    __tablename__ = "sessions"
    __table_args__ = (UniqueConstraint("project_id", "name", name="uq_sessions_project_name"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(100))
    session_order: Mapped[int] = mapped_column(Integer, default=0)

    # User-supplied metadata.
    subject: Mapped[str | None] = mapped_column(String(100))
    recording_date: Mapped[date | None] = mapped_column(Date)
    bin_size_ms: Mapped[float | None] = mapped_column(Float)
    notes: Mapped[str] = mapped_column(Text, default="")
    extra_metadata: Mapped[dict[str, Any]] = mapped_column(default=dict)

    # Derived from the file at upload time.
    n_samples: Mapped[int] = mapped_column(Integer)
    n_neurons: Mapped[int] = mapped_column(Integer)
    n_outputs: Mapped[int] = mapped_column(Integer)
    has_timestamps: Mapped[bool] = mapped_column(Boolean, default=False)
    has_trial_ids: Mapped[bool] = mapped_column(Boolean, default=False)
    has_neuron_ids: Mapped[bool] = mapped_column(Boolean, default=False)
    duration_s: Mapped[float | None] = mapped_column(Float)

    # Storage. ``file_path`` is relative to DATA_DIR and built only from UUIDs.
    file_path: Mapped[str] = mapped_column(String(500))
    file_size_bytes: Mapped[int] = mapped_column(BigInteger)
    sha256: Mapped[str] = mapped_column(String(64))
    original_filename: Mapped[str] = mapped_column(String(255), default="")

    qc_summary: Mapped[dict[str, Any]] = mapped_column(default=dict)
    warnings: Mapped[list[Any]] = mapped_column(default=list)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    project: Mapped["Project"] = relationship(back_populates="sessions")
