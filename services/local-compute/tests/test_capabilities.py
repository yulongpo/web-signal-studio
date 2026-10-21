"""Capabilities shape + model precheck / BLOCKED degradation + UI copy."""

from __future__ import annotations

import hashlib

from app.capabilities import UI_COPY


REQUIRED_UI_CODES = {
    "GPU_MISSING",
    "GPU_UNVERIFIED",
    "GPU_PROBE_ERROR",
    "TORCH_MISSING",
    "TORCH_CPU_ONLY",
    "TORCH_CUDA_OK",
    "MODEL_MISSING_FFSCN",
    "MODEL_MISSING_SCN",
    "MODEL_PATH_MISSING",
    "MODEL_HOME_MISSING",
    "MODEL_HASH_MISMATCH",
    "MODEL_HASH_UNAVAILABLE",
    "MODEL_LOAD_FAILED",
    "SOURCE_MISSING",
    "INFERENCE_FAILED",
    "STUB_RUNTIME",
    "REAL_RUNTIME",
    "NO_FAKE_INFERENCE",
}


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
    assert data["dsp"]["fft"] is True
    assert "uiMessages" in det
    assert isinstance(det["uiMessages"], list) and len(det["uiMessages"]) >= 1


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


def test_capabilities_ui_messages_bilingual_degradation(client, auth_headers):
    data = client.get("/capabilities", headers=auth_headers).json()
    msgs = data["detection"]["uiMessages"]
    assert msgs
    codes = {m["code"] for m in msgs}
    # Always present under stub warmup
    assert "STUB_RUNTIME" in codes
    assert "NO_FAKE_INFERENCE" in codes
    # GPU path: missing or unverified
    assert codes & {"GPU_MISSING", "GPU_UNVERIFIED", "GPU_PROBE_ERROR", "TORCH_MISSING"}
    # Model missing (default empty models/)
    assert codes & {"MODEL_MISSING_FFSCN", "MODEL_MISSING_SCN"}
    for m in msgs:
        assert m["en"] and m["zh"]
        assert m["code"] in UI_COPY
        severity, en, zh = UI_COPY[m["code"]]
        assert m["en"] == en
        assert m["zh"] == zh
        assert m["severity"] == severity
        # Chinese present
        assert any("\u4e00" <= ch <= "\u9fff" for ch in m["zh"])


def test_ui_copy_table_complete():
    assert REQUIRED_UI_CODES <= set(UI_COPY.keys())
    for code in REQUIRED_UI_CODES:
        severity, en, zh = UI_COPY[code]
        assert severity in {"info", "warning", "error"}
        assert en.strip() and zh.strip()


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
    assert data["dsp"]["fft"] is True
    codes = {m["code"] for m in data["detection"]["uiMessages"]}
    assert "STUB_RUNTIME" in codes


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
    codes = {m["code"] for m in data["detection"]["uiMessages"]}
    assert "MODEL_HASH_MISMATCH" in codes


def test_capabilities_missing_configured_path(
    client, auth_headers, tmp_path, monkeypatch
):
    missing = tmp_path / "nope" / "ffscn.engine"
    monkeypatch.setenv("LOCAL_COMPUTE_FFSCN_PATH", str(missing))
    data = client.get("/capabilities", headers=auth_headers).json()
    assert data["detection"]["ffscn"] is False
    assert any("path missing" in r for r in data["detection"]["reasons"])
    codes = {m["code"] for m in data["detection"]["uiMessages"]}
    assert "MODEL_PATH_MISSING" in codes


def test_openapi_smoke_has_capabilities_and_ui_messages(client, auth_headers):
    r = client.get("/openapi.json", headers=auth_headers)
    assert r.status_code == 200
    spec = r.json()
    assert "/capabilities" in spec["paths"]
    assert "/tasks" in spec["paths"]
    schemas = spec["components"]["schemas"]
    assert "CapabilitiesResponse" in schemas
    # Pydantic may nest DetectionCapabilities
    det = schemas.get("DetectionCapabilities") or {}
    props = det.get("properties") or {}
    assert "uiMessages" in props or "UiMessage" in schemas
