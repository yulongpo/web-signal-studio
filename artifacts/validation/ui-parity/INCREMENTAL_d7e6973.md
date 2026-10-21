> **SUPERSEDED BY CAO retarget → [INCREMENTAL_663b522/](./INCREMENTAL_663b522/)** (Web tip `663b522`). Keep as historical G08 evidence only. **matrix_pass_claimed: false**. No PASS.
# INCREMENTAL_d7e6973 — B wave23 G08 MenuBar QKeySequence parity (no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-22 02:04 Asia/Shanghai |
| Web tip (audit subject) | **`d7e6973`** = `d7e6973393f7d83e0be25d4ccc2d43185d964966` (B `498b2ac` + A `8f9c050` on main) |
| Desktop | **`17471a6`** (`signal_studio_rebuild`; MainWindow::buildMenus QKeySequence) |
| Prior Bot-A | `INCREMENTAL_42265bf.md` @ Web `42265bf` / audit tip `8f9c050` (`8f9c050968a84075bf3a23711ad1b876dacd0c7c`) |
| Scope | **G08** MenuBar shortcuts; confirm G18 recog STFT residual; G02/G19; G06/G17 BLOCKED |
| Rule | Read-only; **no matrix PASS**; CLOSED only with full shell parity |
| Machine | HH-laptop (`D:\project\_wt_bot_a_audit`) |

## Verified SHAs

| SHA | Role |
|-----|------|
| `d7e6973393f7d83e0be25d4ccc2d43185d964966` | `origin/main` tip = audit subject (short `d7e6973`) |
| `498b2ace5a683acf2d94f1cf3ed76c1072657771` | Bot-B wave23: MenuBar QKeySequence parity |
| `8f9c050` | Prior Bot-A INCREMENTAL_42265bf (base) |
| `17471a6488383b456281d12cb1a6d3d80290205d` | Desktop tip |

**ID map:** G08 MenuBar shortcuts = B `498b2ac`. Tip `d7e6973`.

## Diff vs prior (`42265bf` → `d7e6973`)

1. **B G08 MenuBar accelerators (`498b2ac`):** `useMenuBarShortcuts` — Ctrl/Cmd+N/O/S, Ctrl/Cmd+Z, Ctrl/Cmd+Y / Ctrl+Shift+Z, Delete, Alt+Left/Right view history; skip when typing target focused. Menu items show `data-accel` + accel labels. Stamps `data-menubar-shortcuts="wave23"` / `data-g08-shortcuts="wave23"`. Matches rebuild `MainWindow::buildMenus` QKeySequence subset — **MET** beyond prior wave17 shell-column keyboard only.
2. **G08 not CLOSED:** Bot-B deferred full desktop shell pixel re-shot; not every rebuild menu accel necessarily mirrored. Prior TOP “full shell re-shot” residual remains → **PARTIAL**.
3. **G07:** No tip delta (Bot-B notes); residual full Qt DetectionWorker unchanged.
4. **G18 confirm:** mod STFT linked retained; recognition STFT panes residual unchanged — **not invented**.
5. **G02 / G19:** Unchanged PARTIAL; `data-native-qfiledialog="false"`.
6. **ChartMarkOverlay:** backticks **16**. **G06/G17:** **BLOCKED**.

Bot notes: `bot-b/BOT_B_WAVE23_G08_MENU_SHORTCUTS.md` (`matrix_pass_claimed: false`).

## Verdict summary

| ID | Prior (`42265bf`) | Now (`d7e6973`) | One-liner |
|----|---------------------|-------------------|-----------|
| **G08** | PARTIAL (full shell re-shot residual) | **PARTIAL (deepened)** | MenuBar QKeySequence / useMenuBarShortcuts **MET** (`498b2ac`); full shell re-shot → **not CLOSED** |
| **G18** | PARTIAL (recog STFT panes residual) | **unchanged PARTIAL** | mod STFT MET retained; recog panes → **not CLOSED** |
| **G02** / **G19** | PARTIAL | **unchanged PARTIAL** | SpectralSettings / native QFileDialog residuals |
| **G17** | PARTIAL (recognition BLOCKED) | **unchanged — recognition still BLOCKED** | no elevation |
| **G06** | PARTIAL (eye/bitstream BLOCKED) | **unchanged — eye/bitstream still BLOCKED** | no invented path |
| G07 / G11 | PARTIAL | **unchanged** | residuals retained |
| G05 / G14 | CLOSED | **CLOSED** | unchanged |
| G25 | DOCS | **DOCS** | unchanged |

**Counts (membership-normalized, unchanged bucket sizes):** OPEN **7** · PARTIAL **16** · CLOSED **2** (G05, G14) · DOCS **1** (G25). **No PASS.**

- OPEN: G09–G10, G16, G21–G24
- PARTIAL: G01, G02–G04, G06, G07, G08, G11–G13, G15, G17, G18, G19–G20, G26
- CLOSED: G05, G14

## Focus detail

### G08 — MenuBar QKeySequence — **PARTIAL (deepened)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Prior shell column keyboard / width/aria | MET (retained) | wave14/17 |
| File/Edit/View menu accelerators + hook | **MET** | `useMenuBarShortcuts`; `data-menubar-shortcuts="wave23"` |
| Full desktop shell visual re-shot | residual | Bot-B deferred → **not CLOSED** |

## TOP residual (max 8, parallel-friendly)

1. **G17 residual** — recognition **BLOCKED**
2. **G06 residual** — eye/bitstream/recognition **BLOCKED**; interactive STFT
3. **G19 residual** — **true native QFileDialog** (`data-native-qfiledialog=false`)
4. **G18 residual** — recognition STFT panes linked (mod STFT **done**)
5. **G07 residual** — full Qt Detect Worker beyond LocalCompute
6. **G02 residual** — full Qt SpectralSettingsWidget method/duration/statistic
7. **G08 residual** — full desktop shell re-shot (MenuBar shortcuts **done** @ wave23)
8. **G11 residual** — remaining PlotWidget paint nuances *(or G09/G16 OPEN)*

## Explicit

**matrix_pass_claimed: false**  
**No ACCEPTANCE_MATRIX PASS. No self-declared PASS.**  
G08 remains **PARTIAL** (deepened), **not CLOSED**. G17 recognition **not elevated**. G06/G17 stay **BLOCKED**. ChartMarkOverlay backticks = **16**.