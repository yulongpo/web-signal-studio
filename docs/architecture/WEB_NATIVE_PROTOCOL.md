# WEB_NATIVE_PROTOCOL

Version: 0.1.0 (draft)

## Local compute base
- Base URL: http://127.0.0.1:<port>
- Auth: `Authorization: Bearer <session-token>` (token generated at service start, shown once)
- CORS: only allow configured Origin (dev: http://localhost:5173)

## Endpoints
### GET /capabilities
Returns JSON: `{ protocolVersion, dsp: {...}, detection: { ffscn: bool, scn: bool, reasons: string[] }, models: [...] }`

### POST /tasks
Body: frozen request snapshot (decimal sample indices as strings). Returns `{ runId }`.

### GET /tasks/{runId}
Progress / result / evidence metadata.

### POST /tasks/{runId}/cancel
Cancel bound to exact runId.

## Index encoding
All sample indices and half-open ranges use decimal strings in JSON.
