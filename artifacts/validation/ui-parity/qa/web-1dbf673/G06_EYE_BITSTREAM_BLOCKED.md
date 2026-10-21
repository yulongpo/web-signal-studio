# Bot-D G06 eye / bitstream re-eval @ 97fc7c0 (no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-21 ~23:10 Asia/Shanghai |
| Baseline | **`97fc7c0`** (`merge(bot-g): ui-parity evidence web-8733cc1`) |
| Branch | `work/bot-d-dsp` |
| IQ rule | Runtime **only** `sigmf_data_demo`; fixtures may use synthetic tones |
| matrix_pass_claimed | **false** |

## Sync

Hard reset `D:\project\wss-wt-d` → `97fc7c0ab94507fc2c9d534b1c3e568458e128c7`. Confirmed HEAD.

## Re-evaluation method

1. Tree search for timing sync / slicer / Gardner / Mueller / hard-decision PSK-QAM demod in `packages/dsp-wasm`, `apps/web/src/dsp`, `services`.
2. Inspect Worker/WASM surface: FFT, FIR, DDC, PSD, STFT, rational resample only — **no** symbol timing recovery.
3. Inspect `sigmf_data_demo/0000000.sigmf-meta`: annotations carry `core:label` (e.g. `64qam` / `bpsk` / `2gmsk`) + freq edges + SNR; **no** `symbol_rate` / samples-per-symbol / baud.
4. UI `nbSymbolRate` (`uiStore`, default `'1e6'`) is chrome placeholder — **not** annotation-derived, not verified against IQ.

## Eye diagram → **BLOCKED** (`EYE_TIMING_SYNC_MISSING`)

| Question | Answer |
|----------|--------|
| Can a minimal honest eye land? | **No** |
| Why | Eye needs known SPS **and** symbol-aligned sampling (Gardner/Mueller or equivalent). Label-only annotations + UI string SPS would produce a **fake** overlay, not product parity. |
| Action | Keep stub `computeNarrowbandEyeDiagram` → `NARROWBAND_EYE_BLOCKED`. No fake traces. |

## Bitstream → **BLOCKED** (`BITSTREAM_DEMOD_MISSING`)

| Question | Answer |
|----------|--------|
| Can a real bitstream land? | **No** |
| Why | Product bitstream needs hard decisions + decoder. In-tree demod is **AM/FM/RMS envelope preview only** (`simpleDemodFromIq` / `narrowbandDemodDdc`). No PSK/QAM decision path. |
| Action | Keep stub `computeNarrowbandBitstreamDemod` → empty `bits`. No fake bits. |

## Unchanged wired paths (prior tips)

Constellation + baseband STFT (`narrowbandModulationDdc`) and AM/FM/RMS preview (`narrowbandDemodDdc`) remain WIRED from `sigmf_data_demo` → Worker DDC. Recognition stays Bot-E `RECOGNITION_ENGINE_MISSING`.

## Explicit

**matrix_pass_claimed: false** — no ACCEPTANCE PASS, no self-declared PASS.
