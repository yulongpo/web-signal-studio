"""FastAPI entry — WEB_NATIVE_PROTOCOL v0.1.0, loopback-only."""

from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import PROTOCOL_VERSION, __version__
from .auth import init_auth, require_token
from .capabilities import build_capabilities
from .models import (
    CapabilitiesResponse,
    TaskCancelResponse,
    TaskCreateRequest,
    TaskCreateResponse,
    TaskRecord,
)
from .tasks import cancel_task, create_task, get_task

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger("local-compute")

DEFAULT_CORS_ORIGINS = ("http://localhost:5173",)


def _cors_origins() -> list[str]:
    raw = (os.environ.get("LOCAL_COMPUTE_CORS_ORIGINS") or "").strip()
    if raw:
        return [o.strip() for o in raw.split(",") if o.strip()]
    return list(DEFAULT_CORS_ORIGINS)


def _enforce_loopback_hint() -> None:
    host = (os.environ.get("LOCAL_COMPUTE_HOST") or "127.0.0.1").strip()
    if host not in ("127.0.0.1", "localhost", "::1"):
        raise SystemExit(
            "local-compute must bind only to 127.0.0.1 (set LOCAL_COMPUTE_HOST=127.0.0.1)"
        )


@asynccontextmanager
async def lifespan(app: FastAPI):
    _enforce_loopback_hint()
    auth = init_auth()
    log.info(
        "local-compute %s (protocol %s) — bind policy: loopback-only 127.0.0.1",
        __version__,
        PROTOCOL_VERSION,
    )
    log.info("CORS allow_origins=%s", _cors_origins())
    if auth.generated:
        log.warning("SESSION TOKEN (copy once): %s", auth.token)
    else:
        log.info("Using LOCAL_COMPUTE_TOKEN from environment")
    yield
    log.info("local-compute shutting down")


app = FastAPI(
    title="Web Signal Studio local-compute",
    version=__version__,
    lifespan=lifespan,
    dependencies=[Depends(require_token)],
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.get("/capabilities", response_model=CapabilitiesResponse)
def capabilities() -> CapabilitiesResponse:
    return build_capabilities()


@app.post("/tasks", response_model=TaskCreateResponse)
def tasks_create(body: TaskCreateRequest) -> TaskCreateResponse:
    return create_task(body)


@app.get("/tasks/{run_id}", response_model=TaskRecord)
def tasks_get(run_id: str) -> TaskRecord:
    return get_task(run_id)


@app.post("/tasks/{run_id}/cancel", response_model=TaskCancelResponse)
def tasks_cancel(run_id: str) -> TaskCancelResponse:
    return cancel_task(run_id)


def run() -> None:
    import uvicorn

    _enforce_loopback_hint()
    init_auth()
    port = int(os.environ.get("LOCAL_COMPUTE_PORT") or "8000")
    uvicorn.run("app.main:app", host="127.0.0.1", port=port, reload=False)


if __name__ == "__main__":
    run()
