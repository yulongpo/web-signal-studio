# -*- coding: utf-8 -*-
"""Honors DetectionCard engine selection; rejects .pth / off-tree."""
from __future__ import annotations

from pathlib import Path

from app.inference.pipeline import _resolve_selected_weights


def test_resolve_selected_engine_path(tmp_path, monkeypatch):
    root = tmp_path / "detection-models"
    fam = root / "ffscn-gui-iq-v1"
    fam.mkdir(parents=True)
    eng = fam / "ffscn_epoch1200_dynamic_fp32.engine"
    eng.write_bytes(b"fake-engine")
    monkeypatch.setenv("LOCAL_COMPUTE_MODEL_DIR", str(root))
    # clear any layout caches if present
    from app import model_layout

    if hasattr(model_layout, "clear_hash_manifest_cache"):
        model_layout.clear_hash_manifest_cache()

    got = _resolve_selected_weights(
        "FFSCN",
        {"enginePath": str(eng), "modelId": "ffscn:ffscn_epoch1200_dynamic_fp32.engine"},
    )
    assert got is not None
    assert got.resolve() == eng.resolve()


def test_reject_pth_selection(tmp_path, monkeypatch):
    root = tmp_path / "detection-models"
    root.mkdir()
    pth = root / "ffscn.pth"
    pth.write_bytes(b"x")
    monkeypatch.setenv("LOCAL_COMPUTE_MODEL_DIR", str(root))
    from app import model_layout

    if hasattr(model_layout, "clear_hash_manifest_cache"):
        model_layout.clear_hash_manifest_cache()
    assert _resolve_selected_weights("FFSCN", {"enginePath": str(pth)}) is None


def test_reject_family_mismatch(tmp_path, monkeypatch):
    root = tmp_path / "detection-models"
    root.mkdir()
    eng = root / "scn_model.engine"
    eng.write_bytes(b"x")
    monkeypatch.setenv("LOCAL_COMPUTE_MODEL_DIR", str(root))
    from app import model_layout

    if hasattr(model_layout, "clear_hash_manifest_cache"):
        model_layout.clear_hash_manifest_cache()
    assert _resolve_selected_weights("FFSCN", {"enginePath": str(eng)}) is None
