# INCREMENTAL_088f322 — G evidence web-14cc45f (Esc/NB + soft wave17; no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-22 01:26 Asia/Shanghai |
| Web tip (audit subject) | **`088f322`** = merge G `950a1d0` (web-14cc45f evidence) on main after A `3fee65b` / tip `14cc45f` |
| Desktop | **`17471a6`** (`signal_studio_rebuild`) |
| Prior Bot-A | `INCREMENTAL_14cc45f.md` @ Web `14cc45f` / audit tip `3fee65b` |
| Scope | Skim G evidence pack; recheck G18 Esc/NB MET items; residuals G02/G07/G08/G11/G19; ChartMarkOverlay backticks |
| Rule | Read-only on implementation; **no matrix PASS**; screenshots alone never CLOSE; `data-native-qfiledialog=false` stays honest |
| Machine | HH-laptop (`D:\project\_wt_bot_a_audit`) |

## Verified SHAs

| SHA | Role |
|-----|------|
| `088f3220139e85b756f61c76088c7485c698a26e` | `origin/main` tip = audit subject |
| `950a1d0` | Bot-G evidence-only web-14cc45f (Esc clear + NB multi-view + soft wave17) |
| `3fee65b` / `ae63355` | Prior A audit / C G18 Esc+NB impl (ancestry) |
| `17471a6488383b456281d12cb1a6d3d80290205d` | Desktop tip |

**ID map:** Evidence only @ tip `088f322` (impl already audited @ `14cc45f` / `ae63355`).

## Diff vs prior (`14cc45f` → `088f322`)

1. **Impl delta:** **None** under `apps/` / `packages/` — tip is docs/QA only (`git diff --stat 14cc45f..088f322` empty for impl).
2. **G `950a1d0` evidence (corroborates prior MET; never CLOSE alone):**
   - Esc clear: shell `data-g18-esc-clear`; store after Esc unpinned; menu clear OK (PNG 01/01b/01c).
   - NB multi-view: `data-g18-nb-multi-view=true`; after Esc pin=null / PSD `statistical` (PNG 02*).
   - Soft wave17: shell keyboard Arrow 278→270; rail linked twin readout; G07 inspector created/updated/uiMessages/feed (PNG 03*).
   - `matrix_pass_claimed: false` / `ui_parity_pass_claimed: false` in `notes.json`.
3. **G18 recheck (code still present):** `clearActivePinnedCursor` / `useEscClearPinnedCursor` / `data-g18-esc-clear` / `data-g18-nb-multi-view` + wave `linkedX` — prior MET retained. Residual unchanged: **NB PSD freq overlay / full NB multi-view polish** → **PARTIAL**, not CLOSED.
4. **ChartMarkOverlay:** backticks **16** (no JSX-template regression).
5. **G19 native dialog honesty:** `data-native-qfiledialog="false"` still present — **do not claim OS dialog MET**; true native QFileDialog residual.
6. **G06 / G17:** `NARROWBAND_RECOGNITION_BLOCKED` / `data-nb-bitstream` / `data-honest-blocked` retained — stay **BLOCKED**.

## Verdict summary

| ID | Prior (`14cc45f`) | Now (`088f322`) | One-liner |
|----|---------------------|-------------------|-----------|
| **G18** | PARTIAL (deepened; NB PSD freq residual) | **unchanged PARTIAL** | G pack corroborates Esc/NB MET; residual unchanged → **not CLOSED** |
| G08 / G07 | PARTIAL | **unchanged** (G soft-corroborates wave17) | keyboard / inspector feed |
| **G19** | PARTIAL (true native QFileDialog) | **unchanged PARTIAL** | `data-native-qfiledialog=false` |
| G11 / G02 | PARTIAL | **unchanged** | no impl delta |
| **G17** | PARTIAL (recognition BLOCKED) | **unchanged — recognition still BLOCKED** | no invented path |
| **G06** | PARTIAL (eye/bitstream BLOCKED) | **unchanged — eye/bitstream still BLOCKED** | no invented path |
| G05 / G14 | CLOSED | **CLOSED** | unchanged |
| G25 | DOCS | **DOCS** | unchanged |

**Counts (membership-normalized, unchanged bucket sizes):** OPEN **7** · PARTIAL **16** · CLOSED **2** (G05, G14) · DOCS **1** (G25). **No PASS.**

- OPEN: G09–G10, G16, G21–G24
- PARTIAL: G01, G02–G04, G06, G07, G08, G11–G13, G15, G17, G18, G19–G20, G26
- CLOSED: G05, G14

## Focus detail

### G18 — evidence recheck — **PARTIAL (unchanged)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Esc clearActivePinnedCursor / useEscClearPinnedCursor | MET (retained) | code + G PNG 01* |
| NB wave linkedX / data-g18-nb-multi-view | MET (retained) | code + G PNG 02* |
| NB PSD freq overlay / full NB multi-view | residual | handoff; no new impl @ tip |
| ChartMarkOverlay backticks | **16 OK** | no regression |

### Residuals confirmed still open

| ID | Residual |
|----|----------|
| G19 | true native QFileDialog (browser-honest only) |
| G07 | full Qt Detect Worker beyond LocalCompute |
| G02 | live DSP window/overlap values |
| G08 | full desktop shell re-shot |
| G11 | remaining PlotWidget paint nuances |

## TOP residual (max 8, parallel-friendly)

1. **G17 residual** — recognition **BLOCKED**
2. **G06 residual** — eye/bitstream/recognition **BLOCKED**; interactive STFT
3. **G19 residual** — **true native QFileDialog** (`data-native-qfiledialog=false`)
4. **G18 residual** — NB PSD freq overlay / full NB multi-view polish
5. **G07 residual** — full Qt Detect Worker beyond LocalCompute
6. **G02 residual** — live DSP window/overlap values
7. **G08 residual** — full desktop shell re-shot
8. **G11 residual** — remaining PlotWidget paint nuances *(or G09/G16 OPEN)*

## Explicit

**matrix_pass_claimed: false**  
**No ACCEPTANCE_MATRIX PASS. No self-declared PASS.**  
Evidence-only tip — no bucket flips. G18 stays PARTIAL. G06/G17 stay **BLOCKED**. Native QFileDialog not claimed MET. ChartMarkOverlay backticks = **16**.