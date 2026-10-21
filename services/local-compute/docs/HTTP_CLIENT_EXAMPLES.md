 HTTP client examples — detection page ↔ local-compute

**Owner:** Bot-E  
**Audience:** Bot-B (web detection page wiring)  
**Normative contract:** [DETECTION_PAGE_CONTRACT.md](./DETECTION_PAGE_CONTRACT.md)  
**OpenAPI:** [`../openapi.yaml`](../openapi.yaml)  
**TypeScript snippet:** [`../examples/detection-page-client.ts`](../examples/detection-page-client.ts)

Hard rules (do not weaken):

1. Base URL is loopback only: `http://127.0.0.1:<port>`
2. Every request carries `Authorization: Bearer <LOCAL_COMPUTE_TOKEN>`
3. Gate Detect on `detection.ffscn` / `detection.scn` from `GET /capabilities`
4. Prefer `detection.uiMessages` for banners; never invent candidates / boxes / detections client-side
5. Sample indices and ranges are **decimal strings** in JSON
6. Stub / no-GPU path ends in `BLOCKED` with `result: null` — no fake FFSCN/SCN forward

---

## 1. Auth + capabilities probe

```bash
export TOKEN=dev-token-change-me
export BASE=http://127.0.0.1:8000

curl -sS -H "Authorization: Bearer $TOKEN" "$BASE/capabilities" | jq .
```

Missing / wrong token → `401`:

```json
{ "detail": "Missing or invalid bearer token" }
```

(Exact detail string may vary; UI should treat any non-2xx + `detail` as auth failure.)

### Example 200 — blocked (typical today)

See `EXAMPLE_CAPABILITIES_BLOCKED` in `examples/detection-page-client.ts`. Shape:

| Field | Use on detection page |
|-------|------------------------|
| `detection.ffscn` / `scn` | Disable buttons when not `true` |
| `detection.uiMessages[].zh` / `.en` | Banner text by locale |
| `detection.uiMessages[].code` | Stable codes (`GPU_MISSING`, `STUB_RUNTIME`, …) |
| `gpu.uiCode` / `runtime.engine` | Debug chips only |
| `runtime.canInventResults` | Always `false`; refuse to draw fake boxes |

---

## 2. Create task

```bash
curl -sS -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{
    "kind": "ffscn.detect",
    "params": {},
    "sourcePath": "D:/data/example.iq",
    "sampleRange": { "start": "0", "end": "1048576" },
    "sampleIndices": ["0", "1024"]
  }' \
  "$BASE/tasks" | jq .
```

Success:

```json
{ "runId": "a1b2c3d4-...." }
```

Non-decimal sample index → `422` with `detail` explaining validation failure.

**Wrong (do not do):** `"sampleRange": { "start": 0, "end": 1048576 }` — numbers break uint64-safe indexing.

---

## 3. Poll task

```bash
RUN_ID=<uuid from create>
curl -sS -H "Authorization: Bearer $TOKEN" "$BASE/tasks/$RUN_ID" | jq .
```

Terminal statuses: `succeeded` | `failed` | `cancelled` | `BLOCKED`.

### Example — stub BLOCKED (no invented result)

```json
{
  "runId": "…",
  "kind": "ffscn.detect",
  "status": "BLOCKED",
  "progress": 1.0,
  "result": null,
  "blockReasons": ["BLOCKED: …"],
  "message": "…",
  "messageZh": "…",
  "uiMessages": [ { "code": "STUB_RUNTIME", "severity": "warning", "en": "…", "zh": "…" } ],
  "statusHistory": ["queued", "running", "BLOCKED"],
  "evidence": [ { "kind": "STUB_NON_TENSORRT", "notes": "…" } ]
}
```

UI: show `messageZh` / `uiMessages`; **do not** fabricate spectrum boxes.

Unknown `runId` → `404` `{ "detail": "Unknown runId: …" }`.

---

## 4. Cancel

```bash
curl -sS -X POST -H "Authorization: Bearer $TOKEN" "$BASE/tasks/$RUN_ID/cancel" | jq .
```

```json
{
  "runId": "…",
  "status": "cancelled",
  "message": "…",
  "messageZh": "…"
}
```

Cancel is bound to the **exact** `runId` and is **terminal** (late worker `BLOCKED` cannot overwrite `cancelled`).

---

## 5. TypeScript usage (Bot-B)

```ts
import {
  LocalComputeClient,
  pickUiMessageText,
  runDetectionPageFlow,
} from '../../services/local-compute/examples/detection-page-client';
// Prefer copying helpers into apps/web and importing types from @wss/contracts.

const client = new LocalComputeClient({
  baseUrl: 'http://127.0.0.1:8000',
  token: import.meta.env.VITE_LOCAL_COMPUTE_TOKEN, // never hardcode in prod builds
});

const caps = await client.getCapabilities();
if (!caps.detection.ffscn) {
  showBanner(pickUiMessageText(caps.detection.uiMessages, 'zh'));
  disableDetect('ffscn');
}

// Only when capabilities allow (today: never, until real TRT):
// await runDetectionPageFlow({ client, kind: 'ffscn.detect', sourcePath, sampleStart: '0', sampleEnd: '1048576' });
```

Types live in `@wss/contracts` (`LocalComputeCapabilities`, `LocalComputeTaskRecord`, …).

---

## 6. Error table (quick)

| HTTP | Body | UI action |
|------|------|-----------|
| 401 | `{ "detail": "…" }` | Prompt reconnect / token |
| 404 | `{ "detail": "Unknown runId: …" }` | Clear poll; show error |
| 422 | `{ "detail": "…" }` | Fix request (decimal indices) |

---

## 7. What this package does **not** do

- Does not enable real TensorRT / FFSCN / SCN forward
- Does not ship fake `candidates` / `detections` / `boxes`
- Does not bind outside `127.0.0.1`


Stable policy code `NO_FAKE_INFERENCE` appears in capabilities/task `uiMessages` when the stub refuses invented FFSCN/SCN candidates.
