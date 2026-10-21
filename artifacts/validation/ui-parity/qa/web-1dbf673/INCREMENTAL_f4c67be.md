# INCREMENTAL_f4c67be — G11/G17/G06 (C+E+D) delta (no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-21 23:12 Asia/Shanghai |
| Web tip (audit subject) | **`f4c67be`** = merge Bot-E G17 `09ae79b`/`f87b94b` over Bot-D G06/G07 `e3b86f0` over Bot-C G11 `363744f` (base `97fc7c0`) |
| Desktop | **`17471a6`** (`rebuild/a143-native`; PlotWidget `zoneAt` + `chart_feedback::cursor` + `ui/detection/detection_card.*`) |
| Prior Bot-A | `INCREMENTAL_8733cc1.md` @ `f3f3102` / content tip `8733cc1` |
| Scope | Focus **G11 / G17 / G06** (CAO residual TOP after 8733cc1); G07 ownership skim; membership skim only |
| Rule | Read-only on implementation; **no matrix PASS**; screenshots alone never CLOSE |
| Machine | HH-laptop (`D:\project\_wt_bot_a_audit`); RadioAI-360 worktree absent |

## Verified SHAs

| SHA | Role |
|-----|------|
| `f4c67be09ef7d53b60ff4b243ee900bcd0ca123b` | `origin/main` tip = audit subject (`merge(bot-e): G17 full param grid`) |
| `363744f` / `46fb64f` | Bot-C: G11 OpenHandCursor (`resolveInteractionCursor`) |
| `e3b86f0` / `ebf577b` | Bot-D: G06 eye/bitstream stay BLOCKED + G07 handoff to Bot-B |
| `f87b94b` / `f7a4a67` / `09ae79b` | Bot-E: G17 DetectionCard full parameter grid + evidence stamp |
| `97fc7c0` | Prior main base (post-8733cc1 evidence merge) |
| `17471a6488383b456281d12cb1a6d3d80290205d` | Desktop tip (unchanged) |

**ID map (commit messages):** G11=OpenHandCursor (C) · G17=DetectionCard full param grid (E) · G06=eye/bitstream BLOCKED notes (D); G07 handoff → Bot-B.

## Diff vs prior (`8733cc1` → `f4c67be`)

1. **C G11** (`363744f`): `resolveInteractionCursor` mirrors desktop `chart_feedback::cursor` — axis hover=`grab` (OpenHand), axis pan drag=`grabbing` (ClosedHand), plot=`crosshair`. HeatmapCanvas sets `style.cursor` + `data-interaction-cursor` under `desktop-axis`. Unit tests + Bot-C STATUS. Residual: Navigation overview Kind::Navigation OpenHand; mark-edge resize cursors out of HeatmapCanvas scope.
2. **E G17** (`f87b94b` / `09ae79b`): DetectionCard full parameter grid with desktop `data-object-name`s (timing/threshold/branch/advanced); `detection-param-grid` + e2e; local-compute `pipeline`/`trt_*` honor score/topK/fft/frames. Evidence `G17_PARAM_GRID_INDEX.md`. Residuals: AdaptiveValueEdit / physical Fs / range-ROI chrome; recognition **BLOCKED**.
3. **D G06** (`e3b86f0`): Re-eval eye → `EYE_TIMING_SYNC_MISSING`, bitstream → `BITSTREAM_DEMOD_MISSING`; stubs stay honest; constellation + AM/FM/RMS + baseband STFT remain WIRED. Contract comments tightened (`narrowbandPageDspContracts.ts`). **No new WIRED path** that would CLOSE G06.
4. **D→B G07** (`e3b86f0` handoff): G07 residual ownership corrected to **Bot-B** (UI shell / AnnotationPanel+DetectionPanel port); Bot-D will not implement G07. Status unchanged PARTIAL.

## Verdict summary

| ID | Prior (`8733cc1`) | Now (`f4c67be`) | One-liner |
|----|-------------------|-----------------|-----------|
| **G11** | PARTIAL (deepened); OpenHandCursor NOT MET | **PARTIAL (deepened)** | OpenHand/ClosedHand on axes **MET** (`363744f`); Navigation overview / mark-edge cursors residual — **not CLOSED** |
| **G17** | PARTIAL (deepened); full Qt param grid NOT MET | **PARTIAL (deepened)** | full DetectionCard param grid + TRT param honor **MET** (`f87b94b`); AdaptiveValueEdit / ROI chrome / recognition BLOCKED — **not CLOSED** |
| **G06** | PARTIAL; eye/bitstream/recognition BLOCKED | **PARTIAL (deepened notes)** | BLOCKED re-affirmed honest (`e3b86f0`); no fake eye/bits; WIRED paths unchanged — **not CLOSED** |
| **G07** | PARTIAL; assignee (D) in prior TOP | **PARTIAL (handoff)** | ownership → **Bot-B**; dock hosts retained; full Qt panel port residual — **not CLOSED** |
| G19 / G18 / G02 / G08 / G26 | prior | **unchanged** (membership) | no status flip from C/E/D tips |
| G05 / G14 | CLOSED | **CLOSED** | unchanged |
| G25 | DOCS | **DOCS** | unchanged |

