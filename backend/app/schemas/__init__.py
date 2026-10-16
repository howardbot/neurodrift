"""Pydantic request/response models for the REST API."""

import uuid
from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator

SESSION_NAME_PATTERN = r"^[A-Za-z0-9][A-Za-z0-9_.\- ]{0,99}$"


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# --- Projects -------------------------------------------------------------------------


class ProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str = Field(default="", max_length=5000)

    @field_validator("name")
    @classmethod
    def strip_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("name must not be blank")
        return v


class ProjectUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=5000)


class ProjectOut(ORMModel):
    id: uuid.UUID
    name: str
    description: str
    is_demo: bool
    created_at: datetime
    updated_at: datetime
    n_sessions: int = 0
    latest_experiment: dict[str, Any] | None = None


# --- Sessions -------------------------------------------------------------------------


class SessionMetadataUpdate(BaseModel):
    name: str | None = Field(default=None, pattern=SESSION_NAME_PATTERN)
    session_order: int | None = Field(default=None, ge=0)
    subject: str | None = Field(default=None, max_length=100)
    recording_date: date | None = None
    bin_size_ms: float | None = Field(default=None, gt=0)
    notes: str | None = Field(default=None, max_length=5000)


class SessionOut(ORMModel):
    id: uuid.UUID
    project_id: uuid.UUID
    name: str
    session_order: int
    subject: str | None
    recording_date: date | None
    bin_size_ms: float | None
    notes: str
    extra_metadata: dict[str, Any]
    n_samples: int
    n_neurons: int
    n_outputs: int
    has_timestamps: bool
    has_trial_ids: bool
    has_neuron_ids: bool
    duration_s: float | None
    file_size_bytes: int
    sha256: str
    original_filename: str
    qc_summary: dict[str, Any]
    warnings: list[str]
    created_at: datetime


class ProjectDetail(ProjectOut):
    sessions: list[SessionOut] = []


class HealthOut(BaseModel):
    status: str
    database: str
    version: str
