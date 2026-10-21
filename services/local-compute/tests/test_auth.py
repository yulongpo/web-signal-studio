"""Auth rejection tests."""

from __future__ import annotations


def test_capabilities_rejects_missing_token(client):
    r = client.get("/capabilities")
    assert r.status_code == 401


def test_capabilities_rejects_wrong_token(client):
    r = client.get("/capabilities", headers={"Authorization": "Bearer wrong"})
    assert r.status_code == 401


def test_capabilities_accepts_bearer(client, auth_headers):
    r = client.get("/capabilities", headers=auth_headers)
    assert r.status_code == 200


def test_capabilities_accepts_x_header(client):
    r = client.get(
        "/capabilities",
        headers={"X-Local-Compute-Token": "test-token-local-compute"},
    )
    assert r.status_code == 200


def test_tasks_reject_without_token(client):
    r = client.post("/tasks", json={"kind": "probe.capabilities"})
    assert r.status_code == 401
