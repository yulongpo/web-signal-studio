# Real model integration (Bot-E)

Aligned with G26 / QA_CHECKLIST PRE-2 (IQ) and PRE-3 (engine).

## Env

| Env | Meaning |
|-----|---------|
| `LOCAL_COMPUTE_MODEL_DIR` | rebuild `detection-models` |
| `LOCAL_COMPUTE_FFSCN_PATH` / `LOCAL_COMPUTE_SCN_PATH` | explicit `.engine` |
| `LOCAL_COMPUTE_IQ_DIR` | `resources\sigmf_data_demo` only |
| `LOCAL_COMPUTE_DISABLE_TENSORRT` | `1` = force TRT off (tests) |

```powershell
$env:LOCAL_COMPUTE_MODEL_DIR = 'D:\project\signal_studio_rebuild\out\vs2026-qt611-release_bin\detection-models'
$env:LOCAL_COMPUTE_FFSCN_PATH = 'D:\project\signal_studio_rebuild\out\vs2026-qt611-release_bin\detection-models\ffscn-gui-iq-v1\ffscn_epoch1200_dynamic_fp32.engine'
$env:LOCAL_COMPUTE_SCN_PATH   = 'D:\project\signal_studio_rebuild\out\vs2026-qt611-release_bin\detection-models\scn-max-psd-v1\scn_model.engine'
$env:LOCAL_COMPUTE_IQ_DIR     = 'D:\project\signal_studio_rebuild\resources\sigmf_data_demo'
```

## TensorRT

- If TRT can run: real deserialize + forward (`TENSORRT_CUDA`), never invent scores.
- If not: explicit BLOCKED (`TENSORRT_RUNTIME_MISSING` / `ENGINE_LOAD_FAILED` / legacy `TENSORRT_NA`).

## Start

```powershell
$env:PATH = 'D:\project\signal_studio_rebuild\out\vs2026-qt611-release_bin;' + $env:PATH
& 'D:\profiles\anaconda\python.exe' -m pip install -r requirements.txt tensorrt==10.11.0.33
& 'D:\profiles\anaconda\python.exe' -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```
