# ACTIONABLE update @ `0f1183a` (from `INCREMENTAL_113f6b8_ACTIONABLE`)

Cross-link prior: `artifacts/validation/ui-parity/INCREMENTAL_113f6b8_ACTIONABLE/ACTIONABLE.md`

## Status board

| # | ID | Owner | Prior @ ab82146 | Now @ `0f1183a` |
|---|----|-------|-----------------|-------------------|
| ① | A1 SegmentMs | B | B no tip | **LANDED** wave33 |
| ② | A2 visible BW | C/B | B no tip | **LANDED** C auto-N MET |
| ③ | B1 Ctrl+A | B | B no tip | **LANDED** wave33 |
| — | A3 dspAnalysisSamples | D | checklist | **D publish LANDED**; **B strip stamp OPEN** |
| — | A4 NA_PSD_ONLY | B | checklist | reinforced |
| ⑤ | A5 spectral_settings_json | F/B | waiting B | **F schema MET / B persist OPEN** |
| — | A6 validation tooltips | B | checklist | **LANDED** |
| ⑥ | non-PoT / STFT-DDC | D | D BLOCKED | **still D BLOCKED** |
| — | B3/B4/C1/C2/D2 | B | checklist | **LANDED** wave33 |
| — | D3 G11 | C | checklist | no tip (MET evidence) |
| — | D4 G09 / D5 G16 | C/B | OPEN | **still OPEN** (design / mode-matrix) |

## Next priority (remaining landable)

1. **B — A5 persist wire:** call `applySpectralChromePrefsToProject` / `readSpectralChromePrefsFromFile` from MenuBar save/open project JSON paths (`apps/web/src/projectIo` already re-exports).
2. **B — A3 strip stamp:** show `dspAnalysisSamples` on SpecParamStrip (D publish ready).
3. **B/C optional — A2 fixed-SegmentMs BW:** use `analysisBandwidthHz` on non-auto resolve too (today fs).
4. **B/C — D4 G09** bottom scale stub after desktop design note.
5. **B/C — D5 G16** mode-wheel enable rules after desktop mode matrix.
6. **Do not** schedule Multitaper/Burg/non-PoT/STFT-DDC / G06 / G17 invent.

## Fence

G02 stays **PARTIAL**. **matrix_pass_claimed: false**.