"""projects and sessions

Revision ID: 0001
Revises:
Create Date: 2026-10-16
"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

JSONType = sa.JSON().with_variant(postgresql.JSONB(), "postgresql")


def upgrade() -> None:
    op.create_table(
        "projects",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("is_demo", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "sessions",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "project_id",
            sa.Uuid(),
            sa.ForeignKey("projects.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("session_order", sa.Integer(), nullable=False),
        sa.Column("subject", sa.String(100), nullable=True),
        sa.Column("recording_date", sa.Date(), nullable=True),
        sa.Column("bin_size_ms", sa.Float(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=False),
        sa.Column("extra_metadata", JSONType, nullable=False),
        sa.Column("n_samples", sa.Integer(), nullable=False),
        sa.Column("n_neurons", sa.Integer(), nullable=False),
        sa.Column("n_outputs", sa.Integer(), nullable=False),
        sa.Column("has_timestamps", sa.Boolean(), nullable=False),
        sa.Column("has_trial_ids", sa.Boolean(), nullable=False),
        sa.Column("has_neuron_ids", sa.Boolean(), nullable=False),
        sa.Column("duration_s", sa.Float(), nullable=True),
        sa.Column("file_path", sa.String(500), nullable=False),
        sa.Column("file_size_bytes", sa.BigInteger(), nullable=False),
        sa.Column("sha256", sa.String(64), nullable=False),
        sa.Column("original_filename", sa.String(255), nullable=False),
        sa.Column("qc_summary", JSONType, nullable=False),
        sa.Column("warnings", JSONType, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("project_id", "name", name="uq_sessions_project_name"),
    )
    op.create_index("ix_sessions_project_id", "sessions", ["project_id"])


def downgrade() -> None:
    op.drop_index("ix_sessions_project_id", table_name="sessions")
    op.drop_table("sessions")
    op.drop_table("projects")
