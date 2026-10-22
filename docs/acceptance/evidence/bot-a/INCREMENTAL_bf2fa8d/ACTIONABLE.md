# ACTIONABLE update @ `bf2fa8d` (supersedes 555d001 board)

## Status board

| # | ID | Now @ `bf2fa8d` | Owner |
|---|----|-------------------|-------|
| A2 (auto + fixed SegmentMs) | **MET** | C (done) |
| A3 / A5 / A1 / A6… | **MET / LANDED** | — |
| **D4 G09** | **PARTIAL** (B chrome + **C axis-bind**) | residual optional: pixel/screenshot parity vs rebuild — **C/B** low priority; **not** MET claim |
| **D5 G16** | **PARTIAL** (B **live** mode-wheel) | **C G16 consumers: movable / done** (MainChartHost + AuxChartHost store). Remaining: enable/disable **matrix** when desktop docs exist — **B+C**; **no invent** |
| ⑥ non-PoT/STFT-DDC | **D BLOCKED** | D |
| G18 written | **BLOCKED** | — |
| G06 / G17 | **BLOCKED** | — |
| G02 Multitaper/Burg | **BLOCKED** | — |

## Next priority (owners)

1. **B+C — G16 matrix (when desktop available):** fill enable/disable matrix from `17471a6`; until then keep `data-matrix=insufficient`. **C consumers no longer the blocker.**
2. **C/B optional — G09 screenshot parity:** only if CAO wants MET push; functional bind already landed.
3. **Do not schedule invent:** ⑥ **D** non-PoT/STFT-DDC; G18 written BLOCKED; G06/G17; G02 Multitaper/Burg.

**matrix_pass_claimed: false**