"""G17: REAL_RUNTIME banner must not claim PyTorch-only when TRT is the path."""

from __future__ import annotations

from app.capabilities import UI_COPY


def test_real_runtime_copy_is_engine_agnostic():
    severity, en, zh = UI_COPY["REAL_RUNTIME"]
    assert severity == "info"
    assert "PyTorch" in en and "TensorRT" in en
    assert "真推理" in zh
    # Must not imply PyTorch is the only runtime
    assert "Verified PyTorch detection runtime is ready for this family." != en


def test_tensorrt_ok_copy_present():
    severity, en, zh = UI_COPY["TENSORRT_OK"]
    assert severity == "info"
    assert "TensorRT" in en
    assert "TensorRT" in zh
