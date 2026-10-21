"""TensorRT .engine / ONNX are N/A: never smoke-load, never invent candidates."""

from __future__ import annotations

import time
from pathlib import Path

from app.capabilities import UI_COPY
from app.torch_runtime import LoadSmoke, TorchProbe, smoke_load_ffscn, smoke_load_scn


def _wait(client, auth_headers, run_id: str, wanted: set[str], timeout: float = 8.0):
    deadline = time.time() + timeout
    last = None
    while time.time() < deadline:
        last = client.get(f"/tasks/{run_id}", headers=auth_headers).json()
        if last["status"] in wanted:
            return last
        time.sleep(0.05)
    raise AssertionError(f"timed out waiting for {wanted}; last={last}")


def test_ui_copy_tensorrt_and_onnx_na():
    for code in ("TENSORRT_NA", "ONNX_NA"):
        severity, en, zh = UI_COPY[code]
        assert severity == "error"
        assert "N/A" in en
        assert zh.strip()
        assert any("\u4e00" <= ch <= "\u9fff" for ch in zh)


def test_engine_capabilities_blocked_no_ready(client, auth_headers, tmp_path, monkeypatch):
    engine = tmp_path / "ffscn.engine"
    engine.write_bytes(b"NOT-A-TENSORRT-ENGINE")
    monkeypatch.setenv("LOCAL_COMPUTE_MODEL_DIR", str(tmp_path))
    monkeypatch.delenv("LOCAL_COMPUTE_FFSCN_PATH", raising=False)
    monkeypatch.delenv("LOCAL_COMPUTE_FFSCN_SHA256", raising=False)

    data = client.get("/capabilities", headers=auth_headers).json()
    assert data["detection"]["ffscn"] is False
    assert data["detection"]["scn"] is False
    assert data["runtime"]["ffscnReady"] is False
    assert data["runtime"]["tensorrtVerified"] is False
    assert data["runtime"]["canInventResults"] is False
    reasons = " | ".join(data["detection"]["reasons"])
    assert "TensorRT .engine is N/A" in reasons
    assert "BLOCKED" in reasons
    codes = {m["code"] for m in data["detection"]["uiMessages"]}
    assert "TENSORRT_NA" in codes
    assert "NO_FAKE_INFERENCE" in codes
    hit = next(m for m in data["detection"]["uiMessages"] if m["code"] == "TENSORRT_NA")
    assert hit["en"] == UI_COPY["TENSORRT_NA"][1]
    assert hit["zh"] == UI_COPY["TENSORRT_NA"][2]


def test_onnx_capabilities_blocked(client, auth_headers, tmp_path, monkeypatch):
    onnx = tmp_path / "scn.onnx"
    onnx.write_bytes(b"not-onnx")
    monkeypatch.setenv("LOCAL_COMPUTE_SCN_PATH", str(onnx))

    data = client.get("/capabilities", headers=auth_headers).json()
    assert data["detection"]["scn"] is False
    codes = {m["code"] for m in data["detection"]["uiMessages"]}
    assert "ONNX_NA" in codes
    assert any("ONNX is N/A" in r for r in data["detection"]["reasons"])


def test_engine_task_blocked_without_candidates(client, auth_headers, tmp_path, monkeypatch):
    engine = tmp_path / "ffscn.engine"
    engine.write_bytes(b"NOT-A-TENSORRT-ENGINE")
    monkeypatch.setenv("LOCAL_COMPUTE_FFSCN_PATH", str(engine))
    src = tmp_path / "iq.wav"
    src.write_bytes(b"RIFF")

    run_id = client.post(
        "/tasks",
        headers=auth_headers,
        json={"kind": "ffscn.detect", "sourcePath": str(src)},
    ).json()["runId"]
    rec = _wait(client, auth_headers, run_id, {"BLOCKED", "failed", "succeeded"})
    assert rec["status"] == "BLOCKED"
    assert rec["result"] is None
    assert "candidates" not in (rec.get("result") or {})
    codes = {m["code"] for m in rec.get("uiMessages") or []}
    assert "TENSORRT_NA" in codes
    assert any("TensorRT .engine is N/A" in r for r in rec["blockReasons"])


