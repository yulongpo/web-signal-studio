# Bot-G web-5c569c2 vs desktop 17471a6 (NOT PASS)

- HEAD/sync: 5c569c24ef6208e28d137829a9a16fe60fe09c17
- Impl C NB PSD freq vline: 0a604d1
- Impl B wave19 G02 strip DSP: f7a4b13
- Desktop: 17471a6488383b456281d12cb1a6d3d80290205d
- ui_parity_pass_claimed: false
- g06_g17_claimed: false

## Priority
- g02: {"strip_dsp":"wave19","strip_wave":"wave11 wave14 wave19","has_wave19":true,"dsp_source":"loading","fft_active":"js","detect_feed_count":"0","detect_feed_empty":"true","window_partial":"true","overlap_reason":"no-overlap-in-store"}
- nb_psd_vline: {"store_pin":{"pinned":false,"timeSec":0,"frequencyHz":0,"selectedFrame":null},"vline_attr":"true","linked_attr":"true","after_esc":{"linkedPinned":false,"dwell":null,"psdMode":"statistical"}}
- esc_clear_wb: {"cleared":true}
- rail_twin: {"pinned":true,"readout":"联动光标 · t=0.420000s · f=12.500000 MHz · frame #2","twin_wave":"wave17"}

## Captures
- 01-g02-strip-dsp-wave19.png
- 01b-g02-strip-dsp-crop.png
- 02-rail-twin-regression-pinned.png
- 02b-esc-clear-wb-regression.png
- 03-nb-psd-freq-vline-pinned.png
- 03b-nb-psd-panel-vline-crop.png
- 03c-nb-psd-vline-esc-cleared.png
- fold-web-14cc45f/* (17 files)

## Gaps
- nb-chart-psd not mounted (DDC/IQ wait); panel data-g18-nb-psd-freq-vline stamp proven without hang

No PASS claimed. No G06/G17 invention.