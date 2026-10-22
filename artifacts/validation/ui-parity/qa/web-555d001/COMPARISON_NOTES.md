# Bot-G web-555d001 vs desktop 17471a6 (NOT PASS)

- HEAD/sync: 555d00136e84b3f896076d325e7a4e9006c18202
- Tip: merge(bot-b) D4 G09 BottomScale + D5 G16 mode-wheel shell
- Desktop: 17471a6488383b456281d12cb1a6d3d80290205d
- matrix_pass_claimed: false
- ui_parity_pass_claimed: false
- pass_claimed: false
- g06_g17_claimed: false

## Priority
- d4_bottom_scale: {"testid":"bottom-scale-chrome","data_g09":"partial","data_g09_owner":"bot-b","data_axis_bind":"deferred-to-c","data_object_name":"viewData","chart_mode":"stft","view_text":"| 视图 ΔT 33.536 ms · ΔF 1.000 MHz","delta_t":"0.033536","delta_f":"1000000","cursor_text":"光标 T — · F —","honesty_text":"axis ticks → C","honesty_axis_bind":"deferred-to-c","bottom_panel_g09":"partial","status":"PARTIAL — chrome MET for B viewData/cursor; axis ticks deferred-to-c"}
- d5_mode_wheel: {"live_dom":false,"gap":"data-testid=mode-wheel not in live App DOM (SpectrumToolbar demoted; ChartParamStrip chart-header hosts STFT/Waterfall buttons without mode-wheel wrapper)","chart_header_legacy_testid":"spectrum-toolbar","data_g16_shell_count":0,"mode_buttons_in_header":{"stft":true,"waterfall":true,"aux_wave":true,"aux_psd":true,"stft_active":"true"},"source_file":"apps/web/src/components/SpectrumToolbar.tsx (contains mode-wheel + data-g16=partial + data-matrix=insufficient)","status":"PARTIAL / mount gap — B landed shell in SpectrumToolbar; live chrome is ChartParamStrip"}
- mode_toggle: {"after_waterfall_active":"true","scale_chart_mode":"waterfall"}
- g08_soft: {"g08":"wave23","wave":"wave23"}

## Gaps
- D5 mode-wheel wrapper not mounted in live App; mode buttons present on chart-header-toolbar without data-g16 wrapper

## Skipped
- G06 eye/bitstream — BLOCKED; not invented
- G17 recognition — BLOCKED; not invented
- G09 PlotWidget axis tick paint — deferred-to-C; not invented
- G16 enable/disable matrix — data-matrix=insufficient; not invented

## Captures
- 01-d4-bottom-scale-chrome.png
- 01b-bottom-scale-crop.png
- 02-d5-chart-header-modes-no-wheel-wrapper.png
- 02b-chart-header-crop.png
- 03-mode-waterfall-toggle.png
- 04-g08-soft.png
- fold-web-b7cab97/* (14 files)

No PASS. No invented G06/G17. D4/D5 remain PARTIAL per B.