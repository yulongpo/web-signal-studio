"""Extra tests: cancel reliability + statusHistory."""

from __future__ import annotations

import time


def _wait_status(client, auth_headers, run_id: str, wanted: set[str], timeout: float = 5.0):
    deadline = time.time() + timeout
    last = None
    while time.time() < deadline:
        last = client.get(f"/tasks/{run_id}", headers=auth_headers).json()
        if last["status"] in wanted:
            return last
        time.sleep(0.05)
    raise AssertionError(f"timed out waiting for {wanted}; last={last}")


def test_detection_task_status_history_and_blocked(client, auth_headers):
    run_id = client.post(
        "/tasks",
        headers=auth_headers,
        json={"kind": "ffscn.detect"},
    ).json()["runId"]
    rec = _wait_status(client, auth_headers, run_id, {"BLOCKED"}, timeout=8.0)
    assert rec["status"] == "BLOCKED"
    assert rec["result"] is None
    hist = rec["statusHistory"]
    assert hist[0] == "queued"
    assert "BLOCKED" in hist
    assert "running" in hist or hist == ["queued", "BLOCKED"]
    notes = " | ".join(e.get("notes") or "" for e in rec.get("evidence") or [])
    assert "STUB_NON_TENSORRT" in notes or "BLOCKED" in notes


def test_cancel_sets_history_and_evidence(client, auth_headers, slow_stub):
    run_id = client.post(
        "/tasks",
        headers=auth_headers,
        json={"kind": "ffscn.detect"},
    ).json()["runId"]
    _wait_status(client, auth_headers, run_id, {"running", "queued"}, timeout=3.0)
    c = client.post(f"/tasks/{run_id}/cancel", headers=auth_headers)
    assert c.json()["status"] == "cancelled"
    rec = client.get(f"/tasks/{run_id}", headers=auth_headers).json()
    assert rec["status"] == "cancelled"
    assert "cancelled" in rec["statusHistory"]
    assert rec["result"] is None
    notes = " | ".join(e.get("notes") or "" for e in rec.get("evidence") or [])
    assert "cancel" in notes.lower() or "cancelled" in notes.lower()


def test_cancel_wins_over_late_blocked(client, auth_headers, slow_stub):
    """After cancel, worker must not flip status to BLOCKED."""
    run_id = client.post(
        "/tasks",
        headers=auth_headers,
        json={"kind": "scn.detect"},
    ).json()["runId"]
    _wait_status(client, auth_headers, run_id, {"running", "queued"}, timeout=3.0)
    client.post(f"/tasks/{run_id}/cancel", headers=auth_headers)
    time.sleep(0.8)
    rec = client.get(f"/tasks/{run_id}", headers=auth_headers).json()
    assert rec["status"] == "cancelled"
    assert rec["result"] is None
    assert "candidates" not in (rec.get("result") or {})


def test_block_reasons_include_gpu_ui_code(client, auth_headers):
    run_id = client.post(
        "/tasks",
        headers=auth_headers,
        json={"kind": "ffscn.detect"},
    ).json()["runId"]
    rec = _wait_status(client, auth_headers, run_id, {"BLOCKED"}, timeout=8.0)
    joined = " | ".join(rec["blockReasons"])
    assert "BLOCKED" in joined
    assert ("gpu.uiCode=" in joined) or ("nvidia" in joined.lower()) or ("GPU" in joined)
