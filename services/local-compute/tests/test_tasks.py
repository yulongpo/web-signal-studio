"""Task create/get/cancel — runId, decimal strings, no fake FFSCN results."""

from __future__ import annotations


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
    assert rec.get("result") in (None, {})


def test_detection_task_blocked_no_fabricated_results(client, auth_headers):
    r = client.post(
        "/tasks",
        headers=auth_headers,
        json={"kind": "ffscn.detect", "sampleRange": {"start": "10", "end": "20"}},
    )
    assert r.status_code == 200
    run_id = r.json()["runId"]
    rec = client.get(f"/tasks/{run_id}", headers=auth_headers).json()
    assert rec["status"] == "BLOCKED"
    assert rec["result"] is None
    assert any("BLOCKED" in x for x in rec["blockReasons"])
    assert "candidates" not in (rec.get("result") or {})


def test_reject_non_decimal_sample_index(client, auth_headers):
    r = client.post(
        "/tasks",
        headers=auth_headers,
        json={"kind": "dsp.probe", "sampleIndices": ["1.5"]},
    )
    assert r.status_code == 422


def test_cancel_run(client, auth_headers):
    run_id = client.post(
        "/tasks",
        headers=auth_headers,
        json={"kind": "dsp.probe"},
    ).json()["runId"]
    c = client.post(f"/tasks/{run_id}/cancel", headers=auth_headers)
    assert c.status_code == 200
    assert c.json()["status"] == "cancelled"
    assert c.json()["runId"] == run_id
    assert client.get(f"/tasks/{run_id}", headers=auth_headers).json()["status"] == "cancelled"


def test_unknown_run_404(client, auth_headers):
    assert client.get("/tasks/does-not-exist", headers=auth_headers).status_code == 404
