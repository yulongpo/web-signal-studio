"""In-memory stub worker (NON-TensorRT) with per-runId cancel.

Until real FFSCN/SCN engines exist, detection runs step a labeled stub,
respect cancel bound to the exact runId, and finish as BLOCKED with
no fabricated candidates. Never invents inference outputs.

Cancel reliability: RunHandle.cancel_event is checked between steps;
cancel_task also joins briefly so GET sees a stable terminal state.
"""

from __future__ import annotations

import logging
import os
import threading
import time
from typing import Callable

from .models import TaskStatus, UiMessage

log = logging.getLogger("local-compute.worker")

# Label every stub path so callers never confuse this with TensorRT.
STUB_ENGINE_LABEL = "STUB_NON_TENSORRT"


def stub_step_ms() -> float:
    raw = (os.environ.get("LOCAL_COMPUTE_STUB_STEP_MS") or "50").strip()
    try:
        return max(1.0, float(raw))
    except ValueError:
        return 50.0


def stub_steps() -> int:
    raw = (os.environ.get("LOCAL_COMPUTE_STUB_STEPS") or "8").strip()
    try:
        return max(2, int(raw))
    except ValueError:
        return 8


def cancel_join_timeout_s() -> float:
    raw = (os.environ.get("LOCAL_COMPUTE_CANCEL_JOIN_MS") or "500").strip()
    try:
        return max(0.0, float(raw) / 1000.0)
    except ValueError:
        return 0.5


class RunHandle:
    """Cancel + join handle for one exact runId."""

    def __init__(self, run_id: str) -> None:
        self.run_id = run_id
        self.cancel_event = threading.Event()
        self.thread: threading.Thread | None = None
        self.finished = threading.Event()

    def request_cancel(self) -> None:
        self.cancel_event.set()

    def join(self, timeout: float | None = None) -> bool:
        """Wait for worker thread exit. Returns True if finished."""
        if self.thread is not None and self.thread.is_alive():
            self.thread.join(timeout=timeout)
        if self.finished.is_set():
            return True
        if self.thread is None:
            return True
        return not self.thread.is_alive()


_handles_lock = threading.Lock()
_handles: dict[str, RunHandle] = {}


def get_handle(run_id: str) -> RunHandle | None:
    with _handles_lock:
        return _handles.get(run_id)


def drop_handle(run_id: str) -> None:
    with _handles_lock:
        _handles.pop(run_id, None)


def clear_handles() -> None:
    with _handles_lock:
        for h in list(_handles.values()):
            h.request_cancel()
        _handles.clear()


