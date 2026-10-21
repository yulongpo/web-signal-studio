"""TensorRT .engine: ready only after real deserialize; never invent candidates."""

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


def test_ui_copy_tensorrt_and_onnx_codes():
    for code in ("TENSORRT_NA", "ONNX_NA", "TENSORRT_RUNTIME_MISSING", "ENGINE_LOAD_FAILED"):
        severity, en, zh = UI_COPY[code]
        assert severity in {"error", "info"}
        assert en.strip()
        assert zh.strip()


def test_engine_capabilities_blocked_when_trt_disabled(client, auth_headers, tmp_path, monkeypatch):
    engine = tmp_path / "ffscn.engine"
    engine.write_bytes(b"NOT-A-TENSORRT-ENGINE")
    monkeypatch.setenv("LOCAL_COMPUTE_MODEL_DIR", str(tmp_path))
    monkeypatch.setenv("LOCAL_COMPUTE_DISABLE_TENSORRT", "1")
    monkeypatch.delenv("LOCAL_COMPUTE_FFSCN_PATH", raising=False)
    monkeypatch.delenv("LOCAL_COMPUTE_FFSCN_SHA256", raising=False)

    # clear caches
    from app import tensorrt_runtime as tr
    tr.clear_tensorrt_caches()

    data = client.get("/capabilities", headers=auth_headers).json()
    assert data["detection"]["ffscn"] is False
    assert data["detection"]["scn"] is False
    assert data["runtime"]["ffscnReady"] is False
    assert data["runtime"]["tensorrtVerified"] is False
    assert data["runtime"]["canInventResults"] is False
    reasons = " | ".join(data["detection"]["reasons"])
    assert "BLOCKED" in reasons
    codes = {m["code"] for m in data["detection"]["uiMessages"]}
    assert "TENSORRT_RUNTIME_MISSING" in codes or "TENSORRT_NA" in codes
    assert "NO_FAKE_INFERENCE" in codes


def test_onnx_capabilities_blocked(client, auth_headers, tmp_path, monkeypatch):
    onnx = tmp_path / "scn.onnx"
    onnx.write_bytes(b"not-onnx")
    monkeypatch.setenv("LOCAL_COMPUTE_SCN_PATH", str(onnx))
    monkeypatch.setenv("LOCAL_COMPUTE_DISABLE_TENSORRT", "1")

    data = client.get("/capabilities", headers=auth_headers).json()
    assert data["detection"]["scn"] is False
    codes = {m["code"] for m in data["detection"]["uiMessages"]}
    assert "ONNX_NA" in codes
    assert any("ONNX" in r for r in data["detection"]["reasons"])


def test_engine_task_blocked_without_candidates(client, auth_headers, tmp_path, monkeypatch):
    engine = tmp_path / "ffscn.engine"
    engine.write_bytes(b"NOT-A-TENSORRT-ENGINE")
    monkeypatch.setenv("LOCAL_COMPUTE_FFSCN_PATH", str(engine))
    monkeypatch.setenv("LOCAL_COMPUTE_DISABLE_TENSORRT", "1")
    from app import tensorrt_runtime as tr
    tr.clear_tensorrt_caches()
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
    assert "TENSORRT_RUNTIME_MISSING" in codes or "TENSORRT_NA" in codes
    assert any("BLOCKED" in r for r in rec["blockReasons"])


def test_disabled_trt_does_not_smoke_as_pytorch(client, auth_headers, tmp_path, monkeypatch):
    """Even if torch+CUDA look ready, a .engine with TRT disabled must not be marked ready."""
    engine = tmp_path / "ffscn.engine"
    engine.write_bytes(b"engine-bytes")
    home = tmp_path / "home"
    home.mkdir()
    monkeypatch.setenv("LOCAL_COMPUTE_FFSCN_PATH", str(engine))
    monkeypatch.setenv("LOCAL_COMPUTE_FFSCN_HOME", str(home))
    monkeypatch.setenv("LOCAL_COMPUTE_DISABLE_TENSORRT", "1")
    from app import tensorrt_runtime as tr
    tr.clear_tensorrt_caches()

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
    assert "TENSORRT_RUNTIME_MISSING" in codes or "TENSORRT_NA" in codes
    assert "REAL_RUNTIME" not in codes


def test_smoke_helpers_refuse_engine_and_onnx(tmp_path: Path):
    engine = tmp_path / "ffscn.engine"
    engine.write_bytes(b"e")
    onnx = tmp_path / "scn.onnx"
    onnx.write_bytes(b"o")
    ff = smoke_load_ffscn(engine, tmp_path, "cuda:0")
    sc = smoke_load_scn(onnx, tmp_path, "cpu")
    assert ff.ok is False
    assert "TensorRT" in ff.detail or "N/A" in ff.detail or "refusing" in ff.detail.lower()
    assert sc.ok is False
    assert "ONNX" in sc.detail


def test_pipeline_blocks_engine_when_trt_disabled(tmp_path, monkeypatch):
    engine = tmp_path / "ffscn.engine"
    engine.write_bytes(b"e")
    monkeypatch.setenv("LOCAL_COMPUTE_FFSCN_PATH", str(engine))
    monkeypatch.setenv("LOCAL_COMPUTE_DISABLE_TENSORRT", "1")
    from app import tensorrt_runtime as tr
    tr.clear_tensorrt_caches()

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
    assert "TENSORRT_RUNTIME_MISSING" in out.ui_codes or "TENSORRT_NA" in out.ui_codes
