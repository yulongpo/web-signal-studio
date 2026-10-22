# Bot-G web-b7cab97 vs desktop 17471a6 (NOT PASS)

- HEAD/sync: b7cab97c18922d02570bba2ecc9f43d95047d760
- Tip: merge(bot-b) A5 spectral_settings_json open/save (includes A2 ancestry)
- Desktop: 17471a6488383b456281d12cb1a6d3d80290205d
- matrix_pass_claimed: false
- ui_parity_pass_claimed: false
- pass_claimed: false
- g06_g17_claimed: false

## Priority
- a2: {"full_stft":10000000,"zoomed_stft":200000,"waterfall":2000000,"fallback_bad":2000000}
- a2_host: {"testid":"main-chart-host","chart_mode":"stft","dsp_source":"synthetic-stft-worker","note":"analysisBandwidthHz host state; seed/onViewCommit; no dedicated B bandwidth chrome"}
- a5: {"openApplied":{"ok":true,"stftWindowPref":"hamming","stftOverlapPref":0.5,"stftSegmentMsPref":10,"stftKaiserBetaPref":8.6,"stftRemoveMeanPref":true,"stftAutoNbPref":false,"stftN":2048},"saveOk":true,"reopenOk":true,"afterReopen":{"stftWindowPref":"kaiser","stftOverlapPref":0.9,"stftSegmentMsPref":100,"stftKaiserBetaPref":12,"stftRemoveMeanPref":true,"stftAutoNbPref":false,"stftN":4096},"spectral_settings_json":{"window":"kaiser","overlap":0.9,"segmentMilliseconds":100,"kaiserBeta":12,"removeMean":true,"autoNb":false},"prefsFromFile":{"stftWindowPref":"kaiser","stftOverlapPref":0.9,"stftSegmentMsPref":100,"stftKaiserBetaPref":12,"stftAutoNbPref":false,"stftRemoveMeanPref":true,"stftN":4096}}
- strip_baseline: {"strip_wave":"wave11 wave14 wave19 wave21 wave22 wave25 wave26 wave29 wave33 a3","strip_dsp":"wave19 wave21 wave25 wave26 wave29 wave33 a3","stft_segment_ms_stamp":"wave33","strip_a3_stamp":"a3","method":"welch","segment_ms":"1","auto_nb":"false","remove_mean":"false","analysis_samples_present":true,"analysis_samples":"1024","analysis_samples_text":"1024","fft_size_active":"1024"}
- overflow_shell: {"data_auto_n":"off","window_select":"kaiser","segment_select":"100","remove_mean":true,"blocked":{"periodogram":"true","bartlett":"true","multitaper":"true","burg":"true"},"kaiser_enabled":"true","strip":{"strip_wave":"wave11 wave14 wave19 wave21 wave22 wave25 wave26 wave29 wave33 a3","strip_dsp":"wave19 wave21 wave25 wave26 wave29 wave33 a3","stft_segment_ms_stamp":"wave33","strip_a3_stamp":"a3","method":"","segment_ms":"","auto_nb":"","remove_mean":"","analysis_samples_present":true,"analysis_samples":"","analysis_samples_text":"—","fft_size_active":""}}
- auto_n_on: {"data_auto_n":"on","strip":{"strip_wave":"wave11 wave14 wave19 wave21 wave22 wave25 wave26 wave29 wave33 a3","strip_dsp":"wave19 wave21 wave25 wave26 wave29 wave33 a3","stft_segment_ms_stamp":"wave33","strip_a3_stamp":"a3","method":"welch","segment_ms":"0","auto_nb":"true","remove_mean":"true","analysis_samples_present":true,"analysis_samples":"4096","analysis_samples_text":"4096","fft_size_active":"4096"},"settled_naturally":true}
- g08_soft: {"g08":"wave23","wave":"wave23"}

## Skipped
- G06 eye/bitstream — BLOCKED; not invented
- G17 recognition — BLOCKED; not invented
- G09 main-plot-footer — no design; not invented
- A2 dedicated bandwidth chrome — none by design

## Captures
- 01-spectral-shell-wave33.png
- 02-a2-main-chart-host.png
- 03-a5-prefs-after-reopen-strip.png
- 04-overflow-shell-after-a5.png
- 04b-overflow-crop.png
- 05-auto-n-on-a2-path.png
- 06-g08-soft.png
- fold-web-4db4208/* (15 files)

No PASS. No invented G06/G17. Retarget from web-2aea4cb onto tip b7cab97.