# Bot-E TRT engines (CAO) — 2026-10-21 Asia/Shanghai

**Base:** `fa5a720`  
**Branch:** `work/bot-e-trt-engines`  
**matrix_pass_claimed:** false

## Hard constraints

- Engines only under `signal_studio_rebuild\...\detection-models\`
- IQ only `resources\sigmf_data_demo`
- No fake candidates (`canInventResults=false`)

## Verification

- Contract pytest: **62 passed** (`.venv`, TRT disabled)
- Live TRT (Anaconda + tensorrt 10.11.0.33 + CUDA): both engines deserialize; `/capabilities` ready; real forward on `0000000.sigmf-data` => `engine=TENSORRT_CUDA`, `verifiedForward=true`

See `trt_engines_capabilities_2026-10-21.json`, `trt_engines_summary_2026-10-21.json`.
