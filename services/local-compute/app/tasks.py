"""In-memory run store: create → {runId}, get, cancel. No fabricated detections."""

from __future__ import annotations

import threading
import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException, status

from .models import (
    TaskCancelResponse,
    TaskCreateRequest,
    TaskCreateResponse,
    TaskRecord,
    TaskStatus,
)

_lock = threading.Lock()
_tasks: dict[str, TaskRecord] = {}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _freeze_request(body: TaskCreateRequest) -> dict[str, Any]:
    """Freeze request snapshot; keep sample indices as decimal strings."""
    for idx in body.sampleIndices:
        if not isinstance(idx, str) or not idx.lstrip("-").isdigit():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"sampleIndices must be decimal strings, got {idx!r}",
            )
    if body.sampleRange is not None:
        for label, val in (("start", body.sampleRange.start), ("end", body.sampleRange.end)):
            if not isinstance(val, str) or not val.lstrip("-").isdigit():
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"sampleRange.{label} must be a decimal string, got {val!r}",
                )
    frozen: dict[str, Any] = {
        "kind": body.kind,
        "params": dict(body.params),
        "sourcePath": body.sourcePath,
        "sampleIndices": list(body.sampleIndices),
    }
    if body.sampleRange is not None:
        frozen["sampleRange"] = {
            "start": body.sampleRange.start,
            "end": body.sampleRange.end,
        }
    return frozen


def create_task(body: TaskCreateRequest) -> TaskCreateResponse:
    run_id = str(uuid.uuid4())
    now = _now()
    frozen = _freeze_request(body)
    kind = body.kind.strip().lower()

    block_reasons: list[str] = []
    status_value = TaskStatus.QUEUED
    message = "Run accepted (warmup: no worker execution)."
    result: dict[str, Any] | None = None

    if kind.startswith("ffscn") or kind.startswith("scn") or "detect" in kind:
        block_reasons.append(
            "BLOCKED: detection worker not implemented; refusing to invent FFSCN/SCN results"
        )
        status_value = TaskStatus.BLOCKED
        message = "Detection run blocked — no real forward path."
        result = None

    record = TaskRecord(
        runId=run_id,
        kind=body.kind,
        status=status_value,
        progress=0.0,
        request=frozen,
        result=result,
        evidence=[],
        blockReasons=block_reasons,
        message=message,
        createdAt=now,
        updatedAt=now,
    )
    with _lock:
        _tasks[run_id] = record
    return TaskCreateResponse(runId=run_id)


def get_task(run_id: str) -> TaskRecord:
    with _lock:
        record = _tasks.get(run_id)
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unknown runId")
    return record


def cancel_task(run_id: str) -> TaskCancelResponse:
    with _lock:
        record = _tasks.get(run_id)
        if record is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unknown runId")
        if record.status in (TaskStatus.SUCCEEDED, TaskStatus.FAILED, TaskStatus.CANCELLED):
            return TaskCancelResponse(
                runId=run_id,
                status=record.status,
                message=f"Run already terminal ({record.status.value})",
            )
        updated = record.model_copy(
            update={
                "status": TaskStatus.CANCELLED,
                "updatedAt": _now(),
                "message": "Cancelled by client",
            }
        )
        _tasks[run_id] = updated
    return TaskCancelResponse(
        runId=run_id,
        status=TaskStatus.CANCELLED,
        message="Cancelled by client",
    )


def clear_tasks() -> None:
    with _lock:
        _tasks.clear()
