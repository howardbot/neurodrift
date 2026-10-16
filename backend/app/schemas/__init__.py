"""Pydantic request/response models for the REST API."""

import uuid
from datetime import date, datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.experiment import ExperimentStatus

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


# --- Experiments ----------------------------------------------------------------------


class ExperimentCreate(BaseModel):
    name: str | None = Field(default=None, max_length=200)
    session_ids: list[uuid.UUID] | None = Field(
        default=None, description="Sessions to include, in analysis order; default: all, by session_order"
    )
    decoder: Literal["ridge", "linear"] = "ridge"
    alpha: float = Field(default=1.0, gt=0, le=1e6)
    zscore: bool = True
    n_components: Literal[3, 5, 10, 20] = 10
    outputs: list[int] | None = Field(default=None, min_length=1)
    train_fraction: float = Field(default=0.8, ge=0.5, le=0.95)
    random_seed: int = Field(default=42, ge=0, le=2**32 - 1)

    @field_validator("outputs")
    @classmethod
    def unique_sorted(cls, v: list[int] | None) -> list[int] | None:
        if v is None:
            return None
        if any(o < 0 for o in v):
            raise ValueError("output indices must be non-negative")
        return sorted(set(v))

    @field_validator("session_ids")
    @classmethod
    def unique_sessions(cls, v: list[uuid.UUID] | None) -> list[uuid.UUID] | None:
        if v is not None and len(set(v)) != len(v):
            raise ValueError("session_ids contains duplicates")
        return v


class ExperimentOut(ORMModel):
    id: uuid.UUID
    project_id: uuid.UUID
    name: str
    status: ExperimentStatus
    config: dict[str, Any]
    sessions: list[dict[str, Any]]
    random_seed: int
    software: dict[str, Any]
    progress: float
    error_message: str | None
    created_at: datetime
    started_at: datetime | None
    finished_at: datetime | None


class ExperimentStatusOut(BaseModel):
    id: uuid.UUID
    status: ExperimentStatus
    progress: float
    error_message: str | None
