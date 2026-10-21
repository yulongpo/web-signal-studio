# Detection page — local-compute integration contract

**Owner:** Bot-E (`services/local-compute`)  
**Protocol:** `docs/architecture/WEB_NATIVE_PROTOCOL.md` v0.1.0  
**Service:** `0.1.5-ffscn-e2e`  
**OpenAPI:** `services/local-compute/openapi.yaml` (also live at `GET /openapi.json`)  
**Audience:** web detection page (Bot-B `DetectPage` / `localCompute/gating.ts`)

## HTTP client examples (Bot-B)

Copy-paste TypeScript + curl/JSON: [HTTP_CLIENT_EXAMPLES.md](./HTTP_CLIENT_EXAMPLES.md) and `examples/detection-page-client.ts`.

## Bot-B alignment (hard)

1. Prefer `detection.uiMessages[].zh` / `.en` via `bannerTextsFromCapabilities` (see `apps/web/src/localCompute/gating.ts`).
2. Gate Detect buttons only on `detection.ffscn` / `detection.scn` + online/auth (`canRunDetect`).
3. Stable `uiMessages[].code` values are listed in `@wss/contracts` `LOCAL_COMPUTE_UI_CODES`.
4. **`STUB_RUNTIME` EN/ZH must match** `LOCAL_COMPUTE_STUB_RUNTIME_COPY` and Bot-B `gating.test.ts` fixture — do not drift.
5. Never invent FFSCN/SCN candidates client-side; when `status === 'BLOCKED'` or `result == null`, do not draw boxes.

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

Probe before enabling Detect buttons. Gate on `detection.ffscn` / `detection.scn`. Prefer `uiMessages` for banners.

### `POST /tasks`

Sample indices are **decimal strings**. For real FFSCN/SCN, pass a real `sourcePath` (WAV stereo 16-bit I/Q or supported IQ). Missing `sourcePath` → `BLOCKED` + `SOURCE_MISSING` (no fabricated candidates).

### `GET /tasks/{runId}`

Terminal statuses: `succeeded` | `failed` | `cancelled` | `BLOCKED`.  
Detection `result` is non-null only when `verifiedForward=true` from a real engine (`TENSORRT_CUDA` / `PYTORCH_CUDA` / `PYTORCH_CPU`).

### `POST /tasks/{runId}/cancel`

Bound to exact `runId`; cancel is terminal.

## Stable `uiMessages` codes (exact copy)

