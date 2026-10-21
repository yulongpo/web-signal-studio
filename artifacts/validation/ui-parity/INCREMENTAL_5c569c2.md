# INCREMENTAL_5c569c2 — C G18 NB PSD freq vline + B wave19 G02 DSP stamps (no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-22 01:31 Asia/Shanghai |
| Web tip (audit subject) | **`5c569c2`** = merge B `f7a4b13` (wave19 G02) on main that folded C `0a604d1` + A `8c563ca`/`574238f` |
| Desktop | **`17471a6`** (`signal_studio_rebuild`; NarrowbandWorkspace::updateLinkedCursors / Session::clearCursor; strip QLabels) |
| Prior Bot-A | `INCREMENTAL_088f322.md` @ Web `088f322` / audit tip `574238f` (main merge `8c563ca`) |
| Scope | **G18** NB PSD freq overlay (C `0a604d1`); **G02** strip DSP/detectRunFeed stamps (B `f7a4b13`); residuals G08/G07/G11/G19 |
| Rule | Read-only; **no matrix PASS**; `data-native-qfiledialog=false` — do not claim OS dialog MET |
| Machine | HH-laptop (`D:\project\_wt_bot_a_audit`) |

## Verified SHAs

| SHA | Role |
|-----|------|
| `5c569c24ef6208e28d137829a9a16fe60fe09c17` | `origin/main` tip = audit subject |
| `f7a4b13510b1722ec2c160f7001b5b404e2bb12a` | Bot-B wave19: G02 SpecParamStrip DSP/detectRunFeed stamps |
| `0a604d14ce052aafbdd87fbc1ae4d266b3d2bd41` | Bot-C: NB PSD freq vline via linkedCursor + Esc clears |
| `8c563ca` / `574238f` | Prior A INCREMENTAL_088f322 on main / branch |
| `17471a6488383b456281d12cb1a6d3d80290205d` | Desktop tip |

**ID map:** G18 NB PSD freq = C `0a604d1`; G02 DSP stamps = B `f7a4b13`. Tip `5c569c2`.

## Diff vs prior (`088f322` → `5c569c2`)

1. **C G18 NB PSD freq vline (`0a604d1`):** NB PSD `WaveformChart` gets `linkedX={linkedCursor.frequencyHz}` when pinned; STFT click also `pinLinkedCursor` with `cssToTimeFreq` Y→freq; PSD click `onPinX` → `source:'psd'`. Stamp `data-g18-nb-psd-freq-vline`. Esc/clear in NB now also clears `linkedCursor` so vline disappears with dwell. Matches desktop updateLinkedCursors freq carry — **MET** for prior “NB PSD freq overlay” residual. Residual: dwell-only historic pins (no `linkedCursor`) show no freq vline until STFT/PSD re-pin; not full CLOSED.
2. **B G02 DSP/detectRunFeed stamps (`f7a4b13`):** SpecParamStrip surfaces real `dspSource`, `dspFftEngineActive` (requested/active/fallback), and `detectRunFeed` path stamp (status/kind · n=). `data-strip-dsp="wave19"` / `data-strip-wave` includes wave19. Window/overlap still honest `—` with `data-strip-partial` + reason attrs (no invented hop/window). Residual: live window/overlap when Bot-D publishes to store → **not CLOSED**.
3. **G08 / G07 / G11 / G19:** No material delta this tip (B skipped G08 fluff). Residuals unchanged: full shell re-shot; full Qt Worker; PlotWidget paint nuances; **true native QFileDialog** (`data-native-qfiledialog="false"` retained).
4. **ChartMarkOverlay:** backticks **16** (untouched; no JSX regression).
5. **G06 / G17:** Unchanged — stay honest **BLOCKED**.

Bot notes: `bot-c/G18-NB-PSD-FREQ-VLINE-HANDOFF.md`, `bot-b/BOT_B_WAVE19_G02_DSP_FEED_STAMPS.md` (`matrix_pass_claimed: false`).

## Verdict summary

| ID | Prior (`088f322`) | Now (`5c569c2`) | One-liner |
|----|---------------------|-------------------|-----------|
| **G18** | PARTIAL (NB PSD freq residual) | **PARTIAL (deepened)** | NB PSD freq vline + STFT/PSD pin + Esc clears linked **MET** (`0a604d1`); dwell-only historic pin residual → **not CLOSED** |
| **G02** | PARTIAL (live DSP window/overlap) | **PARTIAL (deepened)** | DSP/FFT/detectRunFeed stamps **MET** (`f7a4b13`); window/overlap still `—` → **not CLOSED** |
| G08 / G07 / G11 | PARTIAL | **unchanged** | residuals retained |
| **G19** | PARTIAL (true native QFileDialog) | **unchanged PARTIAL** | `data-native-qfiledialog=false` — OS dialog **not** MET |
| **G17** | PARTIAL (recognition BLOCKED) | **unchanged — recognition still BLOCKED** | no invented path |
| **G06** | PARTIAL (eye/bitstream BLOCKED) | **unchanged — eye/bitstream still BLOCKED** | no invented path |
| G05 / G14 | CLOSED | **CLOSED** | unchanged |
| G25 | DOCS | **DOCS** | unchanged |

**Counts (membership-normalized, unchanged bucket sizes):** OPEN **7** · PARTIAL **16** · CLOSED **2** (G05, G14) · DOCS **1** (G25). **No PASS.**

- OPEN: G09–G10, G16, G21–G24
- PARTIAL: G01, G02–G04, G06, G07, G08, G11–G13, G15, G17, G18, G19–G20, G26
- CLOSED: G05, G14

## Focus detail

### G18 — NB PSD freq vline — **PARTIAL (deepened)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Prior Esc clear / NB wave linkedX / rail twin | MET (retained) | prior tips |
| NB PSD `linkedX` from `linkedCursor.frequencyHz` | **MET** | `data-g18-nb-psd-freq-vline` |
| STFT pin carries freq via cssToTimeFreq | **MET** | `pinLinkedCursor` source main |
| PSD click pin + Esc clears linked in NB | **MET** | `clearActivePinnedCursor` drops linkedCursor |
| Dwell-only historic pin (no linkedCursor) | residual | no freq vline until re-pin → **not CLOSED** |

### G02 — DSP feed stamps — **PARTIAL (deepened)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Prior freq/window/overlap QLabel chrome | MET (retained; empty honest) | wave14 |
| DSP source / FFT engine / detectRunFeed stamps | **MET** | `data-strip-dsp="wave19"`; real store only |
| Live window/overlap values | residual | `data-strip-partial` / no-*-in-store |

## TOP residual (max 8, parallel-friendly)

1. **G17 residual** — recognition **BLOCKED**
2. **G06 residual** — eye/bitstream/recognition **BLOCKED**; interactive STFT
3. **G19 residual** — **true native QFileDialog** (`data-native-qfiledialog=false`)
4. **G18 residual** — dwell-only historic pins without linkedCursor (NB PSD freq vline **done** @ `0a604d1`)
5. **G07 residual** — full Qt Detect Worker beyond LocalCompute
6. **G02 residual** — live DSP window/overlap (DSP/FFT/feed stamps **done** @ wave19)
7. **G08 residual** — full desktop shell re-shot
8. **G11 residual** — remaining PlotWidget paint nuances *(or G09/G16 OPEN)*

## Explicit

**matrix_pass_claimed: false**  
**No ACCEPTANCE_MATRIX PASS. No self-declared PASS.**  
G18/G02 remain PARTIAL (deepened), not CLOSED. Native QFileDialog not claimed MET. G06/G17 stay **BLOCKED**. ChartMarkOverlay backticks = **16**.