def start_stub_worker(
    run_id: str,
    *,
    kind: str,
    is_detection: bool,
    block_reasons: list[str],
    apply_update: Callable[..., None],
    ui_messages: list[UiMessage] | None = None,
) -> RunHandle:
    """Start a NON-TensorRT stub thread for this exact runId.

    Detection kinds never succeed with candidates: they end BLOCKED
    (or CANCELLED if cancel wins). DSP/other kinds may succeed with
    metadata-only stub results.
    """
    handle = RunHandle(run_id)
    with _handles_lock:
        old = _handles.get(run_id)
        if old is not None:
            old.request_cancel()
        _handles[run_id] = handle

    ui_msgs = list(ui_messages or [])

    def _run() -> None:
        steps = stub_steps()
        delay = stub_step_ms() / 1000.0
        try:
            apply_update(
                run_id,
                status=TaskStatus.RUNNING,
                progress=0.0,
                message=f"{STUB_ENGINE_LABEL}: worker started (kind={kind})",
                message_zh=f"{STUB_ENGINE_LABEL}: \u5de5\u4f5c\u7ebf\u7a0b\u5df2\u542f\u52a8 (kind={kind})",
                evidence_notes=f"engine={STUB_ENGINE_LABEL}; status=queued->running",
            )
            for i in range(steps):
                if handle.cancel_event.is_set():
                    apply_update(
                        run_id,
                        status=TaskStatus.CANCELLED,
                        progress=(i / steps),
                        message="Cancelled by client (exact runId)",
                        message_zh="\u5df2\u7531\u5ba2\u6237\u7aef\u53d6\u6d88\uff08\u7cbe\u786e runId\uff09",
                        clear_result=True,
                        evidence_notes=(
                            f"engine={STUB_ENGINE_LABEL}; "
                            "cancel observed mid-step; status->cancelled"
                        ),
                    )
                    return
                time.sleep(delay)
                # Re-check immediately after sleep so cancel latency stays low.
                if handle.cancel_event.is_set():
                    apply_update(
                        run_id,
                        status=TaskStatus.CANCELLED,
                        progress=(i / steps),
                        message="Cancelled by client (exact runId)",
                        message_zh="\u5df2\u7531\u5ba2\u6237\u7aef\u53d6\u6d88\uff08\u7cbe\u786e runId\uff09",
                        clear_result=True,
                        evidence_notes=(
                            f"engine={STUB_ENGINE_LABEL}; "
                            "cancel observed after step sleep; status->cancelled"
                        ),
                    )
                    return
                apply_update(
                    run_id,
                    status=TaskStatus.RUNNING,
                    progress=min(0.99, (i + 1) / steps),
                    message=f"{STUB_ENGINE_LABEL}: step {i + 1}/{steps}",
                    message_zh=f"{STUB_ENGINE_LABEL}: \u6b65\u9aa4 {i + 1}/{steps}",
                )

            if handle.cancel_event.is_set():
                apply_update(
                    run_id,
                    status=TaskStatus.CANCELLED,
                    progress=1.0,
                    message="Cancelled by client (exact runId)",
                    message_zh="\u5df2\u7531\u5ba2\u6237\u7aef\u53d6\u6d88\uff08\u7cbe\u786e runId\uff09",
                    clear_result=True,
                    evidence_notes=(
                        f"engine={STUB_ENGINE_LABEL}; "
                        "cancel won before terminal apply; status->cancelled"
                    ),
                )
                return

            if is_detection:
                reasons = list(block_reasons) or [
                    "BLOCKED: stub worker finished without a real FFSCN/SCN engine"
                ]
                if not any("BLOCKED" in r for r in reasons):
                    reasons.insert(0, "BLOCKED: no real detection forward path")
                primary_en = (
                    f"{STUB_ENGINE_LABEL}: detection refused — "
                    "no fabricated FFSCN/SCN results"
                )
                primary_zh = (
                    f"{STUB_ENGINE_LABEL}: \u68c0\u6d4b\u5df2\u62d2\u7edd\u2014\u2014"
                    "\u4e0d\u4f2a\u9020 FFSCN/SCN \u7ed3\u679c"
                )
                if ui_msgs:
                    primary_en = ui_msgs[0].en
                    primary_zh = ui_msgs[0].zh
                apply_update(
                    run_id,
                    status=TaskStatus.BLOCKED,
                    progress=1.0,
                    message=primary_en,
                    message_zh=primary_zh,
                    block_reasons=reasons,
                    ui_messages=ui_msgs,
                    clear_result=True,
                    evidence_notes=(
                        f"engine={STUB_ENGINE_LABEL}; "
                        "result omitted by policy (never invent candidates); "
                        "status->BLOCKED"
                    ),
                )
            else:
                apply_update(
                    run_id,
                    status=TaskStatus.SUCCEEDED,
                    progress=1.0,
                    message=f"{STUB_ENGINE_LABEL}: non-detection stub completed",
                    message_zh=(
                        f"{STUB_ENGINE_LABEL}: "
                        "\u975e\u68c0\u6d4b\u5360\u4f4d\u4efb\u52a1\u5df2\u5b8c\u6210"
                    ),
                    result={
                        "stub": True,
                        "engine": STUB_ENGINE_LABEL,
                        "kind": kind,
                        "notes": "Metadata-only stub; not a detection payload",
                    },
                    evidence_notes=(
                        f"engine={STUB_ENGINE_LABEL}; dsp-or-other stub; "
                        "status->succeeded"
                    ),
                )
        except Exception as exc:  # noqa: BLE001
            log.exception("stub worker failed for %s", run_id)
            apply_update(
                run_id,
                status=TaskStatus.FAILED,
                message=f"{STUB_ENGINE_LABEL}: worker error: {exc}",
                message_zh=f"{STUB_ENGINE_LABEL}: \u5de5\u4f5c\u7ebf\u7a0b\u9519\u8bef: {exc}",
                clear_result=True,
                evidence_notes=f"engine={STUB_ENGINE_LABEL}; status->failed",
            )
        finally:
            handle.finished.set()
            drop_handle(run_id)

    t = threading.Thread(
        target=_run,
        name=f"local-compute-stub-{run_id[:8]}",
        daemon=True,
    )
    handle.thread = t
    t.start()
    return handle


