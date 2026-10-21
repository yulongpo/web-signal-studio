"""Pydantic schemas aligned to WEB_NATIVE_PROTOCOL v0.1.0."""

from __future__ import annotations

from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class TaskStatus(str, Enum):
    QUEUED = "queued"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    CANCELLED = "cancelled"
    BLOCKED = "BLOCKED"


# Explicit status machine for cancel reliability + UI clarity.
# Terminal states never leave; cancel always wins over late worker updates.
TERMINAL_STATUSES: frozenset[TaskStatus] = frozenset(
    {
        TaskStatus.CANCELLED,
        TaskStatus.FAILED,
        TaskStatus.SUCCEEDED,
        TaskStatus.BLOCKED,
    }
)

ALLOWED_TRANSITIONS: dict[TaskStatus, frozenset[TaskStatus]] = {
    TaskStatus.QUEUED: frozenset(
        {
            TaskStatus.RUNNING,
            TaskStatus.CANCELLED,
            TaskStatus.FAILED,
            TaskStatus.BLOCKED,
        }
    ),
    TaskStatus.RUNNING: frozenset(
        {
            TaskStatus.RUNNING,  # progress ticks
            TaskStatus.SUCCEEDED,
            TaskStatus.FAILED,
            TaskStatus.CANCELLED,
            TaskStatus.BLOCKED,
        }
    ),
    TaskStatus.SUCCEEDED: frozenset(),
    TaskStatus.FAILED: frozenset(),
    TaskStatus.CANCELLED: frozenset(),
    TaskStatus.BLOCKED: frozenset(),
}


def can_transition(current: TaskStatus, nxt: TaskStatus) -> bool:
    if current == nxt and current == TaskStatus.RUNNING:
        return True
    return nxt in ALLOWED_TRANSITIONS.get(current, frozenset())


class UiMessage(BaseModel):
    """User-facing bilingual copy for the detection page (and other UIs)."""

    code: str = Field(..., description="Stable machine code, e.g. GPU_MISSING")
    severity: str = Field("error", description="info | warning | error")
    en: str = Field(..., description="English UI string")
    zh: str = Field(..., description="Chinese UI string")


class ModelInfo(BaseModel):
    id: str
    path: str | None = None
    sha256: str | None = None
    present: bool = False
    notes: str | None = None


class GpuPrecheck(BaseModel):
    """Structured GPU probe for capabilities / admission (never claims TRT verify)."""

    toolchainVisible: bool = False
    runtimeVerified: bool = False
    name: str | None = None
    driverVersion: str | None = None
    reason: str | None = None
    uiCode: str | None = None


class RuntimePrecheck(BaseModel):
    """Engine/runtime identity. Stub today; real TensorRT never implied."""

    engine: str = "STUB_NON_TENSORRT"
    tensorrtVerified: bool = False
    cudaVerified: bool = False
    canInventResults: bool = False
    modelSearchRoots: list[str] = Field(default_factory=list)
    ffscnPresent: bool = False
    scnPresent: bool = False
    ffscnReady: bool = False
    scnReady: bool = False


class DspCapabilities(BaseModel):
    """DSP side capabilities (placeholders until workers land)."""

    fft: bool = False
    psd: bool = False
    stft: bool = False
    ddc: bool = False
    reasons: list[str] = Field(default_factory=list)


class DetectionCapabilities(BaseModel):
    """True only when a real model + runtime path passes. Never invent availability."""

    ffscn: bool = False
    scn: bool = False
    reasons: list[str] = Field(default_factory=list)
    uiMessages: list[UiMessage] = Field(
        default_factory=list,
        description="Bilingual strings the detection page should display when blocked",
    )


class CapabilitiesResponse(BaseModel):
    protocolVersion: str
    serviceVersion: str
    bindAddressPolicy: str = "loopback-only"
    bindHost: str = "127.0.0.1"
    authRequired: bool = True
    dsp: DspCapabilities
    detection: DetectionCapabilities
    models: list[ModelInfo] = Field(default_factory=list)
    gpu: GpuPrecheck = Field(default_factory=GpuPrecheck)
    runtime: RuntimePrecheck = Field(default_factory=RuntimePrecheck)
    notes: list[str] = Field(default_factory=list)


class SampleRange(BaseModel):
    """Half-open sample range; bounds are decimal strings per protocol."""

    start: str = Field(..., description="Inclusive start sample index as decimal string")
    end: str = Field(..., description="Exclusive end sample index as decimal string")


class TaskCreateRequest(BaseModel):
    """Frozen request snapshot. Sample indices / ranges are decimal strings."""

    kind: str = Field(..., description="e.g. ffscn.detect | scn.detect | dsp.probe")
    params: dict[str, Any] = Field(default_factory=dict)
    sourcePath: str | None = None
    sampleRange: SampleRange | None = None
    sampleIndices: list[str] = Field(default_factory=list)


class TaskCreateResponse(BaseModel):
    runId: str


class EvidenceMeta(BaseModel):
    """Evidence metadata only — no fabricated detection payloads."""

    kind: str | None = None
    path: str | None = None
    sha256: str | None = None
    notes: str | None = None


class TaskRecord(BaseModel):
    runId: str
    kind: str
    status: TaskStatus
    progress: float = 0.0
    request: dict[str, Any] = Field(default_factory=dict)
    result: dict[str, Any] | None = None
    evidence: list[EvidenceMeta] = Field(default_factory=list)
    blockReasons: list[str] = Field(default_factory=list)
    message: str | None = None
    messageZh: str | None = None
    uiMessages: list[UiMessage] = Field(default_factory=list)
    statusHistory: list[str] = Field(
        default_factory=list,
        description="Compact status transition log for cancel/debug clarity",
    )
    createdAt: str
    updatedAt: str


class TaskCancelResponse(BaseModel):
    runId: str
    status: TaskStatus
    message: str | None = None
    messageZh: str | None = None


class ErrorBody(BaseModel):
    """HTTP error shape for the detection page."""

    detail: str | list[Any] | dict[str, Any]
