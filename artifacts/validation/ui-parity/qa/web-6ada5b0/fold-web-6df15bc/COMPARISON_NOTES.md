# Bot-G web-6df15bc vs desktop 17471a6 (NOT PASS)

- HEAD/sync: 6df15bcae8fe32d93213e91acb83a12a578e708f
- Impl B wave12 pin z-index: 7d1a6ed
- Impl C G11 unselected polish: 58df6bf
- Impl A audit 130d078: 130d078
- Desktop: 17471a6488383b456281d12cb1a6d3d80290205d
- ui_parity_pass_claimed: false

## Priority
- wave12 pin hit: {"ok":true,"tag":"button","testid":"rail-dwell-pin-btn"}
- wave12 pin live (no force): true
- g11 polish: {"polish":true,"hoverTip":false,"unselectedAttr":false}
- A 130d078: audit INCREMENTAL_4c28588 B wave11 G19 editCell/export vs 17471a6

## Captures
- 01-wave12-rail-pin-chrome.png
- 01b-wave12-rail-pin-crop.png
- 02-wave12-dwell-pin-live.png
- 02b-wave12-display-summary-pinned.png
- 03-g11-mark-layer-polish.png
- 04-rail-dwell-scrubber.png
- fold-web-56233d2/* (10 files)

## Gaps
- G11: no unselected mark rect present without IQ; polish attr + CSS wiring captured
- Overlay / G18 STFT chart scrubber / PSD series curve: soft-deferred (avoid IQ hang)

No PASS claimed.