# INCREMENTAL_2f8162b — C G18 NB multi-view STFT/wave linkedCursor polish (no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-22 01:52 Asia/Shanghai |
| Web tip (audit subject) | **`2f8162b`** = merge C `99e1eba` (NB STFT/wave linkedCursor) on main after G `3e5b746` / A `1a7afff` |
| Desktop | **`17471a6`** (`signal_studio_rebuild`; NarrowbandWorkspace::updateLinkedCursors → waveform_/psd_/stft_ setLinkedCursor) |
| Prior Bot-A | `INCREMENTAL_9256a2d.md` @ Web `9256a2d` / audit tip `1a7afff` |
| Scope | **G18** multi-view polish residual (STFT SpectrumChart + wave linkedCursor); note B SpectralSettings **not** in tip |
| Rule | Read-only; **no matrix PASS**; CLOSED only with full desktop parity |
| Machine | HH-laptop (`D:\project\_wt_bot_a_audit`) |

## Verified SHAs

| SHA | Role |
|-----|------|
| `2f8162bedc05097ebb0fecd63521c82a66e54b1d` | `origin/main` tip = audit subject |
| `99e1eba6a0f2ce56d665a53309e92c862094eb0e` | Bot-C: G18 NB multi-view STFT/wave linkedCursor polish |
| `3e5b746` | Bot-G evidence web-9256a2d (prior tip; soft skim) |
| `1a7afff` | Prior Bot-A INCREMENTAL_9256a2d |
| `17471a6488383b456281d12cb1a6d3d80290205d` | Desktop tip |

**ID map:** G18 STFT/wave multi-view = C `99e1eba`. Tip `2f8162b`.

## Diff vs prior (`9256a2d` → `2f8162b`)

1. **C G18 STFT linked crosshair (`99e1eba`):** `resolveNbStftLinkedCursor` → NB STFT `SpectrumChart` `linkedCursor` (time X, freq Y) when pinned, or dwell-only via dwell time + resolved PSD freq. Stamp `data-g18-nb-stft-linked-cursor`. Matches desktop `stft_->setLinkedCursor` — **MET** for observe-STFT slice of prior “full multi-view polish” residual.
2. **C G18 wave linkedX polish (`99e1eba`):** `resolveNbWaveLinkedTimeSec` prefers `linkedCursor.timeSec` when pinned else dwell map; `onPinX` pins time (preserve/center freq) like AuxChartHost / desktop Curve. Helper + vitest `nbMultiViewLinked`. — **MET**.
3. **Retained:** PSD freq vline / dwell-only recovery / Esc / scrubber from prior tips.
4. **Not CLOSED:** Bot-C STATUS — full desktop multi-view (modulation/recognition STFT panes) still open; **NB observe path only**. → **G18 stays PARTIAL**.
5. **B SpectralSettings:** **Not in this tip** (components delta = NarrowbandObserveCharts + helpers only). Do **not** invent MET for G02 editable SpectralSettings / stftN→compute residual from `INCREMENTAL_9256a2d`.
6. **G `3e5b746`:** Evidence for prior tip `9256a2d` only — PNG alone never CLOSE.
7. **ChartMarkOverlay:** backticks **16**. **G06/G17:** **BLOCKED**. **G19:** `data-native-qfiledialog="false"`.

Bot notes: `bot-c/G18-NB-MULTI-VIEW-STFT-WAVE-HANDOFF.md`, `bot-c/STATUS.md` (`matrix_pass_claimed: false`).

## Verdict summary

| ID | Prior (`9256a2d`) | Now (`2f8162b`) | One-liner |
|----|---------------------|-------------------|-----------|
| **G18** | PARTIAL (multi-view polish residual) | **PARTIAL (deepened)** | STFT SpectrumChart linkedCursor + wave prefer timeSec/onPinX **MET** (`99e1eba`); modulation/recognition panes → **not CLOSED** |
| **G02** | PARTIAL (SpectralSettings/stftN residual) | **unchanged PARTIAL** | B SpectralSettings **absent** this tip — no invented MET |
| G07 / G08 / G11 / G19 | PARTIAL | **unchanged** | residuals retained |
| **G17** | PARTIAL (recognition BLOCKED) | **unchanged — recognition still BLOCKED** | no invented path |
| **G06** | PARTIAL (eye/bitstream BLOCKED) | **unchanged — eye/bitstream still BLOCKED** | no invented path |
| G05 / G14 | CLOSED | **CLOSED** | unchanged |
| G25 | DOCS | **DOCS** | unchanged |

**Counts (membership-normalized, unchanged bucket sizes):** OPEN **7** · PARTIAL **16** · CLOSED **2** (G05, G14) · DOCS **1** (G25). **No PASS.**

- OPEN: G09–G10, G16, G21–G24
- PARTIAL: G01, G02–G04, G06, G07, G08, G11–G13, G15, G17, G18, G19–G20, G26
- CLOSED: G05, G14

## Focus detail

### G18 — STFT/wave multi-view polish — **PARTIAL (deepened)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Prior PSD vline / dwell-only / Esc / scrubber / rail twin | MET (retained) | prior tips |
| STFT SpectrumChart linkedCursor (time×freq) | **MET** | `resolveNbStftLinkedCursor`; `data-g18-nb-stft-linked-cursor` |
| Wave linkedX prefer store time + onPinX | **MET** | `resolveNbWaveLinkedTimeSec` |
| Modulation / recognition STFT panes linked | residual | Bot-C STATUS — observe path only → **not CLOSED** |

## TOP residual (max 8, parallel-friendly)

1. **G17 residual** — recognition **BLOCKED**
2. **G06 residual** — eye/bitstream/recognition **BLOCKED**; interactive STFT
3. **G19 residual** — **true native QFileDialog** (`data-native-qfiledialog=false`)
4. **G18 residual** — modulation/recognition STFT panes linked (NB observe wave/PSD/STFT **done** @ `99e1eba`)
5. **G07 residual** — full Qt Detect Worker beyond LocalCompute
6. **G02 residual** — editable SpectralSettings / stftN→compute (strip readout **done** @ wave21; B settings **not** this tip)
7. **G08 residual** — full desktop shell re-shot
8. **G11 residual** — remaining PlotWidget paint nuances *(or G09/G16 OPEN)*

## Explicit

**matrix_pass_claimed: false**  
**No ACCEPTANCE_MATRIX PASS. No self-declared PASS.**  
G18 remains **PARTIAL** (deepened), **not CLOSED**. B SpectralSettings MET **not** invented. G06/G17 stay **BLOCKED**. ChartMarkOverlay backticks = **16**.