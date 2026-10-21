
"""Real-model wiring tests: no fake greens; skip-if-missing for live smoke."""

from __future__ import annotations

import os
from pathlib import Path

import pytest

from app.model_layout import first_present, model_dir_roots
from app.torch_runtime import REAL_ENGINE_LABELS, clear_torch_cache, probe_torch
from app.capabilities import UI_COPY, probe_detection_readiness


FFSCN_REF = Path(r"D:\project\FFSCN_train2\weights\model_epoch_0210.pth")
SCN_REF = Path(r"D:\project\train_SCN\SCN_pretrained\epoch_105.pth")
FFSCN_HOME = Path(r"D:\project\FFSCN_train2\FFSCN_TEST_GUI")
SCN_HOME = Path(r"D:\project\train_SCN")
SCN_SAMPLE = Path(r"D:\project\train_SCN\datas\val\1_0000_000.ptpsd")


def test_model_dir_env_is_primary(tmp_path, monkeypatch):
    monkeypatch.setenv("LOCAL_COMPUTE_MODEL_DIR", str(tmp_path))
    roots = model_dir_roots()
    assert roots[0] == tmp_path


def test_pth_discovery_via_explicit_path(tmp_path, monkeypatch):
    weight = tmp_path / "ffscn.pth"
    weight.write_bytes(b"not-a-real-checkpoint")
    monkeypatch.setenv("LOCAL_COMPUTE_FFSCN_PATH", str(weight))
    assert first_present("FFSCN") == weight


def test_capabilities_stay_blocked_without_torch(client, auth_headers, monkeypatch):
    """Contract default: DISABLE_TORCH=1 => never claim ready, never invent."""
    monkeypatch.setenv("LOCAL_COMPUTE_DISABLE_TORCH", "1")
    clear_torch_cache()
    if FFSCN_REF.is_file():
        monkeypatch.setenv("LOCAL_COMPUTE_FFSCN_PATH", str(FFSCN_REF))
    data = client.get("/capabilities", headers=auth_headers).json()
    assert data["detection"]["ffscn"] is False
    assert data["detection"]["scn"] is False
    assert data["runtime"]["canInventResults"] is False
    codes = {m["code"] for m in data["detection"]["uiMessages"]}
    assert "NO_FAKE_INFERENCE" in codes or "STUB_RUNTIME" in codes


def test_source_missing_blocks_even_when_ready_mocked(client, auth_headers, monkeypatch):
    """If family is ready but sourcePath absent, task must BLOCKED with no result."""
    monkeypatch.setenv("LOCAL_COMPUTE_DISABLE_TORCH", "1")
    clear_torch_cache()

    import app.tasks as tasks_mod
    import app.capabilities as cap_mod

    monkeypatch.setattr(cap_mod, "family_ready", lambda kind: True)

    r = client.post(
        "/tasks",
        headers=auth_headers,
        json={"kind": "scn.detect", "params": {}, "sampleIndices": []},
    )
    assert r.status_code == 200
    run_id = r.json()["runId"]
    # poll briefly
    import time

    record = None
    for _ in range(50):
        record = client.get(f"/tasks/{run_id}", headers=auth_headers).json()
        if record["status"] in {"BLOCKED", "failed", "SUCCEEDED", "cancelled"}:
            break
        time.sleep(0.05)
    assert record is not None
    # With DISABLE_TORCH the stub path still runs because family_ready is mocked
    # only for dispatch — start_detection_worker will call real pipeline which
    # sees no torch and BLOCKED. Either way: no fabricated candidates.
    assert record["status"] in {"BLOCKED", "failed"}
    assert record.get("result") is None


