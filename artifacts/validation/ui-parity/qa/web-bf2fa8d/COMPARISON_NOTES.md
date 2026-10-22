# Bot-G web-bf2fa8d vs desktop 17471a6 (NOT PASS)

- HEAD/sync: bf2fa8decbe4bcd2e8f1224e87d2831f2c408cf3
- Tip: D5 mode-wheel live DOM + D4 physical-view + A2 SegmentMs BW
- Desktop: 17471a6488383b456281d12cb1a6d3d80290205d
- matrix_pass_claimed: false
- ui_parity_pass_claimed: false
- pass_claimed: false
- g06_g17_claimed: false

## Priority
- d5_mode_wheel: {"live_dom":true,"data_live_dom":"true","data_g16":"partial","data_g16_owner":"bot-b","data_g16_host":"chart-header-toolbar","data_matrix":"insufficient","data_no_invent":"true","desktop_main":"TimeFrequency|Waterfall","desktop_aux":"Waveform|Psd","stft":true,"waterfall":true,"aux_wave":true,"aux_psd":true,"header_g16_shell":"partial"}
- d4_physical_view: {"data_g09":"partial","data_g09_owner":"bot-b+c","data_axis_bind":"physical-view","bound_physical_view":true,"view_text":"| 视图 ΔT 33.536 ms · ΔF 1.000 MHz","delta_t":"0.033536","delta_f":"1000000","honesty":"axis bind: physical-view","honesty_bind":"physical-view","store_spans":{"timeSec":{"min":0,"max":0.033536},"freqHz":{"min":-500000,"max":500000},"chartMode":"stft"}}
- a2_segment_ms: {"data_auto_n":"off","select_options":["0.1","1","10","100"],"selected":"10","store":{"stftSegmentMsPref":10,"stftAutoNbPref":false,"dspSegmentMs":10,"dspAutoNb":false,"dspAnalysisSamples":1024},"segment_text":"10 ms (pref) · settle 10.000 ms","auto_n_copy":"fixed SegmentMs → resolveAnalysisSamples PoT (bandwidth=fs)","note":"A2 residual: fixed SegmentMs uses visibleBandwidthHz (not fs-only) in MainChartHost"}
- g08_soft: {"g08":"wave23","wave":"wave23"}

## Gaps
- (none recorded)

## Skipped
- G06 eye/bitstream — BLOCKED; not invented
- G17 recognition — BLOCKED; not invented
- G16 enable/disable matrix — data-matrix insufficient; not invented

## Captures
- 01-d5-mode-wheel-live.png
- 01b-mode-wheel-crop.png
- 02-d4-physical-view-bind.png
- 02b-bottom-scale-crop.png
- 03-a2-segment-ms-overflow.png
- 03b-segment-ms-crop.png
- 04-g08-soft.png
- fold-web-555d001/* (12 files)

No PASS. No invented G06/G17. Prior web-555d001 mode-wheel mount-gap addressed if data-live-dom=true.