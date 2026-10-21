# INCREMENTAL_f72184c — B wave25 G02 SpecParamStrip on D StftRequest contract (no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-22 02:18 Asia/Shanghai |
| Web tip (audit subject) | **`f72184c`** = `f72184ce875aa6181322e463451c9b9d91131f4b` |
| Desktop | **`17471a6`** (`SpectralSettingsWidget`) |
| Prior Bot-A | `INCREMENTAL_ba3bb76/` @ Web `ba3bb76` / audit tip `24539f2` (`24539f2ca5591d70d4cb633dc54e0232aef1bf75`); CAO merged → `5fc5788` |
| Scope | **G02** SpecParamStrip / SpectralSettings overflow wires D contract into real STFT requests; light G08/G18 regression scan |
| Rule | Read-only; **no matrix PASS**; BLOCKED methods stay BLOCKED (never claim MET) |
| Machine | HH-laptop (`D:\project\_wt_bot_a_audit`) |
| Folder | `artifacts/validation/ui-parity/INCREMENTAL_f72184c/` |

## Verified SHAs

| SHA | Role |
|-----|------|
| `f72184ce875aa6181322e463451c9b9d91131f4b` | `origin/main` tip = audit subject (short `f72184c`) |
| `bcde64fd11db40ba9173356c6863037c7879a75d` | Bot-B wave25: SpecParamStrip on D StftRequest contract |
| `74353d9` | merge: G web-5fc5788 evidence (`330dd56`) — store-reachable prior to B strip |
| `330dd56` | Bot-G evidence-only on A-base (NOT PASS; noted strip attrs absent pre-B) |
| `5fc5788` | merge: A INCREMENTAL_ba3bb76 (`24539f2`) |
| `24539f2` | Prior Bot-A INCREMENTAL_ba3bb76 (base) |
| `3aaac7d` | Bot-D StftRequest contract (prior) |
| `17471a6488383b456281d12cb1a6d3d80290205d` | Desktop tip |

**ID map:** G02 strip wire = B `bcde64f`. Tip `f72184c`.

## Diff vs prior (`ba3bb76` / `24539f2` → `f72184c`)

1. **B wave25 SpecParamStrip (`bcde64f`):** UI wires D contract into real STFT path:
   - `MainChartHost` passes `method: 'welch'` + `kaiserBeta: stftKaiserBetaPref` into file/synthetic STFT requests (prefs → compute → D `setDspFftAnalysisParams` publish).
   - Strip stamps Method / SegMs / Stat / Kaiserβ from D publish (`data-dsp-spectral-method`, `data-dsp-segment-ms`, `data-statistic-status=NA_PSD_ONLY`, `data-strip-wave` includes `wave25`).
   - Overflow: `select-stft-method` **fixed+disabled** to `welch` (`STFT_SUPPORTED_METHODS`); `STFT_BLOCKED_METHODS` listed as `data-blocked` / `{m}: BLOCKED` (periodogram/bartlett/multitaper/burg) — **not clickable, not MET**.
   - `stftKaiserBetaPref` editable when window=kaiser; window / overlap / stftN editable prefs **still MET** (wave22 retained).
2. **G tip `330dd56` (web-5fc5788):** evidence-only *before* B strip landed — store publish reachable (welch/segmentMs/kaiser forced); gap note that method/segment strip attrs absent until B. Tip `f72184c` closes that strip-attr gap for G02 chrome; does **not** claim PASS.
3. **G02 deepen PARTIAL:** contract UI + request wiring **MET** beyond D-only store — **not CLOSED** (DPSS/Burg compute, removeMean, auto N/B, full Qt SpectralSettings residual per Bot-B deferred).
4. **G08 regression scan:** `data-g08-shortcuts="wave23"` / `useMenuBarShortcuts` retained; G soft stamp on web-5fc5788. **No regression** — carry PARTIAL.
5. **G18 regression scan:** `data-g18-nb-mod-stft-linked-cursor` retained; recog panes residual. **No regression** — carry PARTIAL; G17 **not elevated**.
6. **G06/G17:** **BLOCKED** unchanged. `data-native-qfiledialog="false"`. ChartMarkOverlay backticks **16**.

Bot notes: `bot-b/BOT_B_WAVE25_G02_STFT_CONTRACT_STRIP.md`; `qa/web-5fc5788/notes.json` (pre-B store).

## Verdict summary

| ID | Prior (`ba3bb76`) | Now (`f72184c`) | One-liner |
|----|---------------------|-------------------|-----------|
| **G02** | PARTIAL (D contract welch+store) | **PARTIAL (deepened)** | SpecParamStrip + MainChartHost wire welch/kaiser/segment; blocked methods grey/BLOCKED → **not CLOSED** |
| **G08** | PARTIAL | **unchanged PARTIAL** | no regression (wave23 retained) |
| **G18** | PARTIAL | **unchanged PARTIAL** | no regression; mod STFT MET; recog residual |
| **G19** | PARTIAL | **unchanged PARTIAL** | native QFileDialog residual |
| **G17** / **G06** | PARTIAL — BLOCKED | **unchanged — BLOCKED** | no invent / no elevate |
| G07 / G11 | PARTIAL | **unchanged** | residuals retained |
| G05 / G14 | CLOSED | **CLOSED** | unchanged |
| G25 | DOCS | **DOCS** | unchanged |

**Counts (membership-normalized, unchanged):** OPEN **7** · PARTIAL **16** · CLOSED **2** (G05, G14) · DOCS **1** (G25). **No PASS.**

- OPEN: G09–G10, G16, G21–G24
- PARTIAL: G01, G02–G04, G06, G07, G08, G11–G13, G15, G17, G18, G19–G20, G26
- CLOSED: G05, G14

## Focus detail — G02 strip ↔ D contract

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Prefs → STFT request (`method:'welch'`, `kaiserBeta`) | **MET** | `MainChartHost` `bcde64f` |
| Strip Method/SegMs/Stat/Kaiser publish | **MET** | `ChartParamStrip` wave25 QLabels |
| Window / overlap / stftN editable | **MET (retained)** | wave22 prefs |
| Method select fixed welch (disabled) | **honest MET chrome** | `select-stft-method` disabled |
| periodogram/bartlett/multitaper/burg | **BLOCKED** | `overflow-stft-blocked-*` `data-blocked` — **not MET** |
| SpectrumStatistic on STFT | **NA_PSD_ONLY** | never fake Mean |
| Full Qt SpectralSettings (DPSS/Burg/removeMean/auto N/B) | residual | → **not CLOSED** |

## TOP residual (max 8)

1. **G17 residual** — recognition **BLOCKED**
2. **G06 residual** — eye/bitstream **BLOCKED**
3. **G19 residual** — **true native QFileDialog** (`=false`)
4. **G18 residual** — recognition STFT panes (mod STFT **done**)
5. **G07 residual** — full Qt Detect Worker beyond LocalCompute
6. **G02 residual** — BLOCKED methods compute + auto N/B + removeMean + full Qt SpectralSettings
7. **G08 residual** — full desktop shell re-shot
8. **G11 residual** — PlotWidget paint *(or G09/G16 OPEN)*

## Explicit

**matrix_pass_claimed: false**  
**ui_parity_pass_claimed: false**  
**pass_claimed: false**  
**No ACCEPTANCE_MATRIX PASS. No self-declared PASS.**  
G02 remains **PARTIAL** (deepened), **not CLOSED**. BLOCKED methods **not MET**. G06/G17 **BLOCKED**. ChartMarkOverlay backticks = **16**.