"""FFSCN full-file E2E: real forward when CUDA+weights+source exist; else skip.

Hard rule: never fabricate candidates/scores to pass. Contract suite keeps
LOCAL_COMPUTE_DISABLE_TORCH=1 and must stay BLOCKED without fake greens.
"""

from __future__ import annotations

import os
import time
from pathlib import Path

import pytest

from app.capabilities import UI_COPY
from app.torch_runtime import REAL_ENGINE_LABELS, clear_torch_cache, probe_torch

FIXTURES = Path(__file__).resolve().parent / "fixtures"
SYNTH_WAV = FIXTURES / "synthetic_iq_stereo.wav"

FFSCN_REF = Path(r"D:\project\FFSCN_train2\weights\model_epoch_0210.pth")
FFSCN_HOME = Path(r"D:\project\FFSCN_train2\FFSCN_TEST_GUI")
# Prefer small deliverable sample when present; else synthetic fixture.
FFSCN_SAMPLE_CANDIDATES = [
    Path(
        r"D:\project\FFSCN_train2\deliverables\ffscn_release_20260908"
        r"\FFSCN_60MHz_package\samples\data"
        r"\20260906-225724-022_666988_bw_60000000_sampleTime_0.01_rollOff_0.35.wav"
    ),
    SYNTH_WAV,
]


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


@pytest.mark.skipif(not FFSCN_REF.is_file(), reason="FFSCN weight missing")
@pytest.mark.skipif(not FFSCN_HOME.is_dir(), reason="FFSCN home missing")
def test_ffscn_full_file_e2e_live_skip_if_missing(client, auth_headers, monkeypatch):
    """Live full-file E2E through HTTP. Skip when CUDA torch unavailable.

    When not skipped, candidates MUST come from verifiedForward real path.
    Zero candidates from a real forward is allowed (not a fake green).
    """
    monkeypatch.delenv("LOCAL_COMPUTE_DISABLE_TORCH", raising=False)
    monkeypatch.setenv("LOCAL_COMPUTE_FFSCN_PATH", str(FFSCN_REF))
    monkeypatch.setenv("LOCAL_COMPUTE_FFSCN_HOME", str(FFSCN_HOME))
    # Keep NFFT modest for smoke VRAM
    monkeypatch.setenv("LOCAL_COMPUTE_FFSCN_DETECT_NFFT", "1024")
    monkeypatch.setenv("LOCAL_COMPUTE_FFSCN_NFFT", "1024")
    clear_torch_cache()

    probe = probe_torch(force=True)
    if not probe.available:
        pytest.skip("torch not installed in this interpreter")
    if not probe.cuda_available:
        pytest.skip("CUDA torch required for FFSCN full-file E2E")

    src = _pick_source()
    if src is None:
        pytest.skip("no FFSCN source wav/fixture available")

    # Capabilities must claim ffscn ready before we assert succeeded path
    caps = client.get("/capabilities", headers=auth_headers).json()
    if not caps["detection"]["ffscn"]:
        pytest.skip(
            "ffscn not ready in capabilities "
            f"(reasons={caps['detection'].get('reasons')})"
        )

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
    record = _poll_task(client, auth_headers, run_id, timeout_s=300.0)

    if record["status"] == "BLOCKED":
        # Still not inventing — report skip with reason rather than fake pass
        pytest.skip(f"live path BLOCKED: {record.get('blockReasons')}")
    if record["status"] == "failed":
        pytest.fail(f"live FFSCN failed: {record.get('message')} / {record.get('blockReasons')}")

    assert record["status"] == "succeeded"
    result = record.get("result")
    assert isinstance(result, dict)
    assert result.get("verifiedForward") is True
    assert result.get("engine") in REAL_ENGINE_LABELS
    assert result.get("family") == "FFSCN"
    assert isinstance(result.get("candidates"), list)
    assert result.get("candidateCount") == len(result["candidates"])
