# INCREMENTAL_e8f0881 — C G18 dwell-only historic NB PSD freq overlay (no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-22 01:39 Asia/Shanghai |
| Web tip (audit subject) | **`e8f0881`** = Bot-C G18 dwell-only historic freq on main after A `1f52465` / tip `4937422` |
| Desktop | **`17471a6`** (`signal_studio_rebuild`; pinCursor always sets frequencyHz / updateLinkedCursors) |
| Prior Bot-A | `INCREMENTAL_4937422.md` @ Web `4937422` / audit tip `1f52465` |
| Scope | **G18** dwell-only historic pins residual (`resolveNbPsdLinkedFreqHz` / dwell-peak|dwell-center + scrubber sync) |
| Rule | Read-only; **no matrix PASS**; CLOSED only with full desktop parity — else PARTIAL |
| Machine | HH-laptop (`D:\project\_wt_bot_a_audit`) |

## Verified SHAs

| SHA | Role |
|-----|------|
| `e8f0881c1c442b3254ebdb4b880d3d3b8156ea36` | `origin/main` tip = audit subject (C G18 dwell-only) |
| `1f52465` | Prior Bot-A INCREMENTAL_4937422 |
| `17471a6488383b456281d12cb1a6d3d80290205d` | Desktop tip |

**ID map:** G18 dwell-only historic = C `e8f0881`. Tip `e8f0881`.

## Diff vs prior (`4937422` → `e8f0881`)

1. **C G18 dwell-only recovery (`e8f0881`):** Helper `resolveNbPsdLinkedFreqHz` — prefer `linkedCursor` when pinned; else if `narrowbandPinnedDwellIndex` + frame PSD mode → frame-PSD peak mapped to xDomain (`dwell-peak`) else band center (`dwell-center`). Stamp `data-g18-nb-psd-freq-source`. Vitest covers linked / peak / center / none / statistical ignore. Matches desktop “pinCursor always carries frequencyHz” recovery intent — **MET** for prior TOP residual “dwell-only historic pins”.
2. **C STFT scrubber sync (`e8f0881`):** Scrub `onScrub` also `pinLinkedCursor` (preserve freq if pinned, else band center + selectedFrame/timeSec) so scrubbing cannot leave dwell-only without freq — **MET**.
3. **Not CLOSED:** Bot-C STATUS honest gap — full desktop multi-view polish beyond PSD vline still open; rail twin remains Bot-B; no new D pin-frequency field (reuse linkedCursor + derive). → **G18 stays PARTIAL**.
4. **Other TOP residuals:** No B/D/E delta this tip — G19 `data-native-qfiledialog=false`, G07 Worker, G02 window/overlap, G08 re-shot, G11 PlotWidget unchanged.
5. **ChartMarkOverlay:** backticks **16** (untouched; C STATUS claimed 15 — honest recount = 16).
6. **G06 / G17:** Unchanged — stay **BLOCKED**.

Bot notes: `bot-c/G18-NB-DWELL-ONLY-FREQ-HANDOFF.md`, `bot-c/STATUS.md` (`matrix_pass_claimed: false`).

## Verdict summary

| ID | Prior (`4937422`) | Now (`e8f0881`) | One-liner |
|----|---------------------|-------------------|-----------|
| **G18** | PARTIAL (dwell-only historic residual) | **PARTIAL (deepened)** | resolveNbPsdLinkedFreqHz + scrubber pinLinkedCursor **MET**; full multi-view polish beyond PSD vline → **not CLOSED** |
| G02 / G07 / G08 / G11 / G19 | prior PARTIAL | **unchanged** | residuals retained; native QFileDialog still false |
| **G17** | PARTIAL (recognition BLOCKED) | **unchanged — recognition still BLOCKED** | no invented path |
| **G06** | PARTIAL (eye/bitstream BLOCKED) | **unchanged — eye/bitstream still BLOCKED** | no invented path |
| G05 / G14 | CLOSED | **CLOSED** | unchanged |
| G25 | DOCS | **DOCS** | unchanged |

**Counts (membership-normalized, unchanged bucket sizes):** OPEN **7** · PARTIAL **16** · CLOSED **2** (G05, G14) · DOCS **1** (G25). **No PASS.**

- OPEN: G09–G10, G16, G21–G24
- PARTIAL: G01, G02–G04, G06, G07, G08, G11–G13, G15, G17, G18, G19–G20, G26
- CLOSED: G05, G14

## Focus detail

### G18 — dwell-only historic — **PARTIAL (deepened)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Prior linkedCursor PSD vline / Esc / wave linkedX / rail twin | MET (retained) | prior tips |
| Dwell-only → peak / band-center recovery | **MET** | `nbPsdFreqFromDwell.ts`; `data-g18-nb-psd-freq-source` |
| STFT scrubber sync pinLinkedCursor | **MET** | `NarrowbandObserveCharts` onScrub |
| Full desktop multi-view polish beyond PSD vline | residual | Bot-C STATUS → **not CLOSED** |

## TOP residual (max 8, parallel-friendly)

1. **G17 residual** — recognition **BLOCKED**
2. **G06 residual** — eye/bitstream/recognition **BLOCKED**; interactive STFT
3. **G19 residual** — **true native QFileDialog** (`data-native-qfiledialog=false`)
4. **G18 residual** — full multi-view polish beyond PSD vline (dwell-only recovery **done** @ `e8f0881`)
5. **G07 residual** — full Qt Detect Worker beyond LocalCompute
6. **G02 residual** — live DSP window/overlap values
7. **G08 residual** — full desktop shell re-shot
8. **G11 residual** — remaining PlotWidget paint nuances *(or G09/G16 OPEN)*

## Explicit

**matrix_pass_claimed: false**  
**No ACCEPTANCE_MATRIX PASS. No self-declared PASS.**  
G18 remains **PARTIAL** (deepened), **not CLOSED**. G06/G17 stay **BLOCKED**. Native QFileDialog not claimed MET. ChartMarkOverlay backticks = **16**.