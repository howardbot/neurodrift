"""experiments and experiment results

Revision ID: 0002
Revises: 0001
Create Date: 2026-10-16
"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0002"
down_revision: str | None = "0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

JSONType = sa.JSON().with_variant(postgresql.JSONB(), "postgresql")


def upgrade() -> None:
    op.create_table(
        "experiments",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "project_id", sa.Uuid(), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
        ),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column(
            "status",
            sa.Enum("pending", "running", "completed", "failed", name="experiment_status", native_enum=False, length=16),
            nullable=False,
        ),
        sa.Column("config", JSONType, nullable=False),
        sa.Column("sessions", JSONType, nullable=False),
        sa.Column("random_seed", sa.Integer(), nullable=False),
        sa.Column("software", JSONType, nullable=False),
        sa.Column("progress", sa.Float(), nullable=False),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("job_id", sa.String(64), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_experiments_project_id", "experiments", ["project_id"])
    op.create_table(
        "experiment_results",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "experiment_id",
            sa.Uuid(),
            sa.ForeignKey("experiments.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
        sa.Column("decoder", JSONType, nullable=False),
        sa.Column("subspace", JSONType, nullable=True),
        sa.Column("summary", JSONType, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("experiment_results")
    op.drop_index("ix_experiments_project_id", table_name="experiments")
    op.drop_table("experiments")
