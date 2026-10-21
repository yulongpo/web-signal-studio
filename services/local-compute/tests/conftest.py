"""Pytest fixtures for local-compute."""

from __future__ import annotations

import os

import pytest
from fastapi.testclient import TestClient

# Auth + bind for tests
os.environ["LOCAL_COMPUTE_TOKEN"] = "test-token-local-compute"
os.environ["LOCAL_COMPUTE_HOST"] = "127.0.0.1"
os.environ["LOCAL_COMPUTE_CORS_ORIGINS"] = "http://localhost:5173"
# Fast stub timing for contract tests (overridable per-test)
os.environ.setdefault("LOCAL_COMPUTE_STUB_STEP_MS", "30")
os.environ.setdefault("LOCAL_COMPUTE_STUB_STEPS", "6")
# Keep contract suite deterministic: no accidental real torch readiness
os.environ["LOCAL_COMPUTE_DISABLE_TORCH"] = "1"
# Contract suite: no accidental TRT ready from host Anaconda/site-packages
os.environ["LOCAL_COMPUTE_DISABLE_TENSORRT"] = "1"


@pytest.fixture()
def client():
    from app.auth import init_auth
    from app.main import app
    from app.model_layout import clear_hash_manifest_cache
    from app.tasks import clear_tasks
    from app.torch_runtime import clear_torch_cache
    from app.tensorrt_runtime import clear_tensorrt_caches

    init_auth()
    clear_tasks()
    clear_torch_cache()
    clear_tensorrt_caches()
    clear_hash_manifest_cache()
    with TestClient(app) as c:
        yield c
    clear_tasks()
    clear_hash_manifest_cache()


@pytest.fixture()
def auth_headers():
    return {"Authorization": "Bearer test-token-local-compute"}


@pytest.fixture()
def slow_stub(monkeypatch):
    """Lengthen stub so in-flight cancel is observable."""
    monkeypatch.setenv("LOCAL_COMPUTE_STUB_STEP_MS", "200")
    monkeypatch.setenv("LOCAL_COMPUTE_STUB_STEPS", "40")

