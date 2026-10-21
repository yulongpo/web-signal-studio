# INCREMENTAL_ab32f6e — G web-62fc184 evidence: G08 MenuBar full-shell re-shot (no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-22 02:32 Asia/Shanghai |
| Web tip (audit subject) | **`ab32f6e`** = `ab32f6e901182113cb66c0da2b9a028057d7aec1` (G `4bc03b8` on A `62fc184` / `95eb65a`) |
| Desktop | **`17471a6`** |
| Prior Bot-A | `INCREMENTAL_1f2bcee/` @ Web `1f2bcee` / audit tip `95eb65a` (`95eb65a4861b5d6292faa210caff30f89c7e18df`); merged → `62fc184` |
| Scope | **G08** independent full-shell MenuBar re-shot corroboration; soft G02/G18 |
| Rule | Read-only; **no matrix PASS**; CLOSED only if full shell residual truly gone (it is **not**) |
| Machine | HH-laptop (`D:\project\_wt_bot_a_audit`) |
| Folder | `artifacts/validation/ui-parity/INCREMENTAL_ab32f6e/` |

## Verified SHAs

| SHA | Role |
|-----|------|
| `ab32f6e901182113cb66c0da2b9a028057d7aec1` | `origin/main` tip = audit subject (short `ab32f6e`) |
| `4bc03b851e86d206253aa4e2b1aadc30826b2940` | Bot-G `qa(bot-g): web-62fc184 G08 MenuBar full-shell shortcuts re-shot` (**NOT PASS**) |
| `62fc184` | merge: A INCREMENTAL_1f2bcee (`95eb65a`) |
| `95eb65a` | Prior Bot-A INCREMENTAL_1f2bcee (base) |
| `17471a6488383b456281d12cb1a6d3d80290205d` | Desktop tip |

**ID map:** Evidence-only tip. G08 impl still B wave23 (`498b2ac` / `useMenuBarShortcuts`); this tip adds independent G full-shell inventory.

## Diff vs prior (`1f2bcee` / `95eb65a` → `ab32f6e`)

1. **G web-62fc184 (`4bc03b8`):** independent MenuBar full-shell re-shot (explicitly “not trusting Bot-B claim”):
   - Root: `data-testid=menubar`; `data-g08-shortcuts=wave23`; `data-menubar-shortcuts=wave23`; role=menubar
   - Six triggers visible: **File / Edit / View / Analysis / Tools / Help**
   - File·Edit·View `data-accel` + labels: Ctrl+N/O/S, Ctrl+Z/Y, Del, Alt+Left/Right
   - Analysis / Tools / Help menus opened and captured (detect/roi; about; mouse)
   - Soft G02 (wave26 strip) / G18 (multi-view + stft_linked)
   - `matrix_pass_claimed: false`; `g06_g17_claimed: false`; gaps: none recorded
2. **G08 deepen PARTIAL:** prior residual “full shell re-shot” now has **independent G web six-menu inventory** + File/Edit/View accel corroboration beyond soft stamps — **MET** as web shell menu coverage evidence. **Not CLOSED:** pack does **not** claim desktop Qt pixel parity / every rebuild `buildMenus` accel mirrored; COMPARISON_NOTES remain **NOT PASS**; residual → desktop visual/parity delta + any non-File/Edit/View accel gaps.
3. **G02 / G18 soft:** wave26 strip + observe multi-view/STFT — **no regression**; carry PARTIAL.
4. **G06 / G17:** **BLOCKED** unchanged. `data-native-qfiledialog="false"`. ChartMarkOverlay backticks **16**.
5. **No apps/packages tip delta** — evidence tree only.

Bot notes: `qa/web-62fc184/notes.json` + `COMPARISON_NOTES.md` + `QA_CHECKLIST.md`.

## Verdict summary

| ID | Prior (`1f2bcee`) | Now (`ab32f6e`) | One-liner |
|----|---------------------|-------------------|-----------|
| **G08** | PARTIAL (shortcuts MET; shell re-shot residual) | **PARTIAL (deepened)** | Independent six-menu full-shell + File·Edit·View accels; desktop pixel parity residual → **not CLOSED** |
| **G02** | PARTIAL | **unchanged PARTIAL** | soft wave26; no regression |
| **G18** | PARTIAL | **unchanged PARTIAL** | soft multi-view/STFT; recog residual |
| **G19** | PARTIAL | **unchanged PARTIAL** | native QFileDialog residual |
| **G17** / **G06** | PARTIAL — BLOCKED | **unchanged — BLOCKED** | no invent / no elevate |
| G07 / G11 | PARTIAL | **unchanged** | residuals retained |
| G05 / G14 | CLOSED | **CLOSED** | unchanged |
| G25 | DOCS | **DOCS** | unchanged |

**Counts (membership-normalized, unchanged):** OPEN **7** · PARTIAL **16** · CLOSED **2** (G05, G14) · DOCS **1** (G25). **No PASS.**

- OPEN: G09–G10, G16, G21–G24
- PARTIAL: G01, G02–G04, G06, G07, G08, G11–G13, G15, G17, G18, G19–G20, G26
- CLOSED: G05, G14

## Focus detail — G08 full-shell evidence

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| `data-g08-shortcuts=wave23` + menubar testid | MET (retained + G) | `menubar_root` |
| File·Edit·View accel labels | MET (retained + G) | captures 02–04 |
| Six menus File/Edit/View/Analysis/Tools/Help | **MET (web inventory)** | captures 01, 05, 06 + triggers |
| Desktop Qt shell pixel / full `buildMenus` parity | residual | G **NOT PASS**; → **not CLOSED** |

## TOP residual (max 8)

1. **G17 residual** — recognition **BLOCKED**
2. **G06 residual** — eye/bitstream **BLOCKED**
3. **G19 residual** — **true native QFileDialog** (`=false`)
4. **G18 residual** — recognition STFT panes (mod STFT **done**)
5. **G07 residual** — full Qt Detect Worker beyond LocalCompute
6. **G02 residual** — real auto N/B + BLOCKED method compute + removeMean + full Qt SpectralSettings
7. **G08 residual** — desktop Qt shell pixel / full `buildMenus` parity (web six-menu inventory **done** @ G `4bc03b8`)
8. **G11 residual** — PlotWidget paint *(or G09/G16 OPEN)*

## Explicit

**matrix_pass_claimed: false**  
**ui_parity_pass_claimed: false**  
**pass_claimed: false**  
**No ACCEPTANCE_MATRIX PASS. No self-declared PASS.**  
G08 remains **PARTIAL** (deepened), **not CLOSED**. G06/G17 **BLOCKED**. ChartMarkOverlay backticks = **16**.