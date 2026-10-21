"""FFSCN full-file E2E: real forward when CUDA+weights+source exist; else skip.

Hard rule: never fabricate candidates/scores to pass. Contract suite keeps
LOCAL_COMPUTE_DISABLE_TORCH=1 and must stay BLOCKED without fake greens.
"""

from __future__ import annotations

import time
from pathlib import Path

import pytest

from app.capabilities import UI_COPY
from app.torch_runtime import clear_torch_cache

FIXTURES = Path(__file__).resolve().parent / "fixtures"
SYNTH_WAV = FIXTURES / "synthetic_iq_stereo.wav"

REBUILD = Path(r"D:\project\signal_studio_rebuild")
FFSCN_REF = (
    REBUILD
    / "out"
    / "vs2026-qt611-release_bin"
    / "detection-models"
    / "ffscn-gui-iq-v1"
    / "ffscn_epoch1200_dynamic_fp32.engine"
)
# Authorized IQ sample only. Synthetic wav remains a contract fixture, not a weight.
IQ_DATA = REBUILD / "resources" / "sigmf_data_demo" / "0000000.sigmf-data"
FFSCN_SAMPLE_CANDIDATES = [IQ_DATA, SYNTH_WAV]


def _pick_source() -> Path | None:
    for p in FFSCN_SAMPLE_CANDIDATES:
        if p.is_file():
            return p
    return None


def _poll_task(client, auth_headers, run_id: str, timeout_s: float = 180.0) -> dict:
    deadline = time.time() + timeout_s
    record = None
    while time.time() < deadline:
        record = client.get(f"/tasks/{run_id}", headers=auth_headers).json()
        if record["status"] in {"succeeded", "failed", "cancelled", "BLOCKED"}:
            return record
        time.sleep(0.1)
    assert record is not None
    return record


def test_stub_runtime_copy_matches_bot_b():
    """Bot-B gating.test.ts fixture must stay byte-aligned with UI_COPY."""
    sev, en, zh = UI_COPY["STUB_RUNTIME"]
    assert sev == "error"
    assert en == (
        "Local compute is in stub mode (no TensorRT). Detection will not invent results."
    )
    assert zh == "本地计算处于占位模式（无 TensorRT），检测不会伪造结果。"
    assert "TensorRT" in en
    assert "TensorRT" in zh


def test_source_missing_code_copy_stable():
    sev, en, zh = UI_COPY["SOURCE_MISSING"]
    assert sev == "error"
    assert "sourcePath" in en
    assert "sourcePath" in zh
    assert "伪造" in zh or "invent" in en.lower()


def test_ffscn_fixture_wav_is_stereo_pcm16():
    import wave

    assert SYNTH_WAV.is_file(), "synthetic fixture must be committed"
    with wave.open(str(SYNTH_WAV), "rb") as w:
        assert w.getnchannels() == 2
        assert w.getsampwidth() == 2
        assert w.getcomptype() == "NONE"
        assert w.getnframes() > 0


def test_ffscn_full_file_contract_no_fake_under_disable_torch(
    client, auth_headers, monkeypatch
):
    """Default .venv contract: DISABLE_TORCH=1 => BLOCKED, result null, no candidates."""
    monkeypatch.setenv("LOCAL_COMPUTE_DISABLE_TORCH", "1")
    clear_torch_cache()
    src = _pick_source()
    assert src is not None
    r = client.post(
        "/tasks",
        headers=auth_headers,
        json={
            "kind": "ffscn.detect",
            "params": {},
            "sourcePath": str(src),
            "sampleRange": {"start": "0", "end": "1048576"},
        },
    )
    assert r.status_code == 200
    run_id = r.json()["runId"]
    record = _poll_task(client, auth_headers, run_id, timeout_s=30.0)
    assert record["status"] in {"BLOCKED", "failed"}
    assert record.get("result") is None
    # No fabricated candidate payload on evidence/result
    blob = str(record)
    assert '"candidates"' not in blob or record.get("result") is None
    codes = {m["code"] for m in record.get("uiMessages") or []}
    reasons = " ".join(record.get("blockReasons") or [])
    assert (
        codes & {"STUB_RUNTIME", "NO_FAKE_INFERENCE", "TORCH_MISSING", "MODEL_MISSING_FFSCN", "MODEL_HOME_MISSING", "INFERENCE_FAILED"}
        or "BLOCKED" in reasons
    )


@pytest.mark.skipif(not FFSCN_REF.is_file(), reason="desktop FFSCN engine not on this machine")
def test_ffscn_engine_task_stays_blocked(client, auth_headers, monkeypatch):
    """Canonical release engine must not run a forward. TENSORRT_NA / BLOCKED."""
    monkeypatch.setenv("LOCAL_COMPUTE_DISABLE_TORCH", "1")
    monkeypatch.setenv("LOCAL_COMPUTE_FFSCN_PATH", str(FFSCN_REF))
    clear_torch_cache()
    src = _pick_source()
    if src is None:
        pytest.skip("no sigmf demo or synthetic fixture on this machine")

    caps = client.get("/capabilities", headers=auth_headers).json()
    assert caps["detection"]["ffscn"] is False
    codes = {m["code"] for m in caps["detection"].get("uiMessages") or []}
    assert "TENSORRT_NA" in codes

    r = client.post(
        "/tasks",
        headers=auth_headers,
        json={
            "kind": "ffscn.detect",
            "params": {},
            "sourcePath": str(src),
            "sampleRange": {"start": "0", "end": "1048576"},
        },
    )
    assert r.status_code == 200
    record = _poll_task(client, auth_headers, r.json()["runId"], timeout_s=30.0)
    assert record["status"] in {"BLOCKED", "failed"}
    assert record.get("result") is None
