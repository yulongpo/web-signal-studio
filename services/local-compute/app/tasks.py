"""In-memory run store + stub worker: create/get/cancel.

Cancel is bound to the exact runId. Detection runs use STUB_NON_TENSORRT
and finish as BLOCKED (or CANCELLED) — never fabricate FFSCN/SCN results.
"""

from __future__ import annotations

import threading
import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException, status

from .capabilities import detection_block_reasons_for_kind
from .models import (
    EvidenceMeta,
    TaskCancelResponse,
    TaskCreateRequest,
    TaskCreateResponse,
    TaskRecord,
    TaskStatus,
)
from .worker import clear_handles, get_handle, start_stub_worker

_lock = threading.Lock()
_tasks: dict[str, TaskRecord] = {}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _is_detection_kind(kind: str) -> bool:
    k = kind.strip().lower()
    return (
        k.startswith("ffscn")
        or k.startswith("scn")
        or "detect" in k
        or k.startswith("detection")
    )


def _freeze_request(body: TaskCreateRequest) -> dict[str, Any]:
    """Freeze request snapshot; keep sample indices as decimal strings."""
    for idx in body.sampleIndices:
        if not isinstance(idx, str) or not idx.lstrip("-").isdigit():
            raise HTTPException(
                status_code=422,
                detail=f"sampleIndices must be decimal strings, got {idx!r}",
            )
    if body.sampleRange is not None:
        for label, val in (
            ("start", body.sampleRange.start),
            ("end", body.sampleRange.end),
        ):
            if not isinstance(val, str) or not val.lstrip("-").isdigit():
                raise HTTPException(
                    status_code=422,
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


def _apply_update(
    run_id: str,
    *,
    status: TaskStatus | None = None,
    progress: float | None = None,
    message: str | None = None,
    result: dict[str, Any] | None = None,
    clear_result: bool = False,
    block_reasons: list[str] | None = None,
    evidence_notes: str | None = None,
) -> None:
    with _lock:
        record = _tasks.get(run_id)
        if record is None:
            return
        # Do not resurrect a terminal cancel/fail from a late stub tick,
        # except allowing RUNNING->CANCELLED/BLOCKED/SUCCEEDED/FAILED.
        terminal = {
            TaskStatus.CANCELLED,
            TaskStatus.FAILED,
            TaskStatus.SUCCEEDED,
            TaskStatus.BLOCKED,
        }
        if record.status in terminal and status is not None and status != record.status:
            # Only allow cancel to overwrite non-cancel terminal? No — once
            # cancelled/succeeded/failed/blocked, ignore further worker ticks
            # unless this update is a no-op same status.
            if record.status == TaskStatus.CANCELLED:
                return
            if status == TaskStatus.RUNNING:
                return

        updates: dict[str, Any] = {"updatedAt": _now()}
        if status is not None:
            updates["status"] = status
        if progress is not None:
            updates["progress"] = progress
        if message is not None:
            updates["message"] = message
        if clear_result:
            updates["result"] = None
        elif result is not None:
            # Hard guard: never store fabricated detection payloads.
            banned = {"candidates", "detections", "ffscn", "scn", "boxes"}
            if any(k in result for k in banned):
                updates["result"] = None
                updates["status"] = TaskStatus.BLOCKED
                updates["blockReasons"] = list(record.blockReasons) + [
                    "BLOCKED: refused fabricated detection payload keys"
                ]
            else:
                updates["result"] = result
        if block_reasons is not None:
            updates["blockReasons"] = list(block_reasons)
        if evidence_notes is not None:
            ev = list(record.evidence)
            ev.append(
                EvidenceMeta(
                    kind="stub-worker",
                    notes=evidence_notes,
                )
            )
            updates["evidence"] = ev
        _tasks[run_id] = record.model_copy(update=updates)


def create_task(body: TaskCreateRequest) -> TaskCreateResponse:
    run_id = str(uuid.uuid4())
    now = _now()
    frozen = _freeze_request(body)
    is_det = _is_detection_kind(body.kind)
    block_reasons = detection_block_reasons_for_kind(body.kind) if is_det else []

    record = TaskRecord(
        runId=run_id,
        kind=body.kind,
        status=TaskStatus.QUEUED,
        progress=0.0,
        request=frozen,
        result=None,
        evidence=[],
        blockReasons=list(block_reasons) if is_det else [],
        message="Run accepted; starting STUB_NON_TENSORRT worker",
        createdAt=now,
        updatedAt=now,
    )
    with _lock:
        _tasks[run_id] = record

    start_stub_worker(
        run_id,
        kind=body.kind,
        is_detection=is_det,
        block_reasons=block_reasons,
        apply_update=_apply_update,
    )
    return TaskCreateResponse(runId=run_id)


def get_task(run_id: str) -> TaskRecord:
    with _lock:
        record = _tasks.get(run_id)
    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Unknown runId"
        )
    return record


def cancel_task(run_id: str) -> TaskCancelResponse:
    """Cancel bound to exact runId only (matches upstream detection_worker)."""
    with _lock:
        record = _tasks.get(run_id)
        if record is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Unknown runId"
            )
        if record.status in (
            TaskStatus.SUCCEEDED,
            TaskStatus.FAILED,
            TaskStatus.CANCELLED,
        ):
            return TaskCancelResponse(
                runId=run_id,
                status=record.status,
                message=f"Run already terminal ({record.status.value})",
            )
        # BLOCKED is also terminal for cancel-noop, but in-flight may still
        # be running; if already BLOCKED, report terminal.
        if record.status == TaskStatus.BLOCKED:
            return TaskCancelResponse(
                runId=run_id,
                status=record.status,
                message="Run already terminal (BLOCKED)",
            )
        updated = record.model_copy(
            update={
                "status": TaskStatus.CANCELLED,
                "updatedAt": _now(),
                "message": "Cancelled by client (exact runId)",
                "result": None,
            }
        )
        _tasks[run_id] = updated

    handle = get_handle(run_id)
    if handle is not None:
        handle.request_cancel()

    return TaskCancelResponse(
        runId=run_id,
        status=TaskStatus.CANCELLED,
        message="Cancelled by client (exact runId)",
    )


def clear_tasks() -> None:
    clear_handles()
    with _lock:
        _tasks.clear()
