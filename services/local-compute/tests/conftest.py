"""Pytest fixtures for local-compute."""

from __future__ import annotations

import os

import pytest
from fastapi.testclient import TestClient

os.environ["LOCAL_COMPUTE_TOKEN"] = "test-token-local-compute"
os.environ["LOCAL_COMPUTE_HOST"] = "127.0.0.1"
os.environ["LOCAL_COMPUTE_CORS_ORIGINS"] = "http://localhost:5173"


@pytest.fixture()
def client():
    from app.auth import init_auth
    from app.main import app
    from app.tasks import clear_tasks

    init_auth()
    clear_tasks()
    with TestClient(app) as c:
        yield c
    clear_tasks()


@pytest.fixture()
def auth_headers():
    return {"Authorization": "Bearer test-token-local-compute"}
