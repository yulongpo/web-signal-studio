# BOT_B_A3 — SpecParamStrip dspAnalysisSamples stamp (no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-22 Asia/Shanghai |
| Base | `da9fdab56ddf108816a5024d842f3d8263032d40` (`merge(bot-b): A5`) |
| Branch | `work/bot-b-ui` |
| matrix_pass_claimed | **false** |
| ui_parity_pass_claimed | **false** |
| pass_claimed | **false** |
| Fence | UI stamp only; no DSP contract change; no Multitaper/Burg/non-PoT/G06/G17 invent |

## What landed

SpecParamStrip (`ChartParamStrip.tsx`) displays D-published **`dspAnalysisSamples`** (post-resolve pre-PoT) clearly distinct from **`dspFftSizeActive`** (PoT FFTn):

- Main strip: `chart-strip-qlabel-analysis-samples` / `-value` (`AN` label)
- Overflow: `overflow-spectral-analysis-samples` shows AnalysisN + parenthetical FFTn
- Attrs: `data-dsp-analysis-samples`, `data-dsp-fft-size-active`, `data-same-as-fft`, `data-distinct-from="dspFftSizeActive"`

Reads existing uiStore fields only — does not alter `setDspFftAnalysisParams` / contracts.

## Changed paths

- `apps/web/src/components/ChartParamStrip.tsx`
- evidence (both trees)

## Honesty

G02 remains PARTIAL. Stamp only; never PASS.
