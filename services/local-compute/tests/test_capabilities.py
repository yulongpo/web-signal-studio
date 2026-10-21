"""Capabilities shape + model precheck / BLOCKED degradation."""

from __future__ import annotations

import hashlib


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
    # Degradation: DSP stub may remain available while detection is BLOCKED
    assert data["dsp"]["fft"] is True


def test_capabilities_never_claims_detection_available(client, auth_headers):
    data = client.get("/capabilities", headers=auth_headers).json()
    assert data["detection"]["ffscn"] is False
    assert data["detection"]["scn"] is False


def test_capabilities_no_model_explicit_blocked_reasons(client, auth_headers):
    data = client.get("/capabilities", headers=auth_headers).json()
    reasons = " | ".join(data["detection"]["reasons"])
    assert "BLOCKED" in reasons
    assert ("no FFSCN" in reasons) or ("missing" in reasons.lower())
    assert "STUB_NON_TENSORRT" in reasons or "fabricated" in reasons.lower()


def test_capabilities_model_present_reports_identity_still_blocked(
    client, auth_headers, tmp_path, monkeypatch
):
    model = tmp_path / "ffscn.engine"
    payload = b"NOT-A-REAL-ENGINE-WARMUP-ONLY"
    model.write_bytes(payload)
    digest = hashlib.sha256(payload).hexdigest()
    monkeypatch.setenv("LOCAL_COMPUTE_MODEL_DIRS", str(tmp_path))
    monkeypatch.delenv("LOCAL_COMPUTE_FFSCN_SHA256", raising=False)

    data = client.get("/capabilities", headers=auth_headers).json()
    assert data["detection"]["ffscn"] is False
    assert data["detection"]["scn"] is False
    present = [m for m in data["models"] if m.get("present")]
    assert present, "expected identity metadata for present model file"
    assert any(m.get("sha256") == digest for m in present)
    assert any("BLOCKED" in r for r in data["detection"]["reasons"])
    # DSP still available under degradation
    assert data["dsp"]["fft"] is True


def test_capabilities_hash_mismatch_reason(
    client, auth_headers, tmp_path, monkeypatch
):
    model = tmp_path / "ffscn.engine"
    model.write_bytes(b"abc")
    monkeypatch.setenv("LOCAL_COMPUTE_MODEL_DIRS", str(tmp_path))
    monkeypatch.setenv("LOCAL_COMPUTE_FFSCN_SHA256", "0" * 64)
    data = client.get("/capabilities", headers=auth_headers).json()
    assert data["detection"]["ffscn"] is False
    assert any("hash/version mismatch" in r for r in data["detection"]["reasons"])


def test_capabilities_missing_configured_path(
    client, auth_headers, tmp_path, monkeypatch
):
    missing = tmp_path / "nope" / "ffscn.engine"
    monkeypatch.setenv("LOCAL_COMPUTE_FFSCN_PATH", str(missing))
    data = client.get("/capabilities", headers=auth_headers).json()
    assert data["detection"]["ffscn"] is False
    assert any("path missing" in r for r in data["detection"]["reasons"])
