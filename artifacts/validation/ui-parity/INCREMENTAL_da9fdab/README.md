> **SUPERSEDED** by `INCREMENTAL_2aea4cb` (Web tip `2aea4cb`; audit tip replaces `41f69c1`). Keep as historical A5 MET audit. **matrix_pass_claimed: false**.

# INCREMENTAL_da9fdab — A5 open/save MET + A2 retained (supersedes 0f1183a / caaf7c8) (no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-22 08:06 Asia/Shanghai |
| Web tip | **`da9fdab`** = `da9fdab56ddf108816a5024d842f3d8263032d40` |
| Desktop | **`17471a6`** |
| Supersedes | `INCREMENTAL_0f1183a` / audit tip `caaf7c8` (`caaf7c846f54697a4753fe612d81d49299659f96`) |
| Scope | B A5 MenuBar/project open-save wire; light A2 re-verify; ACTIONABLE refresh |
| Rule | Docs-only; **matrix_pass_claimed=false**; G06/G17 BLOCKED; G02 PARTIAL fence |
| Evidence | `docs/acceptance/evidence/bot-a/INCREMENTAL_da9fdab/` + `artifacts/validation/ui-parity/INCREMENTAL_da9fdab/` |

## Verified SHAs

| SHA | Role |
|-----|------|
| `da9fdab56ddf108816a5024d842f3d8263032d40` | `origin/main` tip |
| `66b0993` / `aa9a555` | B A5 open/save wire + evidence |
| `0f1183a` | Prior main (C A2); superseded audit subject |
| `caaf7c846f54697a4753fe612d81d49299659f96` | Superseded Bot-A tip `INCREMENTAL_0f1183a` |
| `17471a6488383b456281d12cb1a6d3d80290205d` | Desktop |

## A5 — open/save (**MET**)

**Cite:** `apps/web/src/store/uiStore.ts` `openProjectFromText` / `saveProjectJsonText`; `BOT_B_A5_SPECTRAL_SETTINGS_6bf49bb.md`; vitest `uiStore.spectralSettingsA5.test.ts`.

| Check | Result |
|-------|--------|
| **open** → `readSpectralChromePrefsFromFile(activeFile)` → chrome prefs patch | **MET** |
| **save** → `spectralChromePrefsFromState` → `applySpectralChromePrefsToProject` → JSON | **MET** |
| F schema + desktop `spectrogramSettings` bridge | retained **MET** |
| Multitaper/Burg invent / dual-write C bandwidth | **not done** (honest) |

**A5 residual (honest, does not block MET for prefs persist):** SpecParamStrip still does not stamp `dspAnalysisSamples` (separate A3 chrome item). No PASS / G02 not CLOSED.

**A5 verdict:** **MET** (schema + B open/save wire). Prior `INCREMENTAL_0f1183a` “B persist OPEN” **superseded**.

## A2 — retained (**MET**)

Light re-check on tip: `visibleBandwidthHz.ts` present; `MainChartHost` `analysisBandwidthHz` seed + `onViewCommit`; auto-N uses visible span with fs fallback; fixed-SegmentMs still fs (residual unchanged). **A2 MET** retained from `0f1183a` audit.

## Soft fences

| ID | Status |
|----|--------|
| G02 | **PARTIAL** — A1/A2/A3/A5 deepen; Multitaper/Burg/**non-PoT**/**STFT-DDC** **BLOCKED** (⑥) |
| G08 | **PARTIAL** |
| G07 | **PARTIAL** |
| G18 | **PARTIAL** — recog STFT **written BLOCKED** retained |
| G06 / G17 | **BLOCKED** |
| G19 | **PARTIAL** — `data-native-qfiledialog=false` |
| G09 / G16 | **OPEN** |

**Counts:** OPEN **7** · PARTIAL **16** · CLOSED **2** · DOCS **1**  
**backticks:** **16**

## Explicit

**matrix_pass_claimed: false** · **ui_parity_pass_claimed: false** · **pass_claimed: false**  
`caaf7c8` / `INCREMENTAL_0f1183a` **superseded** by this tip.