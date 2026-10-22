# ACTIONABLE update @ `555d001` (supersedes 2aea4cb board)

## Status board

| # | ID | Now @ `555d001` | Owner |
|---|----|-------------------|-------|
| A1 / A2 / A3 / A5 / A6 / B1… | **MET / LANDED** | — |
| ⑥ non-PoT/STFT-DDC | **D BLOCKED** | D (fence) |
| **D4 G09** | **PARTIAL** (B chrome landed) | **C** — axis tick / PlotWidget bind (`data-axis-bind=deferred-to-c`); Waterfall axis-swap copy |
| **D5 G16** | **PARTIAL** (B shell landed) | **C** — chart mode **consumers**; wait desktop enable/disable matrix (`data-matrix=insufficient`); no invent |
| G18 written | **BLOCKED** retained | — |
| G06 / G17 | **BLOCKED** | — |
| G02 Multitaper/Burg | **BLOCKED** (fence) | — |

## Next priority (owners)

1. **C — D4 residual:** MainChartHost / PlotWidget **axis tick** bind to BottomScaleChrome view ΔT/ΔF; Waterfall axis-swap readout if needed.
2. **C — D5 residual:** G16 **chart consumers** for mode-wheel (`chartMode` / aux modes); do not invent Narrowband/Demod/recog matrices.
3. **B/C optional — SegmentMs BW:** when auto-N off, prefer `analysisBandwidthHz` over fs (A2 residual).
4. **Still BLOCKED (do not schedule invent):**
   - ⑥ **D** non-PoT / STFT-DDC
   - G18 recognition STFT **written BLOCKED**
   - G06 / G17
   - G02 Multitaper / Burg / related soft fences

**matrix_pass_claimed: false**