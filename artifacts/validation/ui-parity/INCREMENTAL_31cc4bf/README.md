# INCREMENTAL_31cc4bf — G web-762b876 evidence-only: wave29 auto-N/removeMean corroboration (no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-22 02:43 Asia/Shanghai |
| Web tip (audit subject) | **`31cc4bf`** = `31cc4bf48a7b596f5f1b51b7836da63de6982f25` (G `4389fb7` on A `d145333` / `04fa0c2`) |
| Desktop | **`17471a6`** |
| Prior Bot-A | `INCREMENTAL_762b876/` @ Web `762b876` / audit tip `04fa0c2` (`04fa0c28a6eabd4c2ba285873d2b1bc31e1a8102`); merged → `d145333` |
| Scope | **LIGHT / evidence-only** — corroborate `qa/web-762b876/` vs prior G02 UI wire; soft G08 |
| Rule | Read-only; **no matrix PASS**; no status elevation from screenshots alone |
| Machine | HH-laptop (`D:\project\_wt_bot_a_audit`) |
| Folder | `artifacts/validation/ui-parity/INCREMENTAL_31cc4bf/` |

## Verified SHAs

| SHA | Role |
|-----|------|
| `31cc4bf48a7b596f5f1b51b7836da63de6982f25` | `origin/main` tip = audit subject (short `31cc4bf`) |
| `4389fb73af8f9216a16ad3e4eb8f085c48de3927` | Bot-G `qa(bot-g): web-762b876 wave29 SpecParamStrip auto-N/removeMean` (**NOT PASS**) |
| `d145333` | merge: A INCREMENTAL_762b876 (`04fa0c2`) |
| `04fa0c2` | Prior Bot-A INCREMENTAL_762b876 (base) |
| `762b87645948cf03662c1f969ad69adaef3910ee` | Business / evidence-base tip (B wave29) |
| `d88dad7` | Bot-B wave29 impl (unchanged) |
| `17471a6488383b456281d12cb1a6d3d80290205d` | Desktop tip |

**ID map:** Evidence-only. G02 UI wire already audited @ `INCREMENTAL_762b876`; this tip adds G captures/DOM.

## Diff vs prior (`762b876` / `04fa0c2` → `31cc4bf`)

1. **G web-762b876 (`4389fb7`):** evidence-only. Observations match prior UI-wire honesty:
   - auto-N **off:** `data_auto_n: "off"`, `data_dsp_auto_nb: "false"`, fixed seg ms
   - auto-N **on:** `data_auto_n: "on"`, `data_dsp_auto_nb: "true"`, strip `segment_ms: "0"`, copy cites `resolveAnalysisSamples`; `settled_naturally: true`
   - removeMean **on:** strip `remove_mean: "true"` / `remove_mean_text: "on"`; overflow pub on
   - blocked methods all `true` (periodogram/bartlett/multitaper/burg); method disabled welch; statistic `NA_PSD_ONLY`
   - Kaiser gate enabled/disabled paths; soft G08 `wave23`
   - `matrix_pass_claimed: false`; `g06_g17_claimed: false`; gaps: none
2. **G02:** Corroborates prior PARTIAL (UI→DSP MET) — **no status flip**; Multitaper/Burg + non-PoT + DDC/decimate + full Qt SpectralSettings residual → remain **PARTIAL (not CLOSED)**.
3. **Soft G08:** wave23 + file trigger — **no regression**.
4. **No apps/packages tip delta.** ChartMarkOverlay backticks **16**. G06/G17 **BLOCKED**. `data-native-qfiledialog="false"`.

Bot notes: `qa/web-762b876/notes.json` + `COMPARISON_NOTES.md` + `QA_CHECKLIST.md`.

## Verdict summary

| ID | Prior (`762b876`) | Now (`31cc4bf`) | One-liner |
|----|---------------------|-------------------|-----------|
| **G02** | PARTIAL (UI wire deepened) | **PARTIAL (G-corroborated; not CLOSED)** | auto-N on/off + removeMean + blocked grey + kaiser match |
| **G08** | PARTIAL | **unchanged PARTIAL** | soft wave23; no regression |
| **G18** | PARTIAL | **unchanged PARTIAL** | recog residual |
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

| Claim from INCREMENTAL_762b876 | G observation | Match? |
|-------------------------------|---------------|--------|
| `data-auto-n=on|off` + dsp-auto-nb | overflow_auto_off/on | **yes** |
| auto-N → segment_ms=0 settle | overflow_auto_on.strip.segment_ms=0 | **yes** |
| removeMean stamp / pub | remove_mean_on | **yes** |
| blocked methods greyed | blocked.* = true | **yes** |
| Kaiser gate | enabled/disabled paths | **yes** |
| soft G08 wave23 | g08_soft | **yes** |

## TOP residual (max 8)

1. **G17 residual** — recognition **BLOCKED**
2. **G06 residual** — eye/bitstream **BLOCKED**
3. **G19 residual** — **true native QFileDialog** (`=false`)
4. **G18 residual** — recognition STFT panes
5. **G07 residual** — full Qt Detect Worker beyond LocalCompute6. **G02 residual** — Multitaper/Burg **BLOCKED**; **non-PoT BLOCKED** (D formal); **STFT-DDC/decimate BLOCKED** (D formal); full Qt SpectralSettings
7. **G08 residual** — desktop Qt pixel / full `buildMenus` parity
8. **G11 residual** — PlotWidget paint *(or G09/G16 OPEN)*


## CAO FYI (injected) — D formally BLOCKED residuals

D formally marks **non-PoT window length** and **full STFT-DDC / decimate pipeline** as **BLOCKED** (no separate tip). Audit honesty for this tip:

- Treat those residuals as **BLOCKED / honest PARTIAL** on **G02** — not deferred soft TODOs that could be waved away by UI evidence.
- **Do NOT CLOSED G02** merely because UI already wires auto-N + removeMean (PoT path).
- Keep **Multitaper / Burg BLOCKED** (throw; greyed).
- Keep **G02 PARTIAL** while only UI + PoT auto-N / removeMean are **MET**; non-PoT + STFT-DDC remain **BLOCKED**.

## Explicit

**matrix_pass_claimed: false**  
**ui_parity_pass_claimed: false**  
**pass_claimed: false**  
**No ACCEPTANCE_MATRIX PASS. No self-declared PASS.**  
G02 remains **PARTIAL** (G-corroborated), **not CLOSED**. G06/G17 **BLOCKED**. ChartMarkOverlay backticks = **16**.