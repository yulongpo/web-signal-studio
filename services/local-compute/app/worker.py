"""In-memory stub worker (NON-TensorRT) with per-runId cancel.

Until real FFSCN/SCN engines exist, detection runs step a labeled stub,
respect cancel bound to the exact runId, and finish as BLOCKED with
no fabricated candidates. Never invents inference outputs.
"""

from __future__ import annotations

import logging
import os
import threading
import time
from typing import Callable

from .models import TaskStatus

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


class RunHandle:
    """Cancel + join handle for one exact runId."""

    def __init__(self, run_id: str) -> None:
        self.run_id = run_id
        self.cancel_event = threading.Event()
        self.thread: threading.Thread | None = None

    def request_cancel(self) -> None:
        self.cancel_event.set()

    def join(self, timeout: float | None = None) -> None:
        if self.thread is not None and self.thread.is_alive():
            self.thread.join(timeout=timeout)


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

    def _run() -> None:
        steps = stub_steps()
        delay = stub_step_ms() / 1000.0
        try:
            apply_update(
                run_id,
                status=TaskStatus.RUNNING,
                progress=0.0,
                message=f"{STUB_ENGINE_LABEL}: worker started (kind={kind})",
                evidence_notes=f"engine={STUB_ENGINE_LABEL}",
            )
            for i in range(steps):
                if handle.cancel_event.is_set():
                    apply_update(
                        run_id,
                        status=TaskStatus.CANCELLED,
                        progress=(i / steps),
                        message="Cancelled by client (exact runId)",
                        clear_result=True,
                    )
                    return
                time.sleep(delay)
                apply_update(
                    run_id,
                    status=TaskStatus.RUNNING,
                    progress=min(0.99, (i + 1) / steps),
                    message=f"{STUB_ENGINE_LABEL}: step {i + 1}/{steps}",
                )

            if handle.cancel_event.is_set():
                apply_update(
                    run_id,
                    status=TaskStatus.CANCELLED,
                    progress=1.0,
                    message="Cancelled by client (exact runId)",
                    clear_result=True,
                )
                return

            if is_detection:
                reasons = list(block_reasons) or [
                    "BLOCKED: stub worker finished without a real FFSCN/SCN engine"
                ]
                if not any("BLOCKED" in r for r in reasons):
                    reasons.insert(0, "BLOCKED: no real detection forward path")
                apply_update(
                    run_id,
                    status=TaskStatus.BLOCKED,
                    progress=1.0,
                    message=(
                        f"{STUB_ENGINE_LABEL}: detection refused — "
                        "no fabricated FFSCN/SCN results"
                    ),
                    block_reasons=reasons,
                    clear_result=True,
                    evidence_notes=(
                        f"engine={STUB_ENGINE_LABEL}; "
                        "result omitted by policy (never invent candidates)"
                    ),
                )
            else:
                apply_update(
                    run_id,
                    status=TaskStatus.SUCCEEDED,
                    progress=1.0,
                    message=f"{STUB_ENGINE_LABEL}: non-detection stub completed",
                    result={
                        "stub": True,
                        "engine": STUB_ENGINE_LABEL,
                        "kind": kind,
                        "notes": "Metadata-only stub; not a detection payload",
                    },
                    evidence_notes=f"engine={STUB_ENGINE_LABEL}; dsp-or-other stub",
                )
        except Exception as exc:  # noqa: BLE001
            log.exception("stub worker failed for %s", run_id)
            apply_update(
                run_id,
                status=TaskStatus.FAILED,
                message=f"{STUB_ENGINE_LABEL}: worker error: {exc}",
                clear_result=True,
            )
        finally:
            drop_handle(run_id)

    t = threading.Thread(
        target=_run,
        name=f"local-compute-stub-{run_id[:8]}",
        daemon=True,
    )
    handle.thread = t
    t.start()
    return handle
