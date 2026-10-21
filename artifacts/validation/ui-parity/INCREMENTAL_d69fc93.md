# INCREMENTAL_d69fc93 — B wave22 G02 SpectralSettings prefs drive STFT (no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-22 01:56 Asia/Shanghai |
| Web tip (audit subject) | **`d69fc93`** = `d69fc938f0237fe91637c2b3b9529c7fdc862957` (G `d9d6384` + B `8d6148f`/`72d4759` on main after A `cdfadc0`) |
| Desktop | **`17471a6`** (`signal_studio_rebuild`; SpectralSettingsWidget window/overlap) |
| Prior Bot-A | `INCREMENTAL_2f8162b.md` @ Web `2f8162b` / audit tip `cdfadc0` (`cdfadc01858b03c770511b031cc626b2a08471d3`) |
| Scope | **G02** editable SpectralSettings/stftN→STFT; confirm **G18** still PARTIAL; **G19** native dialog false; skim G `d9d6384` |
| Rule | Read-only; **no matrix PASS**; CLOSED only with full desktop parity |
| Machine | HH-laptop (`D:\project\_wt_bot_a_audit`) |

## Verified SHAs

| SHA | Role |
|-----|------|
| `d69fc938f0237fe91637c2b3b9529c7fdc862957` | `origin/main` tip = audit subject (short `d69fc93`) |
| `8d6148f` / `72d4759` | Bot-B merge / feat wave22: stftN/window/overlap prefs drive STFT |
| `d9d6384` | Bot-G evidence-only web-2f8162b (G18 STFT/wave) |
| `cdfadc0` | Prior Bot-A INCREMENTAL_2f8162b (base) |
| `17471a6488383b456281d12cb1a6d3d80290205d` | Desktop tip |

**ID map:** G02 SpectralSettings/stftN wire = B `72d4759`; G pack = `d9d6384` (prior tip). Tip `d69fc93`.

## Diff vs prior (`2f8162b` → `d69fc93`)

1. **B G02 prefs → compute (`72d4759`):** `stftWindowPref` / `stftOverlapPref` + existing `stftN`; MainChartHost passes `fftSize` / `hopSize` / `window` into file+synthetic STFT; effect deps re-run on pref change; actuals still published via D `setDspFftAnalysisParams` after settle. Prefs are **request** state (distinct from D `dspFft*` publish). Stamp `data-stft-n-drives-compute="wave22"`. Prior residual “stftN→compute wire” **MET**.
2. **B G02 SpectralSettings chrome (`72d4759`):** Overflow editors — window select (rectangular…kaiser) + overlap % (0/25/50/75/90) + stftN select. Strip `data-strip-wave` includes wave22. Live strip QLabels still show D-published actuals after STFT. Prior residual “editable SpectralSettings” **MET** for overflow chrome (not a full Qt SpectralSettingsWidget dialog).
3. **G02 not CLOSED:** Bot-B deferred full Qt method/duration/statistic; chrome is overflow selects, not full desktop SpectralSettingsWidget surface. → **PARTIAL**.
4. **G18 confirm:** No new C impl this tip (only G evidence for `2f8162b`). NB observe STFT/wave/PSD/dwell/Esc retained; **modulation/recognition STFT panes** residual unchanged → **still PARTIAL**.
5. **G19 confirm:** MeasuredEvidenceTrace retained; `data-native-qfiledialog="false"` retained — **OS dialog not MET**; still PARTIAL.
6. **G `d9d6384`:** Corroborates prior G18 multi-view (STFT/wave/PSD/Esc); PNG alone never CLOSE; `g06_g17_claimed: false`.
7. **ChartMarkOverlay:** backticks **16**. **G06/G17:** **BLOCKED**.

Bot notes: `bot-b/BOT_B_WAVE22_G02_STFT_N_SPECTRAL_SETTINGS.md` (`matrix_pass_claimed: false`).

## Verdict summary

| ID | Prior (`2f8162b`) | Now (`d69fc93`) | One-liner |
|----|---------------------|-------------------|-----------|
| **G02** | PARTIAL (SpectralSettings/stftN residual) | **PARTIAL (deepened)** | prefs→STFT compute + overflow window/overlap editors **MET** (`72d4759`); full Qt SpectralSettingsWidget / method·duration·statistic → **not CLOSED** |
| **G18** | PARTIAL (mod/recog panes residual) | **unchanged PARTIAL** | G corroborates observe path; mod/recog panes → **not CLOSED** |
| **G19** | PARTIAL (true native QFileDialog) | **unchanged PARTIAL** | MeasuredEvidenceTrace retained; `data-native-qfiledialog=false` — OS dialog **not** MET |
| G07 / G08 / G11 | PARTIAL | **unchanged** | residuals retained |
| **G17** | PARTIAL (recognition BLOCKED) | **unchanged — recognition still BLOCKED** | no invented path |
| **G06** | PARTIAL (eye/bitstream BLOCKED) | **unchanged — eye/bitstream still BLOCKED** | no invented path |
| G05 / G14 | CLOSED | **CLOSED** | unchanged |
| G25 | DOCS | **DOCS** | unchanged |

**Counts (membership-normalized, unchanged bucket sizes):** OPEN **7** · PARTIAL **16** · CLOSED **2** (G05, G14) · DOCS **1** (G25). **No PASS.**

- OPEN: G09–G10, G16, G21–G24
- PARTIAL: G01, G02–G04, G06, G07, G08, G11–G13, G15, G17, G18, G19–G20, G26
- CLOSED: G05, G14

## Focus detail

### G02 — SpectralSettings prefs drive STFT — **PARTIAL (deepened)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Prior D publish + strip live readout | MET (retained) | wave21 |
| stftN / window / overlap prefs → MainChartHost STFT | **MET** | `data-stft-n-drives-compute="wave22"`; compute opts |
| Overflow SpectralSettings editors | **MET** | `select-stft-window` / `select-stft-overlap` / `select-stft-n` |
| Strip shows D actuals after settle | **MET** | prefs ≠ publish; publish after STFT |
| Full Qt SpectralSettingsWidget (method/duration/statistic) | residual | Bot-B deferred → **not CLOSED** |

### G18 / G19 — confirm

| ID | Verdict | Note |
|----|---------|------|
| G18 | PARTIAL unchanged | observe multi-view MET; mod/recog panes residual |
| G19 | PARTIAL unchanged | MeasuredEvidenceTrace OK; native QFileDialog false |

## TOP residual (max 8, parallel-friendly)

1. **G17 residual** — recognition **BLOCKED**
2. **G06 residual** — eye/bitstream/recognition **BLOCKED**; interactive STFT
3. **G19 residual** — **true native QFileDialog** (`data-native-qfiledialog=false`)
4. **G18 residual** — modulation/recognition STFT panes linked
5. **G07 residual** — full Qt Detect Worker beyond LocalCompute
6. **G02 residual** — full Qt SpectralSettingsWidget method/duration/statistic (prefs→compute **done** @ wave22)
7. **G08 residual** — full desktop shell re-shot
8. **G11 residual** — remaining PlotWidget paint nuances *(or G09/G16 OPEN)*

## Explicit

**matrix_pass_claimed: false**  
**No ACCEPTANCE_MATRIX PASS. No self-declared PASS.**  
G02 remains PARTIAL (deepened), not CLOSED. G18/G19 remain PARTIAL. G06/G17 stay **BLOCKED**. ChartMarkOverlay backticks = **16**.