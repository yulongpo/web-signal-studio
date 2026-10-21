"""Capabilities BLOCKED without real models / GPU path."""

from __future__ import annotations


def test_capabilities_reports_blocked_backends(client, auth_headers):
    r = client.get("/capabilities", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert data["bindAddressPolicy"] == "loopback-only"
    assert data["bindHost"] == "127.0.0.1"
    assert data["authRequired"] is True
    names = {b["name"]: b for b in data["detectionBackends"]}
    assert "ffscn" in names
    assert "scn" in names
    for name in ("ffscn", "scn"):
        b = names[name]
        assert b["status"] == "BLOCKED"
        assert b["productionEligible"] is False
        assert isinstance(b["blockReasons"], list) and len(b["blockReasons"]) >= 1
        # Must not claim inference is available
        assert b["status"] != "available"


def test_capabilities_has_gpu_and_version(client, auth_headers):
    r = client.get("/capabilities", headers=auth_headers)
    data = r.json()
    assert "version" in data
    assert "gpu" in data
    assert "available" in data["gpu"]
