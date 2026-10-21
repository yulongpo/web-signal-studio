"""Optional weight SHA-256 hardening (env aliases + JSON manifest).

Uses temp .pth bytes only — no torch, no fake TensorRT engines.
"""

from __future__ import annotations

import hashlib
import json

from app.capabilities import UI_COPY
from app.model_layout import clear_hash_manifest_cache, expected_weight_sha


def _clear_hash_envs(monkeypatch) -> None:
    for key in (
        "LOCAL_COMPUTE_FFSCN_SHA256",
        "LOCAL_COMPUTE_FFSCN_WEIGHT_SHA256",
        "LOCAL_COMPUTE_SCN_SHA256",
        "LOCAL_COMPUTE_SCN_WEIGHT_SHA256",
        "LOCAL_COMPUTE_WEIGHT_HASH_MANIFEST",
    ):
        monkeypatch.delenv(key, raising=False)
    clear_hash_manifest_cache()


def test_weight_hash_mismatch_env_blocks_pth(
    client, auth_headers, tmp_path, monkeypatch
):
    """Configured expected hash that does not match => BLOCKED + no ready."""
    _clear_hash_envs(monkeypatch)
    model = tmp_path / "model_epoch_0210.pth"
    payload = b"FAKE-PTH-BYTES-FOR-HASH-TEST-ONLY"
    model.write_bytes(payload)
    monkeypatch.setenv("LOCAL_COMPUTE_MODEL_DIR", str(tmp_path))
    monkeypatch.setenv("LOCAL_COMPUTE_FFSCN_WEIGHT_SHA256", "ab" * 32)  # wrong

    data = client.get("/capabilities", headers=auth_headers).json()
    assert data["detection"]["ffscn"] is False
    assert data["runtime"]["ffscnReady"] is False
    reasons = " | ".join(data["detection"]["reasons"])
    assert "WEIGHT_HASH_MISMATCH" in reasons
    assert "hash/version mismatch" in reasons
    codes = {m["code"] for m in data["detection"]["uiMessages"]}
    assert "MODEL_HASH_MISMATCH" in codes
    assert "WEIGHT_HASH_MISMATCH" in codes
    # Must not invent candidates path
    assert data["runtime"]["canInventResults"] is False


def test_weight_hash_mismatch_sha256_env_alias(
    client, auth_headers, tmp_path, monkeypatch
):
    _clear_hash_envs(monkeypatch)
    model = tmp_path / "epoch_105.pth"
    model.write_bytes(b"scn-fake-pth")
    monkeypatch.setenv("LOCAL_COMPUTE_MODEL_DIR", str(tmp_path))
    monkeypatch.setenv("LOCAL_COMPUTE_SCN_SHA256", "cd" * 32)

    data = client.get("/capabilities", headers=auth_headers).json()
    assert data["detection"]["scn"] is False
    assert any("WEIGHT_HASH_MISMATCH" in r for r in data["detection"]["reasons"])
    codes = {m["code"] for m in data["detection"]["uiMessages"]}
    assert "MODEL_HASH_MISMATCH" in codes


def test_weight_hash_mismatch_json_manifest(
    client, auth_headers, tmp_path, monkeypatch
):
    _clear_hash_envs(monkeypatch)
    model = tmp_path / "ffscn.pth"
    payload = b"manifest-mismatch-pth"
    model.write_bytes(payload)
    manifest = tmp_path / "weights.sha256.json"
    manifest.write_text(
        json.dumps({"ffscn": "11" * 32, "scn": "22" * 32}),
        encoding="utf-8",
    )
    monkeypatch.setenv("LOCAL_COMPUTE_MODEL_DIR", str(tmp_path))
    clear_hash_manifest_cache()

    data = client.get("/capabilities", headers=auth_headers).json()
    assert data["detection"]["ffscn"] is False
    assert any("WEIGHT_HASH_MISMATCH" in r for r in data["detection"]["reasons"])
    codes = {m["code"] for m in data["detection"]["uiMessages"]}
    assert "MODEL_HASH_MISMATCH" in codes
    assert "WEIGHT_HASH_MISMATCH" in codes


def test_weight_hash_match_via_manifest_notes(
    client, auth_headers, tmp_path, monkeypatch
):
    """Matching expected hash still leaves stub/torch BLOCKED under DISABLE_TORCH,
    but must NOT emit WEIGHT_HASH_MISMATCH."""
    _clear_hash_envs(monkeypatch)
    model = tmp_path / "ffscn.pth"
    payload = b"matching-hash-pth-bytes"
    model.write_bytes(payload)
    digest = hashlib.sha256(payload).hexdigest()
    (tmp_path / "weights.sha256.json").write_text(
        json.dumps({"ffscn": digest}),
        encoding="utf-8",
    )
    monkeypatch.setenv("LOCAL_COMPUTE_MODEL_DIR", str(tmp_path))
    clear_hash_manifest_cache()

    data = client.get("/capabilities", headers=auth_headers).json()
    # Still blocked (DISABLE_TORCH) — but not for hash mismatch
    assert data["detection"]["ffscn"] is False
    reasons = " | ".join(data["detection"]["reasons"])
    assert "WEIGHT_HASH_MISMATCH" not in reasons
    codes = {m["code"] for m in data["detection"]["uiMessages"]}
    assert "MODEL_HASH_MISMATCH" not in codes
    present = [m for m in data["models"] if m.get("present")]
    assert any(m.get("sha256") == digest for m in present)
    assert any("matches configured expectation" in (m.get("notes") or "") for m in present)


def test_missing_expected_hash_config_is_optional(
    client, auth_headers, tmp_path, monkeypatch
):
    """No expected-hash env/manifest => probe continues; identity reported;
    BLOCKED only for stub/torch/other reasons — not for hash."""
    _clear_hash_envs(monkeypatch)
    model = tmp_path / "model_epoch_0210.pth"
    payload = b"optional-hash-absent"
    model.write_bytes(payload)
    digest = hashlib.sha256(payload).hexdigest()
    monkeypatch.setenv("LOCAL_COMPUTE_MODEL_DIR", str(tmp_path))
    # Ensure no stray manifest
    clear_hash_manifest_cache()

    assert expected_weight_sha("FFSCN", model) is None

    data = client.get("/capabilities", headers=auth_headers).json()
    assert data["detection"]["ffscn"] is False  # stub / no torch
    reasons = " | ".join(data["detection"]["reasons"])
    assert "WEIGHT_HASH_MISMATCH" not in reasons
    assert "hash/version mismatch" not in reasons
    codes = {m["code"] for m in data["detection"]["uiMessages"]}
    assert "MODEL_HASH_MISMATCH" not in codes
    assert "MODEL_HASH_UNAVAILABLE" not in codes
    present = [m for m in data["models"] if m.get("present")]
    assert any(m.get("sha256") == digest for m in present)
    assert any("no expected-hash configured" in (m.get("notes") or "") for m in present)
    # Policy: still refuse fake inference
    assert "NO_FAKE_INFERENCE" in codes or any("fabricat" in reasons.lower() for _ in [0])


def test_weight_hash_ui_copy_has_alias():
    assert "WEIGHT_HASH_MISMATCH" in UI_COPY
    assert UI_COPY["WEIGHT_HASH_MISMATCH"][1] == UI_COPY["MODEL_HASH_MISMATCH"][1]
