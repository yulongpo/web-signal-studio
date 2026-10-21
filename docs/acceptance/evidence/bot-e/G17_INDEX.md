# Bot-E G17 Detect/engine honesty — 2026-10-21 Asia/Shanghai

**Baseline:** `c63f1de`  
**Branch:** `work/bot-e-g17-detect`  
**matrix_pass_claimed:** false

## Hard constraints

- Engines only under `signal_studio_rebuild\...\detection-models\`
- IQ only `resources\sigmf_data_demo`
- No fake candidates (`canInventResults=false`)

## Gap vs prior TRT (ae69401 / 563458a)

Already OK: discovery, cancel, precheck, WEIGHT_HASH, TRT ready path.

Filled for G17: **REAL_RUNTIME** copy was PyTorch-only while live engine is `TENSORRT_CUDA` — now engine-agnostic + `TENSORRT_OK` when verified; DetectPage surfaces `engine` / `tensorrtVerified`.

## Verification

- pytest degrade: **64 passed**
- Live Anaconda TRT: `engine=TENSORRT_CUDA`, `uiCodes=[REAL_RUNTIME, TENSORRT_OK]`, `canInventResults=false`
- cancel / precheck tests: pass

See `g17_capabilities_2026-10-21.json`, `g17_summary_2026-10-21.json`.
