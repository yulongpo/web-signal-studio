"""In-memory task store: create / get / cancel. No fabricated detections."""

from __future__ import annotations

import threading
import uuid
from datetime import datetime, timezone

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


def create_task(body: TaskCreateRequest) -> TaskCreateResponse:
    """Accept a task request and queue it. Does not run inference or invent candidates."""
    task_id = str(uuid.uuid4())
    now = _now()
    kind = body.kind.strip().lower()
    block_reasons: list[str] = []
    message = "Task accepted into in-memory queue (warmup: no worker execution)."
    status_value = TaskStatus.QUEUED

    # Detection kinds stay explicitly BLOCKED at create-time until a real worker exists.
    if kind.startswith("ffscn") or kind.startswith("scn") or "detect" in kind:
        block_reasons.append(
            "detection worker not implemented in P4-E warmup; refusing to invent candidates"
        )
        status_value = TaskStatus.BLOCKED
        message = "Detection task blocked: no real FFSCN/SCN forward path."

    record = TaskRecord(
        taskId=task_id,
        kind=body.kind,
        status=status_value,
        progress=0.0,
        params=dict(body.params),
        sourcePath=body.sourcePath,
        roi=body.roi,
        blockReasons=block_reasons,
        message=message,
        createdAt=now,
        updatedAt=now,
    )
    with _lock:
        _tasks[task_id] = record
    return TaskCreateResponse(taskId=task_id, status=status_value, message=message)


def get_task(task_id: str) -> TaskRecord:
    with _lock:
        record = _tasks.get(task_id)
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unknown taskId")
    return record


def cancel_task(task_id: str) -> TaskCancelResponse:
    with _lock:
        record = _tasks.get(task_id)
        if record is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unknown taskId")
        if record.status in (TaskStatus.SUCCEEDED, TaskStatus.FAILED, TaskStatus.CANCELLED):
            return TaskCancelResponse(
                taskId=task_id,
                status=record.status,
                message=f"Task already terminal ({record.status.value})",
            )
        updated = record.model_copy(
            update={
                "status": TaskStatus.CANCELLED,
                "updatedAt": _now(),
                "message": "Cancelled by client",
                "progress": record.progress,
            }
        )
        _tasks[task_id] = updated
    return TaskCancelResponse(
        taskId=task_id,
        status=TaskStatus.CANCELLED,
        message="Cancelled by client",
    )


def clear_tasks() -> None:
    """Test helper."""
    with _lock:
        _tasks.clear()