def start_detection_worker(
    run_id: str,
    *,
    kind: str,
    source_path: str | None,
    apply_update: Callable[..., None],
) -> RunHandle:
    """Run real FFSCN/SCN inference when capabilities marked the family ready.

    Still refuses to invent candidates: missing sourcePath or inference errors
    finish as BLOCKED/FAILED with clear reasons.
    """
    handle = RunHandle(run_id)
    with _handles_lock:
        old = _handles.get(run_id)
        if old is not None:
            old.request_cancel()
        _handles[run_id] = handle

    def _run() -> None:
        try:
            apply_update(
                run_id,
                status=TaskStatus.RUNNING,
                progress=0.0,
                message=f"real detection worker started (kind={kind})",
                message_zh=f"真检测工作线程已启动 (kind={kind})",
                evidence_notes="engine=pending-real; status=queued->running",
            )
            if handle.cancel_event.is_set():
                apply_update(
                    run_id,
                    status=TaskStatus.CANCELLED,
                    progress=0.0,
                    message="Cancelled by client (exact runId)",
                    message_zh="已由客户端取消（精确 runId）",
                    clear_result=True,
                    evidence_notes="cancel before inference; status->cancelled",
                )
                return

            from .inference.pipeline import run_detection_inference

            def _progress(p: float, en: str, zh: str) -> None:
                if handle.cancel_event.is_set():
                    return
                apply_update(
                    run_id,
                    status=TaskStatus.RUNNING,
                    progress=min(0.99, float(p)),
                    message=en,
                    message_zh=zh,
                )

            outcome = run_detection_inference(
                kind=kind,
                source_path=source_path,
                cancel_cb=handle.cancel_event.is_set,
                progress_cb=_progress,
            )

            if handle.cancel_event.is_set() or outcome.cancelled:
                apply_update(
                    run_id,
                    status=TaskStatus.CANCELLED,
                    progress=1.0,
                    message="Cancelled by client (exact runId)",
                    message_zh="已由客户端取消（精确 runId）",
                    clear_result=True,
                    evidence_notes="cancel during/after inference; status->cancelled",
                )
                return

            if outcome.ok and outcome.result is not None:
                eng = outcome.result.get("engine", "PYTORCH")
                apply_update(
                    run_id,
                    status=TaskStatus.SUCCEEDED,
                    progress=1.0,
                    message=outcome.message,
                    message_zh=outcome.message_zh,
                    result=outcome.result,
                    evidence_notes=(
                        f"engine={eng}; verifiedForward=true; "
                        f"candidates={outcome.result.get('candidateCount')}; "
                        "status->succeeded"
                    ),
                )
                return

            if outcome.failed:
                apply_update(
                    run_id,
                    status=TaskStatus.FAILED,
                    progress=1.0,
                    message=outcome.message or "detection inference failed",
                    message_zh=outcome.message_zh or "检测推理失败",
                    clear_result=True,
                    block_reasons=list(outcome.reasons),
                    evidence_notes="real inference failed; status->failed",
                )
                return

            # Default: BLOCKED (missing source, load gap, policy)
            from .capabilities import ui_message

            ui_msgs = [ui_message(c) for c in outcome.ui_codes if c]
            apply_update(
                run_id,
                status=TaskStatus.BLOCKED,
                progress=1.0,
                message=outcome.message or "Detection blocked",
                message_zh=outcome.message_zh or "检测不可用",
                block_reasons=list(outcome.reasons) or [
                    "BLOCKED: real detection path refused without verified forward"
                ],
                ui_messages=ui_msgs,
                clear_result=True,
                evidence_notes="real path blocked (no fabricated candidates); status->BLOCKED",
            )
        except Exception as exc:  # noqa: BLE001
            log.exception("detection worker failed for %s", run_id)
            apply_update(
                run_id,
                status=TaskStatus.FAILED,
                message=f"detection worker error: {exc}",
                message_zh=f"检测工作线程错误: {exc}",
                clear_result=True,
                evidence_notes="detection worker exception; status->failed",
            )
        finally:
            handle.finished.set()
            drop_handle(run_id)

    t = threading.Thread(
        target=_run,
        name=f"local-compute-detect-{run_id[:8]}",
        daemon=True,
    )
    handle.thread = t
    t.start()
    return handle

