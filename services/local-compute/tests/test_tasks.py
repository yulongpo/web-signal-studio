"""Task create/get/cancel — runId, decimal strings, cancel in-flight, no fake FFSCN."""

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


def test_create_returns_run_id(client, auth_headers):
    r = client.post(
        "/tasks",
        headers=auth_headers,
        json={
            "kind": "dsp.probe",
            "sampleRange": {"start": "0", "end": "1024"},
            "sampleIndices": ["0", "512"],
        },
    )
    assert r.status_code == 200
    body = r.json()
    assert set(body.keys()) == {"runId"}
    run_id = body["runId"]
    g = client.get(f"/tasks/{run_id}", headers=auth_headers)
    assert g.status_code == 200
    rec = g.json()
    assert rec["runId"] == run_id
    assert rec["request"]["sampleRange"]["start"] == "0"
    assert rec["request"]["sampleIndices"] == ["0", "512"]
    assert "detectionCandidates" not in rec
    assert rec.get("result") in (None, {}) or (
        isinstance(rec.get("result"), dict)
        and "candidates" not in rec["result"]
    )


def test_detection_task_blocked_no_fabricated_results(client, auth_headers):
    r = client.post(
        "/tasks",
        headers=auth_headers,
        json={"kind": "ffscn.detect", "sampleRange": {"start": "10", "end": "20"}},
    )
    assert r.status_code == 200
    run_id = r.json()["runId"]
    rec = _wait_status(
        client, auth_headers, run_id, {"BLOCKED", "cancelled", "failed"}, timeout=8.0
    )
    assert rec["status"] == "BLOCKED"
    assert rec["result"] is None
    assert any("BLOCKED" in x for x in rec["blockReasons"])
    assert "candidates" not in (rec.get("result") or {})
    assert rec["status"] != "cancelled"
    assert rec["status"] != "succeeded"


def test_reject_non_decimal_sample_index(client, auth_headers):
    r = client.post(
        "/tasks",
        headers=auth_headers,
        json={"kind": "dsp.probe", "sampleIndices": ["1.5"]},
    )
    assert r.status_code == 422


def test_create_get_cancel_queued_or_running(client, auth_headers, slow_stub):
    run_id = client.post(
        "/tasks",
        headers=auth_headers,
        json={"kind": "dsp.probe"},
    ).json()["runId"]
    c = client.post(f"/tasks/{run_id}/cancel", headers=auth_headers)
    assert c.status_code == 200
    assert c.json()["status"] == "cancelled"
    assert c.json()["runId"] == run_id
    assert (
        client.get(f"/tasks/{run_id}", headers=auth_headers).json()["status"]
        == "cancelled"
    )


def test_cancel_in_flight_detection_job(client, auth_headers, slow_stub):
    run_id = client.post(
        "/tasks",
        headers=auth_headers,
        json={
            "kind": "ffscn.detect",
            "sampleRange": {"start": "0", "end": "100"},
            "sampleIndices": ["0", "50"],
        },
    ).json()["runId"]

    rec = _wait_status(
        client, auth_headers, run_id, {"running", "queued"}, timeout=3.0
    )
    assert rec["status"] in ("running", "queued")

    c = client.post(f"/tasks/{run_id}/cancel", headers=auth_headers)
    assert c.status_code == 200
    assert c.json()["runId"] == run_id
    assert c.json()["status"] == "cancelled"

    final = client.get(f"/tasks/{run_id}", headers=auth_headers).json()
    assert final["status"] == "cancelled"
    assert final["result"] is None
    assert "candidates" not in (final.get("result") or {})
    assert final["status"] not in ("BLOCKED", "succeeded", "failed")


def test_cancel_bound_to_exact_run_id(client, auth_headers, slow_stub):
    a = client.post(
        "/tasks", headers=auth_headers, json={"kind": "ffscn.detect"}
    ).json()["runId"]
    b = client.post(
        "/tasks", headers=auth_headers, json={"kind": "scn.detect"}
    ).json()["runId"]
    assert a != b
    client.post(f"/tasks/{a}/cancel", headers=auth_headers)
    ra = client.get(f"/tasks/{a}", headers=auth_headers).json()
    rb = client.get(f"/tasks/{b}", headers=auth_headers).json()
    assert ra["status"] == "cancelled"
    assert rb["status"] != "cancelled"


def test_decimal_string_sample_range_preserved(client, auth_headers):
    run_id = client.post(
        "/tasks",
        headers=auth_headers,
        json={
            "kind": "dsp.probe",
            "sampleRange": {"start": "9007199254740993", "end": "9007199254741093"},
            "sampleIndices": ["9007199254740993"],
        },
    ).json()["runId"]
    rec = client.get(f"/tasks/{run_id}", headers=auth_headers).json()
    assert rec["request"]["sampleRange"]["start"] == "9007199254740993"
    assert rec["request"]["sampleIndices"] == ["9007199254740993"]


def test_unknown_run_404(client, auth_headers):
    assert client.get("/tasks/does-not-exist", headers=auth_headers).status_code == 404


def test_cancel_unknown_run_404(client, auth_headers):
    assert (
        client.post("/tasks/does-not-exist/cancel", headers=auth_headers).status_code
        == 404
    )


def test_scn_detection_never_fabricates_payload(client, auth_headers):
    run_id = client.post(
        "/tasks",
        headers=auth_headers,
        json={"kind": "scn.detect"},
    ).json()["runId"]
    rec = _wait_status(client, auth_headers, run_id, {"BLOCKED"}, timeout=8.0)
    assert rec["result"] is None
    blob = str(rec)
    assert "detectionCandidates" not in blob
    for banned in ("fakeScore", "hallucinated", "tensorrt_output"):
        assert banned not in blob
