"""Capabilities shape + BLOCKED detection without models."""

from __future__ import annotations


def test_capabilities_protocol_shape(client, auth_headers):
    r = client.get("/capabilities", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert data["protocolVersion"] == "0.1.0"
    assert data["bindAddressPolicy"] == "loopback-only"
    assert data["authRequired"] is True
    assert "dsp" in data
    assert "detection" in data
    assert "models" in data
    det = data["detection"]
    assert det["ffscn"] is False
    assert det["scn"] is False
    assert isinstance(det["reasons"], list) and len(det["reasons"]) >= 1
    assert any("BLOCKED" in x for x in det["reasons"])


def test_capabilities_never_claims_detection_available(client, auth_headers):
    data = client.get("/capabilities", headers=auth_headers).json()
    assert data["detection"]["ffscn"] is False
    assert data["detection"]["scn"] is False
