# INCREMENTAL_d4f0943 — G evidence web-d69fc93 (SpectralSettings wave22 + G18; no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-22 02:00 Asia/Shanghai |
| Web tip (audit subject) | **`d4f0943`** = `d4f09435779a50c8b414b871fc5f73921dc9b890` (G `c27d634` on main after A `ba20ef0` / `bd6a5dc` path) |
| Desktop | **`17471a6`** (`signal_studio_rebuild`) |
| Prior Bot-A | `INCREMENTAL_d69fc93.md` @ Web `d69fc93` / audit tip `ba20ef0` (`ba20ef09edefee313fb8fb8b746d0a0834ddac4d`) |
| Scope | Skim G evidence corroborating G02 SpectralSettings wave22 + G18 multi-view; no new impl deepen unless code |
| Rule | Read-only; **no matrix PASS**; screenshots alone never CLOSE; `data-native-qfiledialog=false` honest |
| Machine | HH-laptop (`D:\project\_wt_bot_a_audit`) |

## Verified SHAs

| SHA | Role |
|-----|------|
| `d4f09435779a50c8b414b871fc5f73921dc9b890` | `origin/main` tip = audit subject (short `d4f0943`) |
| `c27d634` | Bot-G evidence-only web-d69fc93 |
| `bd6a5dc` / `ba20ef0` | Main merge of prior A / prior audit tip |
| `72d4759` / `8d6148f` | Prior B wave22 SpectralSettings (ancestry; already audited) |
| `17471a6488383b456281d12cb1a6d3d80290205d` | Desktop tip |

**ID map:** Evidence only @ tip `d4f0943` (G02 impl already audited @ `d69fc93`).

## Diff vs prior (`d69fc93` → `d4f0943`)

1. **Impl delta:** **None** under `apps/` / `packages/` (QA/docs only).
2. **G `c27d634` evidence (corroborates prior MET; never CLOSE alone):**
   - G02 SpectralSettings: overflow wave22; prefs change observed (stftN 1024→2048, window hann→hamming, overlap 0.75→0.5); strip `data-stft-n-drives-compute=wave22`; live window/overlap stamps (PNG 01*).
   - G18: multi-view linkedCursor / dwell-only / Esc regression still green (PNG 02–04).
   - `matrix_pass_claimed: false` / `g06_g17_claimed: false`.
3. **Honesty recheck:** `data-stft-n-drives-compute` / `select-stft-window` / `select-stft-overlap` retained; `data-native-qfiledialog="false"`; G18 STFT linked stamps retained; ChartMarkOverlay backticks **16**; G06/G17 **BLOCKED**.
4. **No status flips:** G02 stays PARTIAL (full Qt SpectralSettingsWidget method/duration/statistic residual); G18 stays PARTIAL (mod/recog panes); G19 stays PARTIAL (native dialog false).

## Verdict summary

| ID | Prior (`d69fc93`) | Now (`d4f0943`) | One-liner |
|----|---------------------|-------------------|-----------|
| **G02** | PARTIAL (deepened; full Qt SpectralSettings residual) | **unchanged PARTIAL** | G corroborates prefs→strip/STFT; residual unchanged → **not CLOSED** |
| **G18** | PARTIAL (mod/recog panes) | **unchanged PARTIAL** | G regression OK; mod/recog → **not CLOSED** |
| **G19** | PARTIAL (true native QFileDialog) | **unchanged PARTIAL** | `data-native-qfiledialog=false` |
| G07 / G08 / G11 | PARTIAL | **unchanged** | residuals retained |
| **G17** | PARTIAL (recognition BLOCKED) | **unchanged — recognition still BLOCKED** | no invented path |
| **G06** | PARTIAL (eye/bitstream BLOCKED) | **unchanged — eye/bitstream still BLOCKED** | no invented path |
| G05 / G14 | CLOSED | **CLOSED** | unchanged |
| G25 | DOCS | **DOCS** | unchanged |

**Counts (membership-normalized, unchanged bucket sizes):** OPEN **7** · PARTIAL **16** · CLOSED **2** (G05, G14) · DOCS **1** (G25). **No PASS.**

- OPEN: G09–G10, G16, G21–G24
- PARTIAL: G01, G02–G04, G06, G07, G08, G11–G13, G15, G17, G18, G19–G20, G26
- CLOSED: G05, G14

## TOP residual (max 8, parallel-friendly)

1. **G17 residual** — recognition **BLOCKED**
2. **G06 residual** — eye/bitstream/recognition **BLOCKED**; interactive STFT
3. **G19 residual** — **true native QFileDialog** (`data-native-qfiledialog=false`)
4. **G18 residual** — modulation/recognition STFT panes linked
5. **G07 residual** — full Qt Detect Worker beyond LocalCompute
6. **G02 residual** — full Qt SpectralSettingsWidget method/duration/statistic
7. **G08 residual** — full desktop shell re-shot
8. **G11 residual** — remaining PlotWidget paint nuances *(or G09/G16 OPEN)*

## Explicit

**matrix_pass_claimed: false**  
**No ACCEPTANCE_MATRIX PASS. No self-declared PASS.**  
Evidence-only tip — no bucket flips. G06/G17 stay **BLOCKED**. Native QFileDialog not claimed MET. ChartMarkOverlay backticks = **16**.