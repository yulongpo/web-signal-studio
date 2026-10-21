# INCREMENTAL_ab82146 — combined: G18 written BLOCKED + ACTIONABLE on main (no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-22 07:49 Asia/Shanghai |
| Web tip | **`ab82146`** = `ab821462299d1762ad4d6126c63dfcb62ca65b1b` |
| Desktop | **`17471a6`** |
| Prior A | `INCREMENTAL_113f6b8_ACTIONABLE` @ `eb80ac8` (`eb80ac83b271be602c215435b600eb134b0c870b`) |
| Supersedes | bare `INCREMENTAL_3209aa7` (CAO retarget to combined tip) |
| Scope | (a) C G18 recog STFT **written BLOCKED**; (b) ACTIONABLE landed on main + ①②③/⑤/⑥ status; (c) soft G02/G06/G07/G08/G17 fences |
| Rule | Docs-only; **matrix_pass_claimed=false**; no G06/G17 invent |
| Folder | `artifacts/validation/ui-parity/INCREMENTAL_ab82146/` |

## Verified SHAs

| SHA | Role |
|-----|------|
| `ab821462299d1762ad4d6126c63dfcb62ca65b1b` | `origin/main` tip (short `ab82146`) |
| `3209aa75c52991e0626e843316cd2087ac3b15c1` | merge(C): G18 recog STFT BLOCKED handoff |
| `13b0580` | Bot-C docs: G18 recog STFT panes written BLOCKED (wave32) |
| `eb80ac8` / `eb80ac83b271be602c215435b600eb134b0c870b` | A INCREMENTAL_113f6b8_ACTIONABLE |
| `17471a6488383b456281d12cb1a6d3d80290205d` | Desktop tip |

## (a) G18 — written BLOCKED (C pack)

**Cite:** `artifacts/validation/ui-parity/bot-c/G18-NB-RECOG-STFT-BLOCKED-HANDOFF.md` + `bot-c/STATUS.md` (also mirrored under `docs/validation/ui-parity/bot-c/`).

| Claim | Evidence |
|-------|----------|
| Decision **BLOCKED** — no landable linkedCursor tip | handoff Verdict: no `SpectrumChart` / heatmap on deep-learning page |
| `nb-panel-dl-stft` = status-only `ChartPanel` | `NarrowbandWorkspace.tsx` `page === 'deepLearning'`; `BLOCKED: RECOGNITION_ENGINE_MISSING` |
| `NARROWBAND_RECOGNITION_BLOCKED` / `computeNarrowbandRecognition` always BLOCKED | `narrowbandPageDspContracts.ts` |
| Contrast: mod STFT **MET** @ `80d25bd` | `NarrowbandModulationCharts.tsx` hosts `SpectrumChart` + `linkedCursor` |
| Desktop has `recognitionStft_` in linked-cursor fan-out | `narrowband_workspace.cpp` `updateLinkedCursors` |
| Unblock requires real recognition-channel STFT host first | handoff Unblock — not inventing algo/G06/G17 |

**G18 overall:** stays **PARTIAL** (mod/observe MET; **recog STFT panes written BLOCKED** residual). **Not CLOSED. No invent.**

## (b) ACTIONABLE on main — item status vs `eb80ac8`

Cross-link: `artifacts/validation/ui-parity/INCREMENTAL_113f6b8_ACTIONABLE/ACTIONABLE.md` (now in main via `ab82146`).

| CAO # | ACTIONABLE id | Owner | Status @ `ab82146` |
|-------|---------------|-------|----------------------|
| **①** | **A1** SegmentMs `0.1/1/10/100` when auto-N off | **B** | **B no tip** — checklist only; not landed |
| **②** | **A2** `bandwidthHz` from visible span | **B**/C | **B no tip** — not landed |
| **③** | **B1** Ctrl+A SelectAll marks | **B** | **B no tip** — not landed |
| **⑤** | **A5** persist spectral prefs → project JSON | **B**/F | **waiting B⑤** — standby; do not invent progress |
| **⑥** | D formal residuals (non-PoT / STFT-DDC) + any D-only compute beyond PoT publish | **D** | **D BLOCKED** — recorded; not a landable tip this wave |

Other ACTIONABLE rows (A3 publish stamps, A4 PSD statistic, A6 tooltips, C1–C3, D2–D5) remain checklist-only; no B/D/C implementation tip observed between `eb80ac8` and `ab82146` beyond C's **docs** BLOCKED handoff.

## (c) Soft fences (unchanged)

| ID | Status | Note |
|----|--------|------|
| **G02** | **PARTIAL** | PoT auto-N/removeMean MET; Multitaper/Burg/**non-PoT**/**STFT-DDC** **BLOCKED** — not CLOSED |
| **G08** | **PARTIAL** | wave23 + six-menu; no forced flip; desktop pixel residual |
| **G07** | **PARTIAL** | LocalCompute MET; full Qt Worker residual |
| **G06** | **BLOCKED** | eye/bitstream — no invent |
| **G17** | **BLOCKED** | recognition — no invent / no elevate |
| **G18** | **PARTIAL** | + written BLOCKED recog STFT panes (this tip) |
| **G19** | **PARTIAL** | `data-native-qfiledialog=false` |
| G05 / G14 | CLOSED | unchanged |
| G25 | DOCS | unchanged |
| G09 / G16 | OPEN | unchanged |

**Counts:** OPEN **7** · PARTIAL **16** · CLOSED **2** · DOCS **1**. **No PASS.**

**ChartMarkOverlay backticks:** **16**

## Explicit

**matrix_pass_claimed: false**  
**ui_parity_pass_claimed: false**  
**pass_claimed: false**  
No G06/G17 invention. G18 recog STFT = **written BLOCKED**. ①②③ = **B no tip**. ⑥ = **D BLOCKED**. ⑤ = **waiting B**.