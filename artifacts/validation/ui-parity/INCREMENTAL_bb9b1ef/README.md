# INCREMENTAL_bb9b1ef — G web-2091dc0 evidence-only: G08 MenuBar wave23 corroboration (no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-22 02:10 Asia/Shanghai |
| Web tip (audit subject) | **`bb9b1ef`** = `bb9b1ef58deb214514fac604c9e72666c90ca2dc` (G `2df3892` on A `2091dc0` / `3d777d1`) |
| Desktop | **`17471a6`** (`signal_studio_rebuild`) |
| Prior Bot-A | `INCREMENTAL_663b522/` @ Web `663b522` / audit tip `3d777d1` (`3d777d1d6bdf03cf44bc2ee94a1522c897fb2ec5`); CAO merged → `2091dc0` |
| Scope | **LIGHT** — G corroborates G08 `data-g08-shortcuts=wave23`; no apps/packages delta on tip |
| Rule | Read-only; **no matrix PASS**; CLOSED only if full shell re-shot residual gone (it is **not**) |
| Machine | HH-laptop (`D:\project\_wt_bot_a_audit`) |
| Folder | `artifacts/validation/ui-parity/INCREMENTAL_bb9b1ef/` |

## Verified SHAs

| SHA | Role |
|-----|------|
| `bb9b1ef58deb214514fac604c9e72666c90ca2dc` | `origin/main` tip = audit subject (short `bb9b1ef`) |
| `2df3892` | Bot-G `qa(bot-g): web-2091dc0 G08 MenuBar wave23 + folded G18` (**NOT PASS**) |
| `2091dc0` | merge: A INCREMENTAL_663b522 (`3d777d1`) |
| `3d777d1` | Prior Bot-A INCREMENTAL_663b522 (base) |
| `498b2ac` | Bot-B wave23 impl (unchanged; G packs evidence) |
| `17471a6488383b456281d12cb1a6d3d80290205d` | Desktop tip |

**ID map:** Evidence-only tip. G08 code delta was already audited @ `INCREMENTAL_663b522`; this tip adds G screenshots / DOM stamps.

## Diff vs prior (`663b522` / `3d777d1` → `bb9b1ef`)

1. **G web-2091dc0 (`2df3892`):** evidence-only. Captures File/Edit/View accel labels + menubar strip; observes `data-g08-shortcuts="wave23"` / `data-menubar-shortcuts="wave23"`; file Ctrl+N/O/S, edit Ctrl+Z/Y + Del, view Alt+Left/Right. Live shortcut stamps `wave23`. `keyboard_ctrl_n: skipped-avoid-dialog-hang` (honest; no invented keystroke pass). Folded G18 observe/mod STFT soft captures. `matrix_pass_claimed: false`; `g06_g17_claimed: false`.
2. **G08:** Corroborates prior **MET** MenuBar QKeySequence / useMenuBarShortcuts from `INCREMENTAL_663b522`. **Does not remove** full desktop shell re-shot residual → remain **PARTIAL** (corroborated deepen; **not CLOSED**).
3. **No apps/packages tip delta** beyond G artifact tree — statuses otherwise unchanged.
4. **G18:** mod STFT MET retained (fold); recognition STFT panes residual — **not invented**; G17 **not elevated**.
5. **G02 / G19:** Unchanged PARTIAL; `data-native-qfiledialog="false"`.
6. **ChartMarkOverlay:** backticks **16**. **G06/G17:** **BLOCKED**.

Bot notes: `qa/web-2091dc0/notes.json` + `COMPARISON_NOTES.md` + `QA_CHECKLIST.md`.

## Verdict summary

| ID | Prior (`663b522`) | Now (`bb9b1ef`) | One-liner |
|----|---------------------|-------------------|-----------|
| **G08** | PARTIAL (deepened; shortcuts MET) | **PARTIAL (G-corroborated; not CLOSED)** | `data-g08-shortcuts=wave23` + accel captures; full shell re-shot residual |
| **G18** | PARTIAL (recog panes residual) | **unchanged PARTIAL** | fold corroborates mod STFT MET |
| **G02** / **G19** | PARTIAL | **unchanged PARTIAL** | residuals retained |
| **G17** / **G06** | PARTIAL — BLOCKED | **unchanged — BLOCKED** | no invent / no elevate |
| G07 / G11 | PARTIAL | **unchanged** | residuals retained |
| G05 / G14 | CLOSED | **CLOSED** | unchanged |
| G25 | DOCS | **DOCS** | unchanged |

**Counts (membership-normalized, unchanged):** OPEN **7** · PARTIAL **16** · CLOSED **2** (G05, G14) · DOCS **1** (G25). **No PASS.**

- OPEN: G09–G10, G16, G21–G24
- PARTIAL: G01, G02–G04, G06, G07, G08, G11–G13, G15, G17, G18, G19–G20, G26
- CLOSED: G05, G14

## Focus detail — G08 evidence

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| MenuBar QKeySequence / useMenuBarShortcuts | MET (retained + G-corroborated) | B `498b2ac`; G `01`–`04` + DOM stamps |
| Full desktop shell visual re-shot | residual | still deferred → **not CLOSED** |

## TOP residual (max 8)

1. **G17 residual** — recognition **BLOCKED**
2. **G06 residual** — eye/bitstream **BLOCKED**
3. **G19 residual** — **true native QFileDialog** (`data-native-qfiledialog=false`)
4. **G18 residual** — recognition STFT panes (mod STFT **done**)
5. **G07 residual** — full Qt Detect Worker beyond LocalCompute
6. **G02 residual** — full Qt SpectralSettingsWidget method/duration/statistic
7. **G08 residual** — full desktop shell re-shot (MenuBar shortcuts **done** + G-corroborated)
8. **G11 residual** — PlotWidget paint nuances *(or G09/G16 OPEN)*

## Explicit

**matrix_pass_claimed: false**  
**No ACCEPTANCE_MATRIX PASS. No self-declared PASS.**  
G08 remains **PARTIAL** (G-corroborated), **not CLOSED**. G06/G17 **BLOCKED**. ChartMarkOverlay backticks = **16**.