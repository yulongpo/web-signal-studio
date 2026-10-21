"""Pydantic schemas for local-compute API."""

from __future__ import annotations

from enum import Enum
from typing import Any, Literal

from pydantic import BaseModel, Field


class BackendStatus(str, Enum):
    AVAILABLE = "available"
    BLOCKED = "BLOCKED"


class TaskStatus(str, Enum):
    QUEUED = "queued"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    CANCELLED = "cancelled"
    BLOCKED = "BLOCKED"


class ModelInfo(BaseModel):
    id: str
    path: str | None = None
    sha256: str | None = None
    present: bool = False
    notes: str | None = None


class DetectionBackend(BaseModel):
    name: str
    status: BackendStatus
    blockReasons: list[str] = Field(default_factory=list)
    models: list[ModelInfo] = Field(default_factory=list)
    # Explicit label so nothing looks like a silent mock production path
    productionEligible: bool = False


class GpuStatus(BaseModel):
    available: bool
    vendor: str | None = None
    name: str | None = None
    cudaAvailable: bool = False
    details: str | None = None


class CapabilitiesResponse(BaseModel):
    service: str = "web-signal-studio-local-compute"
    version: str
    bindAddressPolicy: Literal["loopback-only"] = "loopback-only"
    bindHost: str = "127.0.0.1"
    authRequired: bool = True
    detectionBackends: list[DetectionBackend]
    gpu: GpuStatus
    notes: list[str] = Field(default_factory=list)


class TaskCreateRequest(BaseModel):
    """Placeholder create body. Inference is not executed in this warmup."""

    kind: str = Field(
        ...,
        description="Task kind, e.g. ffscn.detect | scn.detect | probe.capabilities",
    )
    params: dict[str, Any] = Field(default_factory=dict)
    # Clients may send ROI / path hints; service stores them without inventing results.
    sourcePath: str | None = None
    roi: dict[str, Any] | None = None


class TaskCreateResponse(BaseModel):
    taskId: str
    status: TaskStatus
    message: str | None = None


class TaskRecord(BaseModel):
    taskId: str
    kind: str
    status: TaskStatus
    progress: float = 0.0
    params: dict[str, Any] = Field(default_factory=dict)
    sourcePath: str | None = None
    roi: dict[str, Any] | None = None
    # Intentionally no detectionCandidates / fake FFSCN payloads
    blockReasons: list[str] = Field(default_factory=list)
    message: str | None = None
    createdAt: str
    updatedAt: str


class TaskCancelResponse(BaseModel):
    taskId: str
    status: TaskStatus
    message: str | None = None
