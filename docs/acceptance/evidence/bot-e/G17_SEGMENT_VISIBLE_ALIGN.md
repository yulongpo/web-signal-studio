# G17 residual: active-segment list / visible-region align

- **base**: `98d858d10a1e70995039b20307538d14c70df6df` (origin/main = INCREMENTAL_f5171fc audit)
- **branch**: `work/bot-e-g17-segment-visible`
- **scope**: DetectionCard active-segment real list + visible ? navWindow align
- **recognition**: still **BLOCKED** (honest; no fake labels)
- **matrix_pass_claimed**: false
- **PASS**: not claimed

## Landed
- `listActiveMarkSegments()` from `window.__wssM06` (active mark segments, or compat start/end; empty = honest empty option, no invented rows)
- `detectionActiveSegment` select enabled when real segments exist; applies sample range on change
- `visible` rangeOrigin syncs `navWindowTime` ? sample indexes via `secondsToSampleIndex` + Fs
- `available-file` uses IQ `reader.availablePrefix().availableSamples` (no invented length)

## Still out of scope / BLOCKED
- Recognition remains BLOCKED
- No self PASS

## Prior MET retained
- AdaptiveValueEdit / Fs notes / rangeOrigin+ROI chrome (72f208c lineage on main)
