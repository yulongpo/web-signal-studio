# Detection page ↔ local-compute integration contract

**Owner:** Bot-E (`services/local-compute`)  
**Protocol:** `docs/architecture/WEB_NATIVE_PROTOCOL.md` v0.1.0  
**OpenAPI:** `services/local-compute/openapi.yaml` (also live at `GET /openapi.json`)  
**Audience:** web detection page (Bot-B shell / future detection UI)

## HTTP client examples (Bot-B)

Copy-paste TypeScript + curl/JSON: [HTTP_CLIENT_EXAMPLES.md](./HTTP_CLIENT_EXAMPLES.md) and `examples/detection-page-client.ts`.


## Base URL & auth

| Item | Value |
|------|--------|
| Base URL | `http://127.0.0.1:<port>` only (loopback) |
| Auth header | `Authorization: Bearer <session-token>` |
| Token source | `LOCAL_COMPUTE_TOKEN` env, or generated at start (logged once) |
| CORS | configured Origin only (dev: `http://localhost:5173`) |
| Missing/invalid token | `401` with `{ "detail": "..." }` |

## Endpoints the detection page must call

### `GET /capabilities`

Probe before enabling Detect buttons.

Response (relevant fields):

```json
{
  "protocolVersion": "0.1.0",
  "serviceVersion": "...",
  "bindAddressPolicy": "loopback-only",
  "bindHost": "127.0.0.1",
  "authRequired": true,
  "dsp": { "fft": true, "psd": false, "stft": false, "ddc": false, "reasons": ["..."] },
  "detection": {
    "ffscn": false,
    "scn": false,
    "reasons": ["BLOCKED: ..."],
    "uiMessages": [
      {
        "code": "GPU_MISSING",
        "severity": "error",
        "en": "No NVIDIA GPU toolchain detected. Detection (FFSCN/SCN) is unavailable.",
        "zh": "未检测到 NVIDIA GPU 工具链，检测（FFSCN/SCN）不可用。"
      }
    ]
  },
  "models": [ { "id": "...", "path": "...", "sha256": "...", "present": false, "notes": "..." } ],
  "notes": ["..."]
}
```

**UI rules**

1. If `detection.ffscn !== true`, disable FFSCN detect; if `detection.scn !== true`, disable SCN detect.
2. Prefer `detection.uiMessages[].zh` / `.en` for banners (pick locale). Fall back to `reasons` only for debug.
3. Never invent detection candidates client-side when capabilities report blocked.

### `POST /tasks`

Body (sample indices are **decimal strings**, never JSON numbers):

```json
{
  "kind": "ffscn.detect",
  "params": {},
  "sourcePath": "/path/to/iq",
  "sampleRange": { "start": "0", "end": "1048576" },
  "sampleIndices": ["0", "1024"]
}
```

Success: `{ "runId": "<uuid>" }`  
Validation error (non-decimal index): `422` `{ "detail": "..." }`

### `GET /tasks/{runId}`

Poll progress. Relevant fields:

| Field | Meaning |
|-------|---------|
| `status` | `queued` \| `running` \| `succeeded` \| `failed` \| `cancelled` \| `BLOCKED` |
| `progress` | 0..1 |
| `message` / `messageZh` | Primary English / Chinese status line |
| `uiMessages` | Same shape as capabilities; present when blocked |
| `blockReasons` | Machine-oriented BLOCKED strings |
| `result` | **Must be `null` for detection when blocked**; never contains `candidates` / `detections` / `boxes` invented by stub |

### `POST /tasks/{runId}/cancel`

Cancel bound to **exact** `runId`. Response includes `status`, `message`, `messageZh`.

## BLOCKED / no-GPU degradation semantics

