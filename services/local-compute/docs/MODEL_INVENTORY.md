# Reference model inventory (Bot-E)

**Date:** 2026-10-21 (Asia/Shanghai)
**Hard rules (CAO + G26 PRE-2/PRE-3):**
- Detection models = TensorRT `.engine` under `signal_studio_rebuild` **only**
- IQ = `signal_studio_rebuild\resources\sigmf_data_demo` **only**
- Never fabricate candidates. TRT runnable => real TRT; else BLOCKED / TENSORRT_RUNTIME_MISSING (legacy TENSORRT_NA alias). `matrix_pass_claimed: false` without evidence.

## Canonical engines

| Family | File | Path |
|--------|------|------|
| FFSCN | `ffscn_epoch1200_dynamic_fp32.engine` | `out\vs2026-qt611-release_bin\detection-models\ffscn-gui-iq-v1\` |
| SCN | `scn_model.engine` | `out\vs2026-qt611-release_bin\detection-models\scn-max-psd-v1\` |

Manifest TensorRT **10.11.0.33**. Published SHA-256 (rebuild R6 MODEL_DEPLOYMENT):
- FFSCN `4e14e422e7966eb6f554e322c2d390534650e1b8dd0cee6e04f2ed4305cefc03`
- SCN `ae89d04332758d466846b71afc849c446500a82a8bd74fd8c671927247746627`

## IQ

`D:\project\signal_studio_rebuild\resources\sigmf_data_demo\` (`0000000.sigmf-*`).

## Runtime

- Ready only after real deserialize smoke => `engine=TENSORRT_CUDA`, `tensorrtVerified=true`.
- Else BLOCKED codes: `TENSORRT_RUNTIME_MISSING` / `ENGINE_LOAD_FAILED` / `ENGINE_MISSING` (+ legacy `TENSORRT_NA`). `canInventResults=false`.
- Contract `.venv` may omit TRT => honest degrade.