def test_verified_result_keys_allowed_through_apply_update():
    from datetime import datetime, timezone

    from app.models import TaskRecord, TaskStatus
    from app.tasks import _apply_update, clear_tasks, _tasks

    clear_tasks()
    run_id = "test-verified-result"
    now = datetime.now(timezone.utc).isoformat()
    _tasks[run_id] = TaskRecord(
        runId=run_id,
        kind="scn.detect",
        status=TaskStatus.RUNNING,
        progress=0.5,
        request={"kind": "scn.detect"},
        createdAt=now,
        updatedAt=now,
        statusHistory=["queued", "running"],
    )
    _apply_update(
        run_id,
        status=TaskStatus.SUCCEEDED,
        progress=1.0,
        result={
            "verifiedForward": True,
            "engine": "PYTORCH_CUDA",
            "candidates": [{"score": 0.9}],
            "candidateCount": 1,
        },
    )
    assert _tasks[run_id].status == TaskStatus.SUCCEEDED
    assert _tasks[run_id].result is not None
    assert _tasks[run_id].result["candidates"][0]["score"] == 0.9

    # unverified candidates must be refused
    _tasks[run_id] = _tasks[run_id].model_copy(
        update={"status": TaskStatus.RUNNING, "result": None, "statusHistory": ["queued", "running"]}
    )
    _apply_update(
        run_id,
        status=TaskStatus.SUCCEEDED,
        result={"candidates": [{"score": 0.1}], "engine": "STUB_NON_TENSORRT"},
    )
    assert _tasks[run_id].status == TaskStatus.BLOCKED
    assert _tasks[run_id].result is None
    clear_tasks()


@pytest.mark.skipif(not SCN_REF.is_file(), reason="SCN reference weight missing")
@pytest.mark.skipif(not SCN_HOME.is_dir(), reason="SCN home missing")
def test_live_scn_smoke_load_skip_if_missing():
    """Live smoke: only runs when torch+weights exist; never fakes PASS."""
    os.environ.pop("LOCAL_COMPUTE_DISABLE_TORCH", None)
    clear_torch_cache()
    probe = probe_torch(force=True)
    if not probe.available:
        pytest.skip("torch not installed in this interpreter")
    from app.torch_runtime import smoke_load_scn

    device = probe.device
    smoke = smoke_load_scn(SCN_REF, SCN_HOME, device)
    assert smoke.ok, smoke.detail
    assert smoke.engine in REAL_ENGINE_LABELS


@pytest.mark.skipif(not FFSCN_REF.is_file(), reason="FFSCN reference weight missing")
@pytest.mark.skipif(not FFSCN_HOME.is_dir(), reason="FFSCN home missing")
def test_live_ffscn_smoke_load_skip_if_missing():
    os.environ.pop("LOCAL_COMPUTE_DISABLE_TORCH", None)
    clear_torch_cache()
    probe = probe_torch(force=True)
    if not probe.available:
        pytest.skip("torch not installed in this interpreter")
    from app.torch_runtime import smoke_load_ffscn

    smoke = smoke_load_ffscn(FFSCN_REF, FFSCN_HOME, probe.device)
    assert smoke.ok, smoke.detail
    assert smoke.engine in REAL_ENGINE_LABELS


@pytest.mark.skipif(not SCN_REF.is_file() or not SCN_SAMPLE.is_file(), reason="SCN assets missing")
def test_live_scn_infer_ptpsd_skip_if_missing():
    os.environ.pop("LOCAL_COMPUTE_DISABLE_TORCH", None)
    clear_torch_cache()
    probe = probe_torch(force=True)
    if not probe.available or not probe.cuda_available:
        pytest.skip("CUDA torch required for live SCN infer smoke")
    from app.inference.scn import run_scn

    result = run_scn(
        weights=SCN_REF,
        home=SCN_HOME,
        source_path=SCN_SAMPLE,
        device=probe.device,
    )
    assert result["verifiedForward"] is True
    assert result["engine"] in REAL_ENGINE_LABELS
    assert "candidates" in result
    assert isinstance(result["candidates"], list)
    # Real forward may legitimately return zero carriers — that is NOT a fake green.
    assert result["candidateCount"] == len(result["candidates"])


def test_ui_copy_has_new_real_model_codes():
    for code in (
        "TORCH_MISSING",
        "TORCH_CUDA_OK",
        "MODEL_LOAD_FAILED",
        "SOURCE_MISSING",
        "REAL_RUNTIME",
        "MODEL_HOME_MISSING",
    ):
        assert code in UI_COPY
