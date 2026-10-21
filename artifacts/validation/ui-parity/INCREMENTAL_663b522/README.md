# INCREMENTAL_663b522 — CAO retarget (supersedes d7e6973): B G08 MenuBar shortcuts + G web-42265bf (no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-22 02:07 Asia/Shanghai |
| Web tip (audit subject) | **`663b522`** = `663b522e7ba86c824310e6c109c42290e1b54092` |
| Desktop | **`17471a6`** (`signal_studio_rebuild`; MainWindow::buildMenus QKeySequence) |
| Prior Bot-A | `INCREMENTAL_42265bf.md` @ Web `42265bf` / audit tip `8f9c050` (`8f9c050968a84075bf3a23711ad1b876dacd0c7c`) |
| Supersedes | `INCREMENTAL_d7e6973` (CAO retarget; tip moved main past d7e6973 → `663b522`) |
| Scope | **G08** MenuBar QKeySequence / useMenuBarShortcuts; G corroboration of G18 mod STFT + G02 SpectralSettings; G06/G17 BLOCKED |
| Rule | Read-only; **no matrix PASS**; CLOSED only with full shell parity |
| Machine | HH-laptop (`D:\project\_wt_bot_a_audit`) |
| Folder | `artifacts/validation/ui-parity/INCREMENTAL_663b522/` (canonical deliverable) |

## Verified SHAs

| SHA | Role |
|-----|------|
| `663b522e7ba86c824310e6c109c42290e1b54092` | `origin/main` tip = audit subject (short `663b522`) |
| `f88c440` | Bot-G `qa(bot-g): web-42265bf` C G18 mod STFT + observe multi-view (**NOT PASS**) |
| `498b2ace5a683acf2d94f1cf3ed76c1072657771` | Bot-B wave23: MenuBar QKeySequence parity |
| `a7bb0fd` | merge: B G08 MenuBar shortcuts wave23 |
| `d7e6973` | merge: A INCREMENTAL_42265bf (superseded audit subject) |
| `8f9c050` | Prior Bot-A INCREMENTAL_42265bf (base) |
| `17471a6488383b456281d12cb1a6d3d80290205d` | Desktop tip |

**ID map:** G08 MenuBar shortcuts = B `498b2ac`. G evidence = `f88c440` / `qa/web-42265bf`. Tip `663b522`.

## Diff vs prior (`42265bf` → `663b522`)

1. **B G08 MenuBar accelerators (`498b2ac`):** `useMenuBarShortcuts` — Ctrl/Cmd+N/O/S, Ctrl/Cmd+Z, Ctrl/Cmd+Y / Ctrl+Shift+Z, Delete, Alt+Left/Right view history; skip when typing target focused. Menu items show `data-accel` + accel labels. Stamps `data-menubar-shortcuts="wave23"` / `data-g08-shortcuts="wave23"`. Matches rebuild `MainWindow::buildMenus` QKeySequence subset — **MET** beyond prior wave17 shell-column keyboard only.
2. **G08 not CLOSED:** Bot-B deferred full desktop shell pixel re-shot; not every rebuild menu accel necessarily mirrored. Prior TOP “full shell re-shot” residual remains → **PARTIAL**.
3. **G web-42265bf (`f88c440`):** evidence-only pack on C mod STFT + observe multi-view / dwell / Esc / SpectralSettings wave22. `matrix_pass_claimed: false`; `eye_status: BLOCKED`; IQ `sigmf_data_demo-ddc`. Corroborates G18 mod STFT **MET** + G02 soft prefs — **no status elevation**; G02/G18 stay PARTIAL with prior residuals.
4. **G07:** No tip delta (Bot-B notes); residual full Qt DetectionWorker unchanged.
5. **G18 residual:** recognition STFT panes only — **not invented**; G17 recognition **not elevated**.
6. **G19:** Unchanged PARTIAL; `data-native-qfiledialog="false"` (never claim native MET).
7. **ChartMarkOverlay:** backticks **16**. **G06/G17:** **BLOCKED**.

Bot notes: `bot-b/BOT_B_WAVE23_G08_MENU_SHORTCUTS.md`; `qa/web-42265bf/notes.json` + `COMPARISON_NOTES.md`.

## Verdict summary

| ID | Prior (`42265bf`) | Now (`663b522`) | One-liner |
|----|---------------------|-------------------|-----------|
| **G08** | PARTIAL (full shell re-shot residual) | **PARTIAL (deepened)** | MenuBar QKeySequence / useMenuBarShortcuts **MET** (`498b2ac`); full shell re-shot → **not CLOSED** |
| **G18** | PARTIAL (recog STFT panes residual) | **unchanged PARTIAL** (G corroborates mod STFT MET) | recog panes → **not CLOSED**; no recog invent |
| **G02** | PARTIAL | **unchanged PARTIAL** (G corroborates wave22 soft) | full Qt SpectralSettings residual |
| **G19** | PARTIAL | **unchanged PARTIAL** | native QFileDialog residual (`=false`) |
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

### G18 / G02 — G corroboration (no elevate)

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| mod STFT linkedCursor | MET (retained) | C `80d25bd`; G `05-g18-mod-stft-linkedCursor.png` |
| observe multi-view / dwell / Esc | MET (retained) | G captures 02–04, 06 |
| SpectralSettings soft prefs | MET soft (retained) | G `01-spectral-settings-wave22.png` |
| recognition STFT panes / eye | **BLOCKED** | G `eye_status: BLOCKED`; no invent |

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
**CAO retarget:** this folder supersedes `INCREMENTAL_d7e6973`; tip subject is `663b522`, not `d7e6973`.