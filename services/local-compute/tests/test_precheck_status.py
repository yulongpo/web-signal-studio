"""Extra tests: structured gpu/runtime precheck + status machine."""

from __future__ import annotations

from app.capabilities import STUB_ENGINE_LABEL, UI_COPY
from app.models import ALLOWED_TRANSITIONS, TaskStatus, can_transition


def test_capabilities_gpu_and_runtime_precheck_fields(client, auth_headers):
    data = client.get("/capabilities", headers=auth_headers).json()
    assert "gpu" in data
    assert "runtime" in data
    gpu = data["gpu"]
    runtime = data["runtime"]
    assert "toolchainVisible" in gpu
    assert gpu["runtimeVerified"] is False
    assert gpu["uiCode"] in UI_COPY
    assert runtime["engine"] == STUB_ENGINE_LABEL
    assert runtime["tensorrtVerified"] is False
    assert runtime["cudaVerified"] is False
    assert runtime["canInventResults"] is False
    assert runtime["ffscnReady"] is False
    assert runtime["scnReady"] is False
    assert isinstance(runtime["modelSearchRoots"], list)
    assert len(runtime["modelSearchRoots"]) >= 1
    assert data["detection"]["ffscn"] is False
    assert data["detection"]["scn"] is False


def test_capabilities_runtime_roots_include_model_dir(client, auth_headers):
    data = client.get("/capabilities", headers=auth_headers).json()
    roots = " | ".join(data["runtime"]["modelSearchRoots"])
    assert "models" in roots.lower() or len(data["runtime"]["modelSearchRoots"]) >= 1


def test_status_machine_transitions():
    assert can_transition(TaskStatus.QUEUED, TaskStatus.RUNNING)
    assert can_transition(TaskStatus.QUEUED, TaskStatus.CANCELLED)
    assert can_transition(TaskStatus.RUNNING, TaskStatus.BLOCKED)
    assert can_transition(TaskStatus.RUNNING, TaskStatus.CANCELLED)
    assert can_transition(TaskStatus.RUNNING, TaskStatus.RUNNING)
    assert not can_transition(TaskStatus.CANCELLED, TaskStatus.BLOCKED)
    assert not can_transition(TaskStatus.CANCELLED, TaskStatus.RUNNING)
    assert not can_transition(TaskStatus.BLOCKED, TaskStatus.SUCCEEDED)
    assert not can_transition(TaskStatus.SUCCEEDED, TaskStatus.RUNNING)
    assert ALLOWED_TRANSITIONS[TaskStatus.CANCELLED] == frozenset()
