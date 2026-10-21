# INCREMENTAL_42265bf — C G18 modulation STFT linkedCursor (no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-22 02:02 Asia/Shanghai |
| Web tip (audit subject) | **`42265bf`** = `42265bfde28871d6ffae30e9def0e03ceda7bfcf` (C `80d25bd` + G `dabd9f0` + A `e9ea297` on main) |
| Desktop | **`17471a6`** (`signal_studio_rebuild`; updateLinkedCursors → modulationStft_/recognitionStft_) |
| Prior Bot-A | `INCREMENTAL_d4f0943.md` @ Web `d4f0943` / audit tip `e9ea297` (`e9ea29751d2431cf7101ab18ce8d6bb8ae0209e8`) |
| Scope | **G18** mod STFT linkedCursor; residual may shift to recognition STFT panes only — **do not elevate G17** |
| Rule | Read-only; **no matrix PASS**; never invent recognition STFT / G06 eye/bitstream |
| Machine | HH-laptop (`D:\project\_wt_bot_a_audit`) |

## Verified SHAs

| SHA | Role |
|-----|------|
| `42265bfde28871d6ffae30e9def0e03ceda7bfcf` | `origin/main` tip = audit subject (short `42265bf`) |
| `80d25bdec877637469e63c0adc9b3277cb756b7d` | Bot-C: G18 modulation STFT linkedCursor |
| `dabd9f0` | Bot-G evidence web-bd6a5dc (soft skim) |
| `e9ea297` | Prior Bot-A INCREMENTAL_d4f0943 (base) |
| `17471a6488383b456281d12cb1a6d3d80290205d` | Desktop tip |

**ID map:** G18 mod STFT = C `80d25bd`. Tip `42265bf`.

## Diff vs prior (`d4f0943` → `42265bf`)

1. **C G18 mod STFT linkedCursor (`80d25bd`):** `NarrowbandModulationCharts` — `resolveNbStftLinkedCursor` (pinned store only; no invented dwell) → `SpectrumChart linkedCursor`; pin-host click / Alt-clear via `pinLinkedCursor` / `clearActivePinnedCursor`; stamps `data-g18-nb-mod-stft-linked-cursor`. Matches desktop `modulationStft_->setLinkedCursor`. Prior residual “modulation STFT pane” **MET**.
2. **Recognition STFT:** **Not landed** — web DL/recognition page remains BLOCKED ChartPanel placeholder (no SpectrumChart); C explicitly does not invent STFT feed. → G18 residual **shifts to recognition STFT panes only**. **G17 recognition stays BLOCKED** (no elevation).
3. **G02 / G19:** No B change beyond ancestry. SpectralSettings wave22 retained; `data-native-qfiledialog="false"` retained.
4. **G `dabd9f0`:** Evidence on A-base SpectralSettings+G18 observe path; PNG alone never CLOSE.
5. **ChartMarkOverlay:** backticks **16**. **G06:** eye still BLOCKED in mod charts. **G17:** **BLOCKED**.

Bot notes: `bot-c/G18-NB-MOD-STFT-LINKED-HANDOFF.md`, `bot-c/STATUS.md` (`matrix_pass_claimed: false`; Full G18 CLOSED still PARTIAL).

## Verdict summary

| ID | Prior (`d4f0943`) | Now (`42265bf`) | One-liner |
|----|---------------------|-------------------|-----------|
| **G18** | PARTIAL (mod/recog panes residual) | **PARTIAL (deepened)** | mod STFT linkedCursor **MET** (`80d25bd`); **recognition STFT panes** residual (BLOCKED placeholder) → **not CLOSED** |
| **G02** | PARTIAL | **unchanged PARTIAL** | SpectralSettings residual retained |
| **G19** | PARTIAL | **unchanged PARTIAL** | `data-native-qfiledialog=false` |
| **G17** | PARTIAL (recognition BLOCKED) | **unchanged — recognition still BLOCKED** | no invented recognition STFT / algorithm |
| **G06** | PARTIAL (eye/bitstream BLOCKED) | **unchanged — eye/bitstream still BLOCKED** | mod eye stays BLOCKED |
| G07 / G08 / G11 | PARTIAL | **unchanged** | residuals retained |
| G05 / G14 | CLOSED | **CLOSED** | unchanged |
| G25 | DOCS | **DOCS** | unchanged |

**Counts (membership-normalized, unchanged bucket sizes):** OPEN **7** · PARTIAL **16** · CLOSED **2** (G05, G14) · DOCS **1** (G25). **No PASS.**

- OPEN: G09–G10, G16, G21–G24
- PARTIAL: G01, G02–G04, G06, G07, G08, G11–G13, G15, G17, G18, G19–G20, G26
- CLOSED: G05, G14

## Focus detail

### G18 — mod STFT linkedCursor — **PARTIAL (deepened)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Prior observe wave/PSD/STFT multi-view | MET (retained) | prior tips |
| Modulation STFT linkedCursor + pin host | **MET** | `data-g18-nb-mod-stft-linked-cursor`; `80d25bd` |
| Recognition STFT linkedCursor | residual / BLOCKED chrome | no SpectrumChart; not invented → **not CLOSED**; **≠ G17 elevate** |

## TOP residual (max 8, parallel-friendly)

1. **G17 residual** — recognition **BLOCKED** (unchanged; not elevated by mod STFT chrome)
2. **G06 residual** — eye/bitstream/recognition **BLOCKED**; interactive STFT
3. **G19 residual** — **true native QFileDialog** (`data-native-qfiledialog=false`)
4. **G18 residual** — **recognition STFT panes** linked (mod STFT **done** @ `80d25bd`; needs real chart before cursor wire)
5. **G07 residual** — full Qt Detect Worker beyond LocalCompute
6. **G02 residual** — full Qt SpectralSettingsWidget method/duration/statistic
7. **G08 residual** — full desktop shell re-shot
8. **G11 residual** — remaining PlotWidget paint nuances *(or G09/G16 OPEN)*

## Explicit

**matrix_pass_claimed: false**  
**No ACCEPTANCE_MATRIX PASS. No self-declared PASS.**  
G18 remains **PARTIAL** (deepened), **not CLOSED**. G17 recognition **not elevated**. G06/G17 stay **BLOCKED**. ChartMarkOverlay backticks = **16**.