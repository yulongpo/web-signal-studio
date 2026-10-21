# Reference model inventory (Bot-E, read-only)

**Date:** 2026-10-21 (Asia/Shanghai)  
**Machine:** HH-laptop (RTX 5060 Laptop GPU, torch 2.12.0+cu132 verified)  
**Scope:** read-only survey of training/inference trees used for local-compute wiring.  
**Hard rule:** never fabricate FFSCN/SCN candidates or scores.

## Summary

| Family | Engine type | Primary weight | Size | Runtime deps | License notes |
|--------|-------------|----------------|------|--------------|---------------|
| SCN | **PyTorch** `.pth` state_dict (not TensorRT) | `D:\project\train_SCN\SCN_pretrained\epoch_105.pth` | ~29.6 MB | `torch`, `numpy`; architecture in `train_SCN/lib/*` | No LICENSE file in tree; treat as **internal/project IP** — do not redistribute weights without owner approval |
| FFSCN | **PyTorch** `.pth` state_dict (not TensorRT / not ONNX) | `D:\project\FFSCN_train2\weights\model_epoch_0210.pth` | ~11.1 MB | `torch` (CUDA preferred), `numpy`, `scipy`; GUI pipeline in `FFSCN_TEST_GUI` | No LICENSE file; same **internal/project IP** policy |

Optional FFSCN GUI weights (also PyTorch):

- `FFSCN_TEST_GUI/config/epoch_1200.pth` (~11.1 MB) — GUI default
- `config/model_epoch_0046.pth`, `model_epoch_0110.pth`
- `config/epoch_1200_backbone.pth` (backbone-only extract)

## SCN (`D:\project\train_SCN`)

- **Task:** 1D PSD carrier detection (`CarrierDetectionNet` + `CarrierResnet_new` + FPN).
- **Input:** length `16384` PSD; output grid `4096` (scale 4). Heads: `hm`, `bw` (+ post-processed `bands`/`scores`).
- **Docs:** `TRAINING_GUIDE.md` (Chinese). Default pretrained path `./SCN_pretrained/epoch_105.pth`.
- **Load API:** `torch.load(..., weights_only=True)` then `load_state_dict(strict=True)`.
- **Verified on this machine:** load + zero-tensor forward on `cuda:0` succeeded (2026-10-21).

## FFSCN (`D:\project\FFSCN_train2`)

- **Task:** wideband IQ → STFT → sliding-window carrier detection + temporal track/refine.
- **Architecture home for inference:** `FFSCN_TEST_GUI/` (`business.detection.load_model`, `detect_file`).
- **Deps (Windows):** `requirements-windows.txt` — numpy, scipy, matplotlib, PyQt5, pyqtgraph, torch≥2.5; CUDA wheel installed separately.
- **Verified env (GUI README):** Python 3.13.12 @ `D:\profiles\anaconda\python.exe`, PyTorch 2.12.0+CUDA 13.2, RTX 5060.
- **Verified on this machine:** `load_model(model_epoch_0210.pth, down_nums=11, input_length=1024)` + forward → `hm`/`bw`/`off` dict on `cuda:0`.
- **Full file pipeline:** `detect_file(engine, model, wav_path, args, device)` (needs wav/iq/psd + STFT).

## Upstream Qt worker (protocol reference only)

- `D:\project\signal_studio_rebuild\tools\detection_worker\main.cpp` — TensorRT-oriented worker protocol. **Not modified.** Current web local-compute path uses **PyTorch weights**, not TRT engines. A future TRT export would be a separate package.

## Gaps / honesty

1. Default `services/local-compute` venv does **not** ship `torch` (keeps contract tests light). Real inference requires starting the service with a CUDA-capable interpreter (e.g. Anaconda) **or** installing torch into the venv.
2. No `.engine` / TensorRT artifacts in the surveyed trees — capabilities no longer require TRT to become ready; they require **verified PyTorch load+forward**.
3. SCN needs `.ptpsd` (or compatible PSDSample) `sourcePath`. FFSCN needs wav/iq/psd readable by `FFSCN_TEST_GUI`.
4. Without weights / torch / sourcePath, capabilities and tasks stay **BLOCKED** and must not invent candidates.
