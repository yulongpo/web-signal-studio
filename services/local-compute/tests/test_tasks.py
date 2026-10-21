"""Task create / get / cancel — no fabricated detections."""

from __future__ import annotations


def test_create_probe_task_queued(client, auth_headers):
    r = client.post(
        "/tasks",
        headers=auth_headers,
        json={"kind": "probe.capabilities", "params": {}},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "queued"
    assert "taskId" in body


def test_detection_task_blocked_not_fake_results(client, auth_headers):
    r = client.post(
        "/tasks",
        headers=auth_headers,
        json={"kind": "ffscn.detect", "params": {"roi": "full"}},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "BLOCKED"
    tid = body["taskId"]
    g = client.get(f"/tasks/{tid}", headers=auth_headers)
    assert g.status_code == 200
    rec = g.json()
    assert rec["status"] == "BLOCKED"
    assert "detectionCandidates" not in rec
    assert any("not invent" in x or "worker" in x for x in rec["blockReasons"])


def test_cancel_task(client, auth_headers):
    r = client.post(
        "/tasks",
        headers=auth_headers,
        json={"kind": "probe.capabilities"},
    )
    tid = r.json()["taskId"]
    c = client.post(f"/tasks/{tid}/cancel", headers=auth_headers)
    assert c.status_code == 200
    assert c.json()["status"] == "cancelled"
    g = client.get(f"/tasks/{tid}", headers=auth_headers)
    assert g.json()["status"] == "cancelled"


def test_unknown_task_404(client, auth_headers):
    r = client.get("/tasks/does-not-exist", headers=auth_headers)
    assert r.status_code == 404
