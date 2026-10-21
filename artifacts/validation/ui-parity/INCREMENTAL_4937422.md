# INCREMENTAL_4937422 — G evidence web-5c569c2 (G02 DSP + G18 NB PSD vline; no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-22 01:36 Asia/Shanghai |
| Web tip (audit subject) | **`4937422`** = merge G `d731897` (web-5c569c2 evidence) on main after A `5f2a01f` / tip `5c569c2` |
| Desktop | **`17471a6`** (`signal_studio_rebuild`) |
| Prior Bot-A | `INCREMENTAL_5c569c2.md` @ Web `5c569c2` / audit tip `5f2a01f` |
| Scope | Skim G evidence corroborating prior G02/G18 MET; residuals unchanged; **wave20 C/D not landed — do not invent MET** |
| Rule | Read-only; **no matrix PASS**; screenshots alone never CLOSE; `data-native-qfiledialog=false` honest |
| Machine | HH-laptop (`D:\project\_wt_bot_a_audit`) |

## Verified SHAs

| SHA | Role |
|-----|------|
| `4937422f0a16d30937e6959efc2ed95eed4046b8` | `origin/main` tip = audit subject |
| `d731897` | Bot-G evidence-only web-5c569c2 |
| `5f2a01f` / `0a604d1` / `f7a4b13` | Prior A audit / C NB PSD vline / B wave19 (ancestry) |
| `17471a6488383b456281d12cb1a6d3d80290205d` | Desktop tip |

**ID map:** Evidence only @ tip `4937422` (impl already audited @ `5c569c2`).

## Diff vs prior (`5c569c2` → `4937422`)

1. **Impl delta:** **None** under `apps/` / `packages/` (evidence/QA docs only).
2. **G `d731897` evidence (corroborates prior MET; never CLOSE alone):**
   - G02: `data-strip-dsp=wave19`; dsp_source/fft/detect feed stamps; window `data-strip-partial` / overlap `no-overlap-in-store` (PNG 01*).
   - G18 NB PSD vline: panel stamp `data-g18-nb-psd-freq-vline`; after Esc linked cleared / dwell null / PSD statistical (PNG 03*). Soft Esc/rail regression (PNG 02*).
   - G gap noted: `nb-chart-psd` not mounted (DDC/IQ wait) — stamp proven without hang; does **not** invent CLOSED.
   - `matrix_pass_claimed: false` / `g06_g17_claimed: false`.
3. **Wave20 C/D:** **Not on tip** — no MET claimed for unlanded work.
4. **Honesty recheck:** `data-native-qfiledialog="false"` retained; `NARROWBAND_RECOGNITION_BLOCKED` retained; ChartMarkOverlay backticks **16**.

## Verdict summary

| ID | Prior (`5c569c2`) | Now (`4937422`) | One-liner |
|----|---------------------|-------------------|-----------|
| **G18** | PARTIAL (deepened; dwell-only residual) | **unchanged PARTIAL** | G corroborates NB PSD vline; dwell-only / full polish → **not CLOSED** |
| **G02** | PARTIAL (deepened; window/overlap residual) | **unchanged PARTIAL** | G corroborates wave19 DSP stamps; window/overlap `—` → **not CLOSED** |
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

## TOP residual (max 8, parallel-friendly)

1. **G17 residual** — recognition **BLOCKED**
2. **G06 residual** — eye/bitstream/recognition **BLOCKED**; interactive STFT
3. **G19 residual** — **true native QFileDialog** (`data-native-qfiledialog=false`)
4. **G18 residual** — dwell-only historic pins without linkedCursor
5. **G07 residual** — full Qt Detect Worker beyond LocalCompute
6. **G02 residual** — live DSP window/overlap values
7. **G08 residual** — full desktop shell re-shot
8. **G11 residual** — remaining PlotWidget paint nuances *(or G09/G16 OPEN)*

## Explicit

**matrix_pass_claimed: false**  
**No ACCEPTANCE_MATRIX PASS. No self-declared PASS.**  
Evidence-only tip — no bucket flips. Wave20 C/D **not** invented MET. G06/G17 stay **BLOCKED**. Native QFileDialog not claimed MET. ChartMarkOverlay backticks = **16**.