**Counts (membership-normalized, unchanged bucket sizes):** OPEN **7** · PARTIAL **16** · CLOSED **2** (G05, G14) · DOCS **1** (G25). **No PASS.**

- OPEN: G09–G10, G16, G21–G24
- PARTIAL: G01, G02–G04, G06, G07, G08, G11–G13, G15, G17, G18, G19–G20, G26
- CLOSED: G05, G14

## Focus detail

### G11 — Navigate / OpenHandCursor — **PARTIAL (deepened)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Prior navigate→zoom-box + both-edges ≥8px | MET (retained) | `5de2e6b` |
| Axis-only pan (`desktop-axis`) | MET (retained) | `3535889` / `hitChartZone` |
| OpenHandCursor on axes | **MET** (was NOT) | `resolveInteractionCursor`; HeatmapCanvas `data-interaction-cursor`; unit tests (`363744f`) |
| Middle-button pan | **N/A on desktop 17471a6** | retained |
| Navigation overview Kind::Navigation OpenHand | **NOT MET** | Bot-C STATUS: out of HeatmapCanvas scope |
| Mark-edge resize cursors | **NOT MET** | Bot-C: not owned here |

Bot-C: `artifacts/validation/ui-parity/bot-c/STATUS.md` (WIP / no PASS). **Not CLOSED.**

### G17 — Detect / DetectionCard full param grid — **PARTIAL (deepened)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Prior inventory/cancel/precheck + selectable `.engine` | MET (retained) | `8bf1390` lineage @8733cc1 |
| DetectionCard chrome (profile/strategy/phase) | MET (retained) | @8733cc1 |
| Full Qt DetectionCard parameter grid | **MET** (was NOT) | timing/threshold/branch/advanced `data-object-name`s; `detection-param-grid`; e2e (`f87b94b`) |
| Pipeline honors score/topK/fft/frames | **MET** | `pipeline.py` + `trt_ffscn.py` / `trt_scn.py` |
| AdaptiveValueEdit validation / physical-times Fs | **NOT MET** | Bot-E: web notes only; no fake Fs |
| Range origin / active segment / ROI select chrome | **NOT MET** | Bot-E `still_partial` |
| Narrowband recognition | **BLOCKED** | honest; no fake package |

Bot-E: `docs/acceptance/evidence/bot-e/G17_PARAM_GRID_INDEX.md` (`matrix_pass_claimed: false`). **Not CLOSED.**

### G06 — Narrowband eye / recognition / bitstream — **PARTIAL (deepened notes)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Constellation + baseband STFT (DDC) | MET / WIRED (retained) | prior tips |
| AM/FM/RMS envelope preview | MET / WIRED (retained) | `simpleDemodFromIq` / `narrowbandDemodDdc` |
| Eye diagram | **BLOCKED** (re-affirmed) | `EYE_TIMING_SYNC_MISSING`; no annotated SPS (`e3b86f0`) |
| Bitstream / PSK-QAM demod | **BLOCKED** (re-affirmed) | `BITSTREAM_DEMOD_MISSING`; no hard-decision path |
| Recognition | **BLOCKED** (retained) | `RECOGNITION_ENGINE_MISSING` (Bot-E) |
| Workbench title + interactive STFT | **NOT MET** | prior residual |

Bot-D: `artifacts/validation/bot-d/BOT_D_G06_EYE_BITSTREAM_97fc7c0.md` (`matrix_pass_claimed: false`). **Not CLOSED.**

### G07 — Bottom panels (skim) — **PARTIAL (handoff)**

Bot-D handoff doc: residual is **Bot-B** UI shell (full AnnotationPanel / DetectionPanel port), not DSP. Dock hosts remain. See `BOT_D_G07_HANDOFF_TO_B.md`. Prior TOP tagging `(D)` corrected to `(B)`.

## TOP residual (max 8, parallel-friendly)

1. **G17 residual** — AdaptiveValueEdit / physical Fs / range-ROI chrome; recognition **BLOCKED** (E)
2. **G06 residual** — eye/bitstream/recognition stay BLOCKED; workbench title + interactive STFT (D/F)
3. **G19 residual** — full Qt AnnotationPanel multi-select paint parity (B; CN chrome landed)
4. **G11 residual** — Navigation overview OpenHand + mark-edge cursors (C; axis OpenHand landed)
5. **G18 residual** — PSD N / STFT N / palette summary lines (B/C)
6. **G07 residual** — full Qt AnnotationPanel / DetectionPanel port (**B**; handoff from D)
7. **G02 residual** — deeper overflow / strip QLabel parity (B)
8. **G08 residual** — column resize + saved UI state *(or G09/G16 OPEN)*

## Explicit

**matrix_pass_claimed: false**  
**No ACCEPTANCE_MATRIX PASS. No self-declared PASS.**  
G11 / G17 / G06 remain PARTIAL (deepened), not CLOSED. G07 PARTIAL with Bot-B ownership.