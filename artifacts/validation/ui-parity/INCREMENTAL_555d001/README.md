> **SUPERSEDED** by `INCREMENTAL_bf2fa8d` (Web tip `bf2fa8d`; audit tip replaces `655761a`). Prior tip also merged main @ `27a3511`. **matrix_pass_claimed: false**.

# INCREMENTAL_555d001 — D4 G09 + D5 G16 PARTIAL (B shell; C residuals) (no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-22 08:14 Asia/Shanghai |
| Web tip | **`555d001`** = `555d00136e84b3f896076d325e7a4e9006c18202` |
| Desktop | **`17471a6`** |
| Prior A tip on main | `b7cab97` (`INCREMENTAL_2aea4cb` merge) — this tip is newer |
| Supersedes audit tip | `49439b2` / `INCREMENTAL_2aea4cb` (`49439b24938d53b4cb838826e1626a3f3a0017d9`) |
| Scope | B D4 BottomScaleChrome + D5 mode-wheel shell; retain A2/A3/A5; ACTIONABLE C owners |
| Rule | Docs-only; **matrix_pass_claimed=false**; no G06/G17 invent; apps delta present |
| Evidence | `docs/acceptance/evidence/bot-a/INCREMENTAL_555d001/` + `artifacts/validation/ui-parity/INCREMENTAL_555d001/` |

## Verified SHAs

| SHA | Role |
|-----|------|
| `555d00136e84b3f896076d325e7a4e9006c18202` | `origin/main` tip |
| `6eb1992` / `a83b4e2` | B D4/D5 feat + evidence |
| `b7cab97c18922d02570bba2ecc9f43d95047d760` | Prior Bot-A merge on main |
| `49439b24938d53b4cb838826e1626a3f3a0017d9` | Superseded Bot-A tip `INCREMENTAL_2aea4cb` |
| `17471a6488383b456281d12cb1a6d3d80290205d` | Desktop |

## D4 G09 — BottomScaleChrome (**PARTIAL**)

**Cite:** `BottomScaleChrome.tsx`; mounted in `BottomPanel.tsx`; `BOT_B_D4_D5_G09_G16_6fdd5fe.md`.

| Check | Result |
|-------|--------|
| View ΔT/ΔF chrome from `navWindowTime` + `spectrogramDisplay.freqHz` + cursor | **landed** |
| `data-g09=partial` / `data-axis-bind=deferred-to-c` | **honest** |
| PlotWidget / MainChartHost **axis tick paint bind** | **residual → C** (MainChartHost has no BottomScale/axisTick bind) |
| Waterfall axis-swap readout copy | **residual → C** |

**Not MET.** Residual needing **C axis tick** bind.

## D5 G16 — mode-wheel shell (**PARTIAL**)

**Cite:** `SpectrumToolbar.tsx` `data-testid=mode-wheel`; Bot-B evidence.

| Check | Result |
|-------|--------|
| Shell: STFT/Waterfall + Wave/PSD desktop enum stamps | **landed** |
| `data-g16=partial` / `data-matrix=insufficient` (no empty invent) | **honest** |
| Chart host / mode **consumers** | **residual → C** |
| Demod / recognition modes | **BLOCKED** (G06/G17) — not invented |

**Not MET.** Residual **C G16 consumers**.

## Retained MET

| Item | Status |
|------|--------|
| A2 visibleBandwidthHz auto-N | **MET** |
| A3 dspAnalysisSamples strip stamp | **MET** |
| A5 spectral_settings_json open/save | **MET** |

## Soft fences / counts

| ID | Status |
|----|--------|
| G02 | **PARTIAL** — ⑥ Multitaper/Burg/**non-PoT**/**STFT-DDC** **BLOCKED** |
| G09 | **PARTIAL** (was OPEN) — B chrome; **C axis tick** residual |
| G16 | **PARTIAL** (was OPEN) — B shell; **C consumers** residual |
| G08 / G07 / G19 / G18 | **PARTIAL** (G18 written BLOCKED retained) |
| G06 / G17 | **BLOCKED** |

**Counts:** OPEN **5** · PARTIAL **18** · CLOSED **2** · DOCS **1** (G09/G16 OPEN→PARTIAL)  
**backticks:** **16** · `data-native-qfiledialog=false`

## Explicit

**matrix_pass_claimed: false** · **ui_parity_pass_claimed: false** · **pass_claimed: false**