def test_mocked_cuda_does_not_smoke_load_engine(client, auth_headers, tmp_path, monkeypatch):
    """Even if torch+CUDA look ready, a .engine must not be smoke-loaded or marked ready."""
    engine = tmp_path / "ffscn.engine"
    engine.write_bytes(b"engine-bytes")
    home = tmp_path / "home"
    home.mkdir()
    monkeypatch.setenv("LOCAL_COMPUTE_FFSCN_PATH", str(engine))
    monkeypatch.setenv("LOCAL_COMPUTE_FFSCN_HOME", str(home))

    import app.capabilities as cap

    called = {"n": 0}

    def _probe(**_kwargs):
        return TorchProbe(
            available=True,
            cuda_available=True,
            cuda_device_count=1,
            device_name="mock-gpu",
            device="cuda:0",
            engine="PYTORCH_CUDA",
            reason="mocked cuda",
            ui_code="TORCH_CUDA_OK",
        )

    def _smoke(*_args, **_kwargs):
        called["n"] += 1
        return LoadSmoke(ok=True, family="FFSCN", engine="PYTORCH_CUDA", detail="should not run")

    monkeypatch.setattr(cap, "probe_torch", _probe)
    monkeypatch.setattr(cap, "smoke_for_family", _smoke)

    data = client.get("/capabilities", headers=auth_headers).json()
    assert called["n"] == 0
    assert data["detection"]["ffscn"] is False
    assert data["runtime"]["ffscnReady"] is False
    assert data["runtime"]["engine"] != "PYTORCH_CUDA"
    codes = {m["code"] for m in data["detection"]["uiMessages"]}
    assert "TENSORRT_NA" in codes
    assert "REAL_RUNTIME" not in codes


def test_smoke_helpers_refuse_engine_and_onnx(tmp_path: Path):
    engine = tmp_path / "ffscn.engine"
    engine.write_bytes(b"e")
    onnx = tmp_path / "scn.onnx"
    onnx.write_bytes(b"o")
    ff = smoke_load_ffscn(engine, tmp_path, "cuda:0")
    sc = smoke_load_scn(onnx, tmp_path, "cpu")
    assert ff.ok is False
    assert "TensorRT .engine is N/A" in ff.detail
    assert sc.ok is False
    assert "ONNX weight is N/A" in sc.detail


def test_pipeline_blocks_engine_before_forward(tmp_path, monkeypatch):
    engine = tmp_path / "ffscn.engine"
    engine.write_bytes(b"e")
    monkeypatch.setenv("LOCAL_COMPUTE_FFSCN_PATH", str(engine))

    from app.inference import pipeline as pipe
    import app.inference.ffscn as ffscn_mod

    monkeypatch.setattr(
        pipe,
        "probe_torch",
        lambda **_k: TorchProbe(
            available=True,
            cuda_available=True,
            device="cuda:0",
            engine="PYTORCH_CUDA",
            reason="mocked",
            ui_code="TORCH_CUDA_OK",
        ),
    )
    called = {"n": 0}

    def _boom(**_kwargs):
        called["n"] += 1
        raise AssertionError("run_ffscn must not be called for .engine")

    monkeypatch.setattr(ffscn_mod, "run_ffscn", _boom)
    out = pipe.run_detection_inference(
        kind="ffscn.detect",
        source_path=str(tmp_path / "missing.wav"),
    )
    assert called["n"] == 0
    assert out.ok is False
    assert out.blocked is True
    assert out.result is None
    assert "TENSORRT_NA" in out.ui_codes
    assert any("N/A" in r for r in out.reasons)
