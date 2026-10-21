# local-compute (Web Signal Studio)

Optional **loopback-only** FastAPI service implementing [WEB_NATIVE_PROTOCOL](../../docs/architecture/WEB_NATIVE_PROTOCOL.md) v0.1.0.

When no real model/GPU path is present (or only STUB_NON_TENSORRT is wired), `detection.ffscn` / `detection.scn` are **false** and `reasons` include `BLOCKED`. FFSCN/SCN inference results are **never fabricated**.

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
| POST | `/tasks/{runId}/cancel` | cancel bound to exact `runId` |

## Behaviour (this slice)

- **Model precheck**: searches `models/` + `LOCAL_COMPUTE_MODEL_DIRS` and optional `LOCAL_COMPUTE_FFSCN_PATH` / `LOCAL_COMPUTE_SCN_PATH`. Optional sha256 env vars produce explicit hash-mismatch BLOCKED reasons. Present files report identity metadata; `ffscn`/`scn` stay false until a real runtime is verified.
- **Degradation**: service stays up; DSP stub (`dsp.fft`) may remain available while detection is BLOCKED.
- **Stub worker**: labeled `STUB_NON_TENSORRT`. Detection runs step progress then finish as **BLOCKED** (no candidates). Cancel mid-flight yields **cancelled**, distinct from BLOCKED/succeeded/failed.

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

## Frontend detection-page contract

- Markdown: [docs/DETECTION_PAGE_CONTRACT.md](docs/DETECTION_PAGE_CONTRACT.md)
- OpenAPI (committed): [openapi.yaml](openapi.yaml) — also live at `GET /openapi.json`
- TS types: `@wss/contracts` `local-compute` exports (`LocalComputeCapabilities`, `uiMessages`, etc.)

### No-GPU / no-model degradation copy

`detection.uiMessages[]` carries stable `code` + bilingual `en`/`zh` strings (see contract table).
`ffscn`/`scn` stay `false`; never invent detection candidates. Task records expose `message` / `messageZh` / `uiMessages` when blocked.


## Detection page client examples

See [docs/HTTP_CLIENT_EXAMPLES.md](docs/HTTP_CLIENT_EXAMPLES.md) and [examples/detection-page-client.ts](examples/detection-page-client.ts) for Bot-B wiring (Bearer, capabilities, tasks, BLOCKED / uiMessages). No fake FFSCN/SCN inference.


## Real model integration

- Inventory: `docs/MODEL_INVENTORY.md`
- Bot-B / operator notes: `docs/REAL_MODEL_INTEGRATION.md`
- Prefer `LOCAL_COMPUTE_MODEL_DIR` or explicit `LOCAL_COMPUTE_*_PATH` + algorithm HOMEs.
- Detection becomes ready only after verified PyTorch load+forward; never invents candidates.
