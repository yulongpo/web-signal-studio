# local-compute (Web Signal Studio)

Optional **loopback-only** FastAPI service implementing [WEB_NATIVE_PROTOCOL](../../docs/architecture/WEB_NATIVE_PROTOCOL.md) v0.1.0 (warmup).

When no real model/GPU path is present, `detection.ffscn` / `detection.scn` are **false** and `reasons` include `BLOCKED`. FFSCN/SCN inference results are **never fabricated**.

## Protocol summary

| Item | Value |
|------|--------|
| Base URL | `http://127.0.0.1:<port>` |
| Auth | `Authorization: Bearer <session-token>` (generated at start, logged once) |
| CORS | configured Origin only (dev: `http://localhost:5173`) |
| Indices | sample indices / half-open ranges as **decimal strings** |

### Endpoints

| Method | Path | Response |
|--------|------|----------|
| GET | `/capabilities` | `{ protocolVersion, dsp, detection: { ffscn, scn, reasons }, models }` |
| POST | `/tasks` | `{ runId }` |
| GET | `/tasks/{runId}` | progress / result / evidence metadata |
| POST | `/tasks/{runId}/cancel` | cancel |

## Install (Windows)

```powershell
cd <repo>/services/local-compute
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Run

```powershell
$env:LOCAL_COMPUTE_TOKEN = "dev-token-change-me"
$env:LOCAL_COMPUTE_CORS_ORIGINS = "http://localhost:5173"
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Or: `python -m app.main`

## Tests

```powershell
.\.venv\Scripts\Activate.ps1
pytest -q
```

