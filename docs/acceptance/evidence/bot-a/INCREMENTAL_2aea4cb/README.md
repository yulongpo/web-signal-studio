# INCREMENTAL_2aea4cb — A3 strip stamp MET (supersedes da9fdab / 41f69c1) (no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-22 08:08 Asia/Shanghai |
| Web tip | **`2aea4cb`** = `2aea4cb34f08f0cc5dc28689d617ff92e81b608a` |
| Desktop | **`17471a6`** |
| Supersedes | `INCREMENTAL_da9fdab` / audit tip `41f69c1` (`41f69c16f66c1c8741df15f9eb4a464fe545183f`) |
| Scope | B SpecParamStrip `dspAnalysisSamples` stamp; retain A2/A5; ACTIONABLE owners for D4/D5 |
| Rule | Docs-only; **matrix_pass_claimed=false**; G06/G17 BLOCKED; G02 PARTIAL fence |
| Evidence | `docs/acceptance/evidence/bot-a/INCREMENTAL_2aea4cb/` + `artifacts/validation/ui-parity/INCREMENTAL_2aea4cb/` |

## Verified SHAs

| SHA | Role |
|-----|------|
| `2aea4cb34f08f0cc5dc28689d617ff92e81b608a` | `origin/main` tip |
| `a858983` | B SpecParamStrip A3 stamp |
| `da9fdab` | Prior main (A5); superseded audit subject |
| `41f69c16f66c1c8741df15f9eb4a464fe545183f` | Superseded Bot-A tip `INCREMENTAL_da9fdab` |
| `17471a6488383b456281d12cb1a6d3d80290205d` | Desktop |

## A3 — dspAnalysisSamples stamp (**MET**)

**Cite:** `apps/web/src/components/ChartParamStrip.tsx` SpecParamStrip; `BOT_B_A3_DSP_ANALYSIS_SAMPLES_da9fdab.md`; D publish `dspAnalysisSamples` already on tip.

| Check | Result |
|-------|--------|
| Reads `uiStore.dspAnalysisSamples` (post-resolve pre-PoT) | **MET** |
| Distinct from `dspFftSizeActive` / FFTn (attrs + overflow parenthetical) | **MET** |
| Main + overflow stamp (`chart-strip-qlabel-analysis-samples`, `overflow-spectral-analysis-samples`) | **MET** |
| Does not invent Multitaper/Burg / change DSP contracts | **honest** |

**A3 residual (does not block MET for stamp):** empty when store null (`data-strip-empty` / partial attrs) — honest until feed runs. G02 not CLOSED (⑥ still BLOCKED).

**A3 verdict:** **MET** (D publish + B strip stamp). Prior ACTIONABLE “B strip stamp OPEN” **closed**.

## A2 / A5 — retained

| Item | Status |
|------|--------|
| A2 visibleBandwidthHz auto-N | **MET** retained |
| A5 spectral_settings_json open/save | **MET** retained (`read`/`apply` in `uiStore`) |

## Soft fences

| ID | Status |
|----|--------|
| G02 | **PARTIAL** — A1–A5 deepen; ⑥ Multitaper/Burg/**non-PoT**/**STFT-DDC** **BLOCKED** |
| G08 / G07 / G19 | **PARTIAL** |
| G18 | **PARTIAL** — recog STFT **written BLOCKED** |
| G06 / G17 | **BLOCKED** |
| G09 / G16 | **OPEN** |

**Counts:** OPEN **7** · PARTIAL **16** · CLOSED **2** · DOCS **1**  
**backticks:** **16** · `data-native-qfiledialog=false`

## Explicit

**matrix_pass_claimed: false** · **ui_parity_pass_claimed: false** · **pass_claimed: false**  
`41f69c1` / `INCREMENTAL_da9fdab` **superseded** by this tip.