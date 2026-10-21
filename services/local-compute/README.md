# local-compute (Web Signal Studio)

Optional **loopback-only** FastAPI service for local DSP / detection workers (FFSCN / SCN).

This warmup skeleton exposes capability probing, session-token auth, and an in-memory task API.
It does **not** run inference. When no real model/GPU is present, detection backends report `BLOCKED`.

## Security

- Binds **only** to `127.0.0.1` (never `0.0.0.0`).
- Every route requires a session token (`Authorization: Bearer <token>` or `X-Local-Compute-Token: <token>`).
- Do not fabricate FFSCN/SCN detection candidates. Fixture/demo backends are not wired as production.

## Install (Windows)

```powershell
cd D:\project\web_signal_studio\services\local-compute
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Run

```powershell
# Optional: set a stable token
$env:LOCAL_COMPUTE_TOKEN = "dev-token-change-me"

# Must bind loopback — do not use 0.0.0.0
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

On startup the service logs the bind address and (if generated) the session token.

## Auth header

```http
Authorization: Bearer <token>
```

or

```http
X-Local-Compute-Token: <token>
```

## Endpoints

| Method | Path | Notes |
|--------|------|-------|
| GET | `/capabilities` | Versioned capability report; FFSCN/SCN `BLOCKED` without real model |
| POST | `/tasks` | Create task (`queued`); body is accepted but not executed |
| GET | `/tasks/{task_id}` | Status / progress placeholder |
| POST | `/tasks/{task_id}/cancel` | Mark cancelled |

## Tests

```powershell
.\.venv\Scripts\Activate.ps1
pytest -q
```

Tests assert auth rejection, capabilities `BLOCKED` without models, and cancel — no GPU required.