| code | severity | Exact EN | Exact ZH |
|------|----------|----------|----------|
| GPU_MISSING | `error` | No NVIDIA GPU toolchain detected. Detection (FFSCN/SCN) is unavailable. | 未检测到 NVIDIA GPU 工具链，检测（FFSCN/SCN）不可用。 |
| GPU_UNVERIFIED | `warning` | GPU visible but CUDA/TensorRT runtime is not verified. Detection stays blocked. | 已看到 GPU，但 CUDA/TensorRT 运行时未核验，检测仍不可用。 |
| GPU_PROBE_ERROR | `error` | GPU probe failed. Detection (FFSCN/SCN) is unavailable. | GPU 探测失败，检测（FFSCN/SCN）不可用。 |
| TORCH_MISSING | `error` | PyTorch is not available in this Python. Detection cannot run real inference. | 当前 Python 环境没有可用的 PyTorch，无法进行真推理。 |
| TORCH_CPU_ONLY | `warning` | PyTorch is available on CPU only. Real inference may be slow. | 仅有 CPU 版 PyTorch，真推理可能较慢。 |
| TORCH_CUDA_OK | `info` | PyTorch CUDA runtime verified for local detection. | 已核验 PyTorch CUDA 运行时，可用于本地检测。 |
| MODEL_MISSING_FFSCN | `error` | FFSCN model file is missing. Detection cannot run. | 缺少 FFSCN 模型文件，无法运行检测。 |
| MODEL_MISSING_SCN | `error` | SCN model file is missing. Detection cannot run. | 缺少 SCN 模型文件，无法运行检测。 |
| MODEL_PATH_MISSING | `error` | Configured detection model path is missing on disk. | 配置的检测模型路径在磁盘上不存在。 |
| MODEL_HOME_MISSING | `error` | Algorithm source home is missing (set LOCAL_COMPUTE_FFSCN_HOME / LOCAL_COMPUTE_SCN_HOME). | 缺少算法源码目录（请设置 LOCAL_COMPUTE_FFSCN_HOME / LOCAL_COMPUTE_SCN_HOME）。 |
| MODEL_HASH_MISMATCH | `error` | Detection model hash/version does not match the configured expectation. | 检测模型哈希/版本与配置期望不一致。 |
| WEIGHT_HASH_MISMATCH | `error` | Detection model hash/version does not match the configured expectation. | 检测模型哈希/版本与配置期望不一致。 |
| MODEL_HASH_UNAVAILABLE | `warning` | Detection model hash could not be read; treating as blocked. | 无法读取检测模型哈希，按不可用处理。 |
| MODEL_LOAD_FAILED | `error` | Detection weights were found but failed to load/forward. Detection stays blocked. | 已找到检测权重但加载/前向失败，检测仍不可用。 |
| SOURCE_MISSING | `error` | sourcePath is required for real detection; refusing to invent candidates. | 真检测需要 sourcePath，拒绝伪造候选结果。 |
| INFERENCE_FAILED | `error` | Real detection inference failed. No fabricated candidates were returned. | 真检测推理失败，未返回任何伪造候选。 |
| STUB_RUNTIME | `error` | Local compute is in stub mode (no TensorRT). Detection will not invent results. | 本地计算处于占位模式（无 TensorRT），检测不会伪造结果。 |
| REAL_RUNTIME | `info` | Verified real detection runtime is ready for this family (TensorRT or PyTorch). | 该检测族别的真推理运行时已就绪（TensorRT 或 PyTorch）。 |
| NO_FAKE_INFERENCE | `error` | Refusing to invent FFSCN/SCN detection candidates. | 拒绝伪造 FFSCN/SCN 检测候选结果。 |
| TENSORRT_RUNTIME_MISSING | `error` | TensorRT runtime missing/unusable; .engine detection stays blocked (no invented candidates). | TensorRT 运行时不可用，.engine 检测保持阻断（拒绝伪造候选）。 |
| ENGINE_MISSING | `error` | Canonical TensorRT .engine not found under signal_studio_rebuild detection-models. | 未在 signal_studio_rebuild detection-models 下找到规定 TensorRT .engine。 |
| ENGINE_LOAD_FAILED | `error` | TensorRT .engine deserialize/load failed; detection stays blocked. | TensorRT .engine 反序列化/加载失败，检测保持阻断。 |
| TENSORRT_OK | `info` | TensorRT runtime importable. | TensorRT 运行时可导入。 |
| TENSORRT_NA | `error` | TensorRT .engine weights are N/A (no TensorRT runtime). Detection stays blocked. | TensorRT .engine 权重不可用（未接入 TensorRT 运行时），检测保持阻断。 |
| ONNX_NA | `error` | ONNX weights are N/A (no ONNX runtime). Detection stays blocked. | ONNX 权重不可用（未接入 ONNX 运行时），检测保持阻断。 |

**Hard rule:** service stays up under degradation; DSP stub (`dsp.fft`) may remain true; detection stays unavailable until verified; **no fake forward results**.


**REAL_RUNTIME honesty (G17):** banner `REAL_RUNTIME` is engine-agnostic. When TensorRT `.engine` smoke passes, also emit `TENSORRT_OK` and set `runtime.engine=TENSORRT_CUDA` / `tensorrtVerified=true`. Detect page debug chips must show the real `runtime.engine` — never imply PyTorch when TRT is the path. Detection `result` is non-null only when `verifiedForward=true` from a real engine (`TENSORRT_CUDA` / `PYTORCH_CUDA` / `PYTORCH_CPU`).

## Structured precheck (`gpu` / `runtime`)

Prefer `detection.uiMessages` for banners; use `gpu.uiCode` / `runtime.engine` for debug chips.  
`runtime.canInventResults` is always `false`.

## Task status machine

```
queued -> running -> {succeeded | failed | cancelled | BLOCKED}
```

- Cancel cannot be overwritten by late worker writes.
- `statusHistory` may list transitions for debug.

## FFSCN full-file E2E

- Pytest: `tests/test_ffscn_e2e.py`
- Fixture: `tests/fixtures/synthetic_iq_stereo.wav` (uncompressed 16-bit stereo I/Q)
- Live path: skip-if-missing when CUDA / weights / `LOCAL_COMPUTE_FFSCN_HOME` absent
- Contract path (default `.venv` with `LOCAL_COMPUTE_DISABLE_TORCH=1`): must stay BLOCKED / no fake candidates

Details: [REAL_MODEL_INTEGRATION.md](./REAL_MODEL_INTEGRATION.md), inventory: [MODEL_INVENTORY.md](./MODEL_INVENTORY.md).
