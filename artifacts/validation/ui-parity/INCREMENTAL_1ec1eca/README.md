# INCREMENTAL_1ec1eca — G qa/web-4db4208 evidence: G02/G08 corroboration (no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-22 02:50 Asia/Shanghai |
| Web tip (audit subject) | **`1ec1eca`** = `1ec1eca8109279bca6474d24bcd857b838cae97f` (G `84b8c72` on A `bf50418` / `7486955`) |
| Desktop | **`17471a6`** |
| Prior Bot-A | `INCREMENTAL_4db4208/` @ audit tip `7486955` (`748695582948f83721f61c8ef3156ea6bef2e394`) |
| Scope | **Evidence-only / short** — corroborate `qa/web-4db4208/` vs prior G02 PARTIAL + G08 PARTIAL |
| Rule | Read-only; **no matrix PASS**; G02 **not CLOSED** on UI auto-N alone; D formal non-PoT/STFT-DDC **BLOCKED** |
| Machine | HH-laptop (`D:\project\_wt_bot_a_audit`) |
| Folder | `artifacts/validation/ui-parity/INCREMENTAL_1ec1eca/` |
| MATRIX | `artifacts/validation/ui-parity/INCREMENTAL_1ec1eca/MATRIX.md` |

## Verified SHAs

| SHA | Role |
|-----|------|
| `1ec1eca8109279bca6474d24bcd857b838cae97f` | `origin/main` tip = audit subject (short `1ec1eca`) |
| `84b8c72207a7e0d1974b669d9cc9404c2b9f4b53` | Bot-G `qa(bot-g): web-4db4208 G02 SpecParamStrip + G08 no-regress` (**NOT PASS**) |
| `bf50418` | merge(A): INCREMENTAL_4db4208 |
| `7486955` | Prior Bot-A INCREMENTAL_4db4208 |
| `4db4208e50c8f4ae1a3d56d01c797c9347117a41` | Evidence-base functional tip G locked |
| `17471a6488383b456281d12cb1a6d3d80290205d` | Desktop tip |

## G evidence paths + key claims

| Path | Role |
|------|------|
| `artifacts/validation/ui-parity/qa/web-4db4208/notes.json` | DOM observations |
| `artifacts/validation/ui-parity/qa/web-4db4208/COMPARISON_NOTES.md` | NOT PASS summary |
| `artifacts/validation/ui-parity/qa/web-4db4208/QA_CHECKLIST.md` | checklist |
| `artifacts/validation/ui-parity/qa/web-4db4208/01`–`07` PNGs | auto-N off/on, removeMean, kaiser, G08 soft |
| `artifacts/validation/ui-parity/qa/web-4db4208/fold-web-762b876/` | prior wave29 fold |

**Key G claims (all `matrix_pass_claimed: false`):**
- auto-N off: `data_auto_n=off`, `data_dsp_auto_nb=false`
- auto-N on: `data_auto_n=on`, `data_dsp_auto_nb=true`, strip `segment_ms=0`, `resolveAnalysisSamples` copy; settled
- removeMean on: strip `remove_mean=true` / text on
- blocked periodogram/bartlett/multitaper/burg all true; method disabled welch; `NA_PSD_ONLY`
- Kaiser gate enabled/disabled; G08 soft `wave23`

## Diff vs prior (`7486955` / `4db4208` → `1ec1eca`)

1. **Evidence-only tip** — G pack on post-merge `4db4208` base; no apps/packages delta beyond qa tree.
2. **G02:** Corroborates PoT UI→DSP auto-N/removeMean **MET** path — **no flip to CLOSED**. Multitaper/Burg + **non-PoT BLOCKED** + **STFT-DDC BLOCKED** (D formal / CAO) remain.
3. **G08:** soft wave23 no-regress — stays **PARTIAL** (desktop pixel / `buildMenus` residual).
4. **G06/G17:** **BLOCKED** unchanged. backticks **16**. `data-native-qfiledialog=false`.

## Verdict summary

| ID | Prior (`4db4208`) | Now (`1ec1eca`) | One-liner |
|----|---------------------|-------------------|-----------|
| **G02** | PARTIAL | **PARTIAL (G-corroborated; not CLOSED)** | auto-N/removeMean/kaiser/blocked match; non-PoT/STFT-DDC **BLOCKED** |
| **G08** | PARTIAL | **PARTIAL (G soft; not CLOSED)** | wave23 no-regress; desktop pixel residual |
| **G18** | PARTIAL | **unchanged PARTIAL** | recog residual |
| **G19** | PARTIAL | **unchanged PARTIAL** | native QFileDialog residual |
| **G17** / **G06** | PARTIAL — BLOCKED | **unchanged — BLOCKED** | no invent |
| G07 / G11 | PARTIAL | **unchanged** | residuals |
| G05 / G14 | CLOSED | **CLOSED** | unchanged |
| G25 | DOCS | **DOCS** | unchanged |

**Counts:** OPEN **7** · PARTIAL **16** · CLOSED **2** · DOCS **1**. **No PASS.**

## TOP residual (max 8)

1. **G17** — recognition **BLOCKED**
2. **G06** — eye/bitstream **BLOCKED**
3. **G19** — true native QFileDialog (`=false`)
4. **G18** — recognition STFT panes
5. **G07** — full Qt Detect Worker
6. **G02** — Multitaper/Burg **BLOCKED**; **non-PoT BLOCKED**; **STFT-DDC BLOCKED**; full Qt SpectralSettings
7. **G08** — desktop Qt pixel / full `buildMenus`
8. **G11** / G09·G16 OPEN

## Explicit

**matrix_pass_claimed: false**  
**ui_parity_pass_claimed: false**  
**pass_claimed: false**  
G02/G08 remain **PARTIAL**. G06/G17 **BLOCKED**. backticks = **16**.