# Bot-G web-91ae551 vs desktop 17471a6 (NOT PASS)

- HEAD/sync: 91ae5511d1e3668fd0b1a90c55de0b4ef10634e9
- Impl B wave5: 91ae551
- Impl D G18 PSD series: 0b6a113 (via 1c7643d ancestry)
- adaptiveValue fix: 1c7643d
- Desktop: 17471a6488383b456281d12cb1a6d3d80290205d
- ui_parity_pass_claimed: false

## Priority
- G19 column matrix: qt-full / rail qt-full
- G07 live Detect: feed=local-compute
- G02 chrome: mode/workspace + overflow qlabels
- G08 collapse: bottom min + left min=8
- G18 PSD: {"error":"Error: \u001b[2mexpect(\u001b[22m\u001b[31mlocator\u001b[39m\u001b[2m).\u001b[22mtoHaveAttribute\u001b[2m(\u001b[22m\u001b[32mexpected\u001b[39m\u001b[2m)\u001b[22m failed\n\nLocator:  getByTestId('nb-panel-psd')\nExpected: \u001b[32m\"frame-stft\"\u001b[39m\nReceived: \u001b[31m\"welch-statistical\"\u001b[39m\nTimeout:  20000ms\n\nCall log:\n\u001b[2m  - Expect \"toHaveAttribute\" getByTestId('n"}

## Captures
- 01-g19-column-matrix-bottom.png
- 01b-g19-column-matrix-header-crop.png
- 01c-g19-column-matrix-rail.png
- 01d-g19-rail-header-crop.png
- 02-g07-live-detect-feed.png
- 02b-g07-detect-run-list-crop.png
- 03-g02-chrome-overflow.png
- 03b-g02-overflow-qlabel-crop.png
- 04-g08-bottom-expanded.png
- 04b-g08-bottom-collapsed-min.png
- 04c-g08-bottom-collapsed-crop.png
- 04d-g08-left-collapsed-min.png
- 05-g18-psd-statistical.png
- 05b-g18-psd-statistical-panel.png

## Gaps
- G18 PSD capture incomplete: Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoHaveAttribute[2m([22m[32mexpected[39m[2m)[22m failed

Locator:  getByTestId('nb-panel-psd')
Expected: [32m"frame-stft"[39m
Received: [31m"

No PASS claimed.