| Condition | `ffscn`/`scn` | Stable `uiMessages[].code` | Exact EN | Exact ZH |
|-----------|---------------|----------------------------|----------|----------|
| No nvidia-smi / no GPU rows | false | `GPU_MISSING` | No NVIDIA GPU toolchain detected. Detection (FFSCN/SCN) is unavailable. | 未检测到 NVIDIA GPU 工具链，检测（FFSCN/SCN）不可用。 |
| GPU seen, CUDA/TRT unverified | false | `GPU_UNVERIFIED` | GPU visible but CUDA/TensorRT runtime is not verified. Detection stays blocked. | 已看到 GPU，但 CUDA/TensorRT 运行时未核验，检测仍不可用。 |
| GPU probe exception | false | `GPU_PROBE_ERROR` | GPU probe failed. Detection (FFSCN/SCN) is unavailable. | GPU 探测失败，检测（FFSCN/SCN）不可用。 |
| No FFSCN model file | false | `MODEL_MISSING_FFSCN` | FFSCN model file is missing. Detection cannot run. | 缺少 FFSCN 模型文件，无法运行检测。 |
| No SCN model file | false | `MODEL_MISSING_SCN` | SCN model file is missing. Detection cannot run. | 缺少 SCN 模型文件，无法运行检测。 |
| Configured path missing | false | `MODEL_PATH_MISSING` | Configured detection model path is missing on disk. | 配置的检测模型路径在磁盘上不存在。 |
| Hash mismatch | false | `MODEL_HASH_MISMATCH` | Detection model hash/version does not match the configured expectation. | 检测模型哈希/版本与配置期望不一致。 |
| Hash unread | false | `MODEL_HASH_UNAVAILABLE` | Detection model hash could not be read; treating as blocked. | 无法读取检测模型哈希，按不可用处理。 |
| Stub worker (always today) | false | `STUB_RUNTIME` | Local compute is in stub mode (no TensorRT). Detection will not invent results. | 本地计算处于占位模式（无 TensorRT），检测不会伪造结果。 |
| Policy guard | false | `NO_FAKE_INFERENCE` | Refusing to invent FFSCN/SCN detection candidates. | 拒绝伪造 FFSCN/SCN 检测候选结果。 |

**Hard rule:** service stays up under degradation; DSP stub (`dsp.fft`) may remain true; detection stays unavailable; **no fake forward results**.

## Error shapes

| HTTP | Body |
|------|------|
| 401 | `{ "detail": "<string>" }` |
| 404 | `{ "detail": "Unknown runId: ..." }` |
| 422 | `{ "detail": "<string or validation array>" }` |

## Decimal sample indices

Align with `@wss/contracts` `SampleIndex`: canonical unsigned decimal strings in JSON. Never use `Number` for indices that may exceed `2^53-1`.

## Suggested detection-page flow

1. Start local-compute on loopback; read token.
2. `GET /capabilities` → render `uiMessages` banner; gate buttons on `ffscn`/`scn`.
3. On Detect: `POST /tasks` with decimal `sampleRange`.
4. Poll `GET /tasks/{runId}` until terminal; if `BLOCKED`, show `messageZh`/`uiMessages`, do not draw fake boxes.
5. Optional: `POST .../cancel` with the same `runId`.


## Structured precheck (`gpu` / `runtime`) — v0.1.3

`GET /capabilities` also returns:

```json
{
  "gpu": {
    "toolchainVisible": false,
    "runtimeVerified": false,
    "name": null,
    "driverVersion": null,
    "reason": "nvidia-smi not found (no GPU toolchain visible)",
    "uiCode": "GPU_MISSING"
  },
  "runtime": {
    "engine": "STUB_NON_TENSORRT",
    "tensorrtVerified": false,
    "cudaVerified": false,
    "canInventResults": false,
    "modelSearchRoots": [".../models"],
    "ffscnPresent": false,
    "scnPresent": false,
    "ffscnReady": false,
    "scnReady": false
  }
}
```

**UI rules (additive)**

1. Prefer `detection.uiMessages` for banners; use `gpu.uiCode` / `runtime.engine` for debug chips.
2. `runtime.canInventResults` is always `false`; never draw fake boxes when false.
3. `runtime.ffscnReady` / `scnReady` mirror `detection.ffscn` / `scn` (false until real TRT).

## Task status machine

```
queued -> running -> {succeeded | failed | cancelled | BLOCKED}
```

- `POST .../cancel` is bound to the **exact** `runId` and is **terminal**: late worker writes (including `BLOCKED`) cannot overwrite `cancelled`.
- `GET /tasks/{runId}` may include `statusHistory` (e.g. `["queued","running","cancelled"]`) for clarity.
- Detection stub paths always label evidence with `STUB_NON_TENSORRT` and never invent candidates.
