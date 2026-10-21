# INCREMENTAL_1f2bcee — G web-ca28052 evidence-only: wave26 auto-N corroboration (no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-22 02:25 Asia/Shanghai |
| Web tip (audit subject) | **`1f2bcee`** = `1f2bceecc3c45f90c987abd123d3eb33a887fe5f` (G `91aa309` on A `a0c9f83` / `085ffbf`) |
| Desktop | **`17471a6`** |
| Prior Bot-A | `INCREMENTAL_ca28052/` @ Web `ca28052` / audit tip `085ffbf` (`085ffbf35a9eeb7f0e5b9f576e16dd6ec1b8a87f`); merged → `a0c9f83` |
| Scope | **LIGHT / evidence-only** — corroborate `qa/web-ca28052/` vs prior G02 honesty; G08/G18 soft; no apps delta |
| Business tip | Functional chrome still `ca28052` + A `a0c9f83`; this tip only adds G pack |
| Rule | Read-only; **no matrix PASS**; no status elevation from screenshots alone |
| Machine | HH-laptop (`D:\project\_wt_bot_a_audit`) |
| Folder | `artifacts/validation/ui-parity/INCREMENTAL_1f2bcee/` |

## Verified SHAs

| SHA | Role |
|-----|------|
| `1f2bceecc3c45f90c987abd123d3eb33a887fe5f` | `origin/main` tip = audit subject (short `1f2bcee`) |
| `91aa30937f98bcb81919d08526bfd694d8b4c987` | Bot-G `qa(bot-g): web-ca28052 wave26 SpecParamStrip auto-N` (**NOT PASS**) |
| `a0c9f83` | merge: A INCREMENTAL_ca28052 (`085ffbf`) |
| `085ffbf` | Prior Bot-A INCREMENTAL_ca28052 (base) |
| `ca280524cfb8185c534a2cf78a7b7ae17ad3cb91` | Business / evidence-base tip (B wave26) |
| `cd204ef` | Bot-B wave26 impl (unchanged) |
| `2094504` / `4a738d2` | Also landed: G web-f72184c (prior wave25 pack; optional fold) |
| `17471a6488383b456281d12cb1a6d3d80290205d` | Desktop tip |

**ID map:** Evidence-only. G02 code honesty already audited @ `INCREMENTAL_ca28052`; this tip adds G screenshots/DOM observations.

## Diff vs prior (`ca28052` / `085ffbf` → `1f2bcee`)

1. **G web-ca28052 (`91aa309`):** evidence-only. Observations match prior honesty matrix:
   - `data_auto_n: "na"` / `data_auto_n_status: "BLOCKED"` / copy `auto N/B: NA (sized by fftSize)` / `auto_n_blocked: true`
   - Method `welch` disabled + copy listing Multitaper/Burg/Periodogram/Bartlett **BLOCKED**; all four `blocked: true`
   - Kaiser gate: disabled copy when not kaiser; enabled path publishes β `8.6`
   - Strip wave includes `wave26`; statistic `NA_PSD_ONLY`
   - `matrix_pass_claimed: false`; `g06_g17_claimed: false`; gaps: none recorded
2. **G02:** Corroborates prior PARTIAL honesty deepen — **no elevation**; auto N/B still **not MET** → remain **PARTIAL (not CLOSED)**.
3. **G08 soft:** `g08/wave: wave23` + capture `05-g08-soft.png` — **no regression**.
4. **G18 soft:** observe multi-view / stft_linked / psd linked + `06-g18-soft.png` — **no regression**; recog panes residual; G17 **not elevated**.
5. **Also on tip path:** G web-f72184c (`4a738d2`) wave25 chrome pack — historical fold; does not change statuses.
6. **No apps/packages tip delta** for `1f2bcee` itself. ChartMarkOverlay backticks **16**. G06/G17 **BLOCKED**. `data-native-qfiledialog="false"`.

Bot notes: `qa/web-ca28052/notes.json` + `COMPARISON_NOTES.md` + `QA_CHECKLIST.md`.

## Verdict summary

| ID | Prior (`ca28052`) | Now (`1f2bcee`) | One-liner |
|----|---------------------|-------------------|-----------|
| **G02** | PARTIAL (auto-N honesty) | **PARTIAL (G-corroborated; not CLOSED)** | DOM/captures match `data-auto-n=na` / blocked methods / Kaiser gate |
| **G08** | PARTIAL | **unchanged PARTIAL** | soft wave23; no regression |
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

## Evidence delta (G pack vs prior audit)

| Claim from INCREMENTAL_ca28052 | G observation | Match? |
|-------------------------------|---------------|--------|
| `data-auto-n=na` + BLOCKED/NA copy | `overflow_auto_n.*` | **yes** |
| Method disabled welch-only + BLOCKED list | method_disabled + blocked.{periodogram,bartlett,multitaper,burg}=true | **yes** |
| Kaiser only when window=kaiser | enabled/disabled path captures | **yes** |
| G08 wave23 / G18 mod-observe soft | g08_soft / g18_soft | **yes** |

## TOP residual (max 8)

1. **G17 residual** — recognition **BLOCKED**
2. **G06 residual** — eye/bitstream **BLOCKED**
3. **G19 residual** — **true native QFileDialog** (`=false`)
4. **G18 residual** — recognition STFT panes (mod STFT **done**)
5. **G07 residual** — full Qt Detect Worker beyond LocalCompute
6. **G02 residual** — real auto N/B sizing + BLOCKED method compute + removeMean + full Qt SpectralSettings
7. **G08 residual** — full desktop shell re-shot
8. **G11 residual** — PlotWidget paint *(or G09/G16 OPEN)*

## Explicit

**matrix_pass_claimed: false**  
**ui_parity_pass_claimed: false**  
**pass_claimed: false**  
**No ACCEPTANCE_MATRIX PASS. No self-declared PASS.**  
G02 remains **PARTIAL** (G-corroborated), **not CLOSED**. G06/G17 **BLOCKED**. ChartMarkOverlay backticks = **16**.