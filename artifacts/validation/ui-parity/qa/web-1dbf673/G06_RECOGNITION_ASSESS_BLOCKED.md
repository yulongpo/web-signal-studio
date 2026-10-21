# Bot-E G06 narrowband recognition assessment (TRT/FFSCN)

- **date**: 2026-10-21 (Asia/Shanghai)
- **sync tip**: `ba868e4895bd6170cfa91d3642fe0dd516686242` (origin/main; includes D `d925a2e`)
- **verdict**: **BLOCKED** (cannot honestly wire FFSCN/SCN TRT as narrowband recognition)
- **matrix_pass_claimed**: false
- **code tip**: N/A (assessment only; no worker path added)

## Contract (D G06)

Source: `apps/web/src/dsp/narrowbandPageDspContracts.ts`

- `NarrowbandRecognitionRequest`: DDC tuning + `sigmf_data_demo` IQ + optional `modelId`
- `NarrowbandRecognitionResult`: currently **only** `{ status: 'BLOCKED', reasonCode: 'RECOGNITION_ENGINE_MISSING', labels: [] }`
- Stub `computeNarrowbandRecognition` always returns empty labels; UI copy says Bot-E TensorRT/FFSCN must supply a verified engine
- TypeScript result union has **no `status: 'ok'` variant yet** — even a real path would need a contract extension (Bot-D/F) before UI can consume labels honestly

## What local-compute FFSCN/SCN actually are

| Item | Fact |
|---|---|
| Task kinds | `ffscn.detect` / `scn.detect` (wideband **detection**) |
| Canonical engines | `…/detection-models/ffscn-gui-iq-v1/ffscn_epoch1200_dynamic_fp32.engine`, `…/scn-max-psd-v1/scn_model.engine` |
| Manifest schema | `signalstudio-detection-model-package-v1/v2` |
| Heads | `hm` / `bw` / `off` (CenterNet-style detection), **not** multiclass logits |
| Outputs today | candidates with `fc_hz`/`bw_hz`/scores or PSD bands — **not** modulation class labels |
| Capabilities | `detection` only; `canInventResults=false`; no `recognition` capability surface |

## Upstream rebuild (RO)

- Tree engines under hard-constraint paths are **detection-models** only; both canonical `.engine` files present and previously proven for detect TRT on Anaconda.
- Search for recognition-specific `.engine` under `D:\project\signal_studio_rebuild`: **none**.
- `docs/prototype/nb-a1.1-dl/Signal_Studio_Narrowband_Interaction_Spec_A1.1_DL.md` §11:
  - Product wants **DL modulation recognition** (Top-K class scores: BPSK/QPSK/…).
  - Formal models: separate classifier manifests (`multiclass_logits`, ONNX/PyTorch), **not** FFSCN/SCN detect packages.
  - Prototype explicitly used **synthetic** scores; no shipped recognition weights in that spec.

## Gap (contract vs local-compute)

1. **Task mismatch**: G06 needs modulation **classification labels**; FFSCN/SCN provide wideband **signal detection** boxes/bands.
2. **Engine missing**: No tree-allowed TensorRT recognition classifier; hard constraint forbids inventing/using out-of-tree weights.
3. **API mismatch**: local-compute has detect task/result shapes only; no `*.recognize` kind, no recognition capabilities, no label-list result mapped to `NarrowbandRecognitionLabel`.
4. **Contract incompleteness**: result type is BLOCKED-only; wiring would still leave UI stuck unless D/F extend to an honest `ok` shape.
5. **Anti-fake**: Remapping detect candidates → fake modulation labels would violate 禁假 / `canInventResults=false`.

## Decision

**BLOCKED** — Bot-E will **not** claim CAN_TAKE for G06 recognition against current FFSCN/SCN engines.

Unblock requires (product/CAO), not this tip:

1. Provide a **recognition** TensorRT (or approved) model package under the rebuild tree with multiclass label manifest; **or** explicitly redefine G06 to a different engine family.
2. Extend contracts (`NarrowbandRecognitionResult` ok path + local-compute recognition task/capabilities).
3. Keep IQ limited to `resources\sigmf_data_demo`; keep detect TRT path separate (G17 remains detection-only).

Until then: UI must stay on `RECOGNITION_ENGINE_MISSING` / empty labels.
