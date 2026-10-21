"""In-memory run store + stub worker: create/get/cancel.

Cancel is bound to the exact runId. Detection runs use STUB_NON_TENSORRT
and finish as BLOCKED (or CANCELLED) — never fabricate FFSCN/SCN results.

Status machine (see models.ALLOWED_TRANSITIONS):
  queued -> running -> {succeeded|failed|cancelled|BLOCKED}
  cancel always wins: CANCELLED is terminal and rejects late worker writes.
"""

from __future__ import annotations

import threading
import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException, status

from .capabilities import (
    detection_block_reasons_for_kind,
    detection_ui_messages_for_kind,
    primary_ui_pair,
)
from .models import (
    TERMINAL_STATUSES,
    EvidenceMeta,
    TaskCancelResponse,
    TaskCreateRequest,
    TaskCreateResponse,
    TaskRecord,
    TaskStatus,
    UiMessage,
    can_transition,
)
from .worker import (
    cancel_join_timeout_s,
    clear_handles,
    get_handle,
)

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


def _append_history(history: list[str], nxt: TaskStatus) -> list[str]:
    label = nxt.value
    if history and history[-1] == label:
        return history
    out = list(history)
    out.append(label)
    # Cap for payload size
    if len(out) > 32:
        out = out[-32:]
    return out


def _apply_update(
    run_id: str,
    *,
    status: TaskStatus | None = None,
    progress: float | None = None,
    message: str | None = None,
    message_zh: str | None = None,
    result: dict[str, Any] | None = None,
    clear_result: bool = False,
    block_reasons: list[str] | None = None,
    ui_messages: list[UiMessage] | None = None,
    evidence_notes: str | None = None,
) -> None:
    with _lock:
        record = _tasks.get(run_id)
        if record is None:
            return

        if status is not None and status != record.status:
            if not can_transition(record.status, status):
                # Cancel (and any terminal) always wins over late worker updates.
                return

        updates: dict[str, Any] = {"updatedAt": _now()}
        if status is not None:
            updates["status"] = status
            updates["statusHistory"] = _append_history(record.statusHistory, status)
        if progress is not None:
            updates["progress"] = progress
        if message is not None:
            updates["message"] = message
        if message_zh is not None:
            updates["messageZh"] = message_zh
        if clear_result:
            updates["result"] = None
        elif result is not None:
            from .torch_runtime import REAL_ENGINE_LABELS

            banned = {"candidates", "detections", "ffscn", "scn", "boxes"}
            verified = bool(result.get("verifiedForward")) and (
                result.get("engine") in REAL_ENGINE_LABELS
            )
            if any(k in result for k in banned) and not verified:
                # Fabricated / unverified detection payload: force BLOCKED.
                if can_transition(record.status, TaskStatus.BLOCKED):
                    updates["result"] = None
                    updates["status"] = TaskStatus.BLOCKED
                    updates["statusHistory"] = _append_history(
                        record.statusHistory, TaskStatus.BLOCKED
                    )
                    updates["message"] = "Blocked: refused fabricated detection payload"
                    updates["messageZh"] = (
                        "\u5df2\u62d2\u7edd\uff1a\u62d2\u7edd\u4f2a\u9020\u68c0\u6d4b\u7ed3\u679c"
                    )
                else:
                    updates["result"] = None
            else:
                updates["result"] = result
        if block_reasons is not None:
            updates["blockReasons"] = list(block_reasons)
        if ui_messages is not None:
            updates["uiMessages"] = list(ui_messages)
        if evidence_notes is not None:
            ev = list(record.evidence)
            ev.append(
                EvidenceMeta(
                    kind="worker",
                    notes=evidence_notes,
                )
            )
            updates["evidence"] = ev
        _tasks[run_id] = record.model_copy(update=updates)


def create_task(body: TaskCreateRequest) -> TaskCreateResponse:
    frozen = _freeze_request(body)
    run_id = str(uuid.uuid4())
    is_detection = _is_detection_kind(body.kind)
    block_reasons = detection_block_reasons_for_kind(body.kind) if is_detection else []
    ui_msgs = detection_ui_messages_for_kind(body.kind) if is_detection else []
    msg_en, msg_zh = primary_ui_pair(ui_msgs) if is_detection else (None, None)

    record = TaskRecord(
        runId=run_id,
        kind=body.kind,
        status=TaskStatus.QUEUED,
        progress=0.0,
        request=frozen,
        result=None,
        evidence=[],
        blockReasons=list(block_reasons),
        message=msg_en or "Queued",
        messageZh=msg_zh or "\u5df2\u5165\u961f",
        uiMessages=list(ui_msgs),
        statusHistory=["queued"],
        createdAt=_now(),
        updatedAt=_now(),
    )
    with _lock:
        _tasks[run_id] = record

    from .capabilities import family_ready
    from .worker import start_detection_worker, start_stub_worker

    if is_detection and family_ready(body.kind):
        start_detection_worker(
            run_id,
            kind=body.kind,
            source_path=body.sourcePath,
            apply_update=_apply_update,
        )
    else:
        start_stub_worker(
            run_id,
            kind=body.kind,
            is_detection=is_detection,
            block_reasons=block_reasons,
            ui_messages=ui_msgs,
            apply_update=_apply_update,
        )
    return TaskCreateResponse(runId=run_id)


def get_task(run_id: str) -> TaskRecord:
    with _lock:
        record = _tasks.get(run_id)
        if record is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Unknown runId: {run_id}",
            )
        return record.model_copy(deep=True)


def cancel_task(run_id: str) -> TaskCancelResponse:
    with _lock:
        record = _tasks.get(run_id)
        if record is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Unknown runId: {run_id}",
            )
        if record.status in TERMINAL_STATUSES:
            return TaskCancelResponse(
                runId=run_id,
                status=record.status,
                message=record.message,
                messageZh=record.messageZh,
            )
        history = _append_history(record.statusHistory, TaskStatus.CANCELLED)
        ev = list(record.evidence)
        ev.append(
            EvidenceMeta(
                kind="cancel",
                notes=(
                    f"client cancel bound to exact runId; "
                    f"prior_status={record.status.value}; status->cancelled"
                ),
            )
        )
        updated = record.model_copy(
            update={
                "status": TaskStatus.CANCELLED,
                "message": "Cancelled by client (exact runId)",
                "messageZh": "\u5df2\u7531\u5ba2\u6237\u7aef\u53d6\u6d88\uff08\u7cbe\u786e runId\uff09",
                "updatedAt": _now(),
                "result": None,
                "statusHistory": history,
                "evidence": ev,
            }
        )
        _tasks[run_id] = updated

    handle = get_handle(run_id)
    if handle is not None:
        handle.request_cancel()
        # Join briefly so subsequent GET observes a stable terminal record
        # and late BLOCKED/SUCCEEDED writes are dropped by the status machine.
        handle.join(timeout=cancel_join_timeout_s())

    return TaskCancelResponse(
        runId=run_id,
        status=TaskStatus.CANCELLED,
        message="Cancelled by client (exact runId)",
        messageZh="\u5df2\u7531\u5ba2\u6237\u7aef\u53d6\u6d88\uff08\u7cbe\u786e runId\uff09",
    )


def clear_tasks() -> None:
    clear_handles()
    with _lock:
        _tasks.clear()
