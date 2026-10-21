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


class ModelInfo(BaseModel):
    id: str
    path: str | None = None
    sha256: str | None = None
    present: bool = False
    notes: str | None = None


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


class CapabilitiesResponse(BaseModel):
    protocolVersion: str
    serviceVersion: str
    bindAddressPolicy: str = "loopback-only"
    bindHost: str = "127.0.0.1"
    authRequired: bool = True
    dsp: DspCapabilities
    detection: DetectionCapabilities
    models: list[ModelInfo] = Field(default_factory=list)
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
    createdAt: str
    updatedAt: str


class TaskCancelResponse(BaseModel):
    runId: str
    status: TaskStatus
    message: str | None = None
