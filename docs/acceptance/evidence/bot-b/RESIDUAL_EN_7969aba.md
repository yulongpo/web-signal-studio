# RESIDUAL_EN_7969aba — Bot-B shell residual EN cleanup (no PASS)

| Field | Value |
| --- | --- |
| When | 2026-10-22 Asia/Shanghai |
| Base | **7969aba** = 7969aba (origin/main = QUALITY_DEMO_TREE merge incl. 64d657d) |
| Branch | work/bot-b-ui |
| Desktop | **17471a6** D:\\project\\signal_studio_rebuild (pp/main_window.cpp modeMain/modeAux/workspaceMode/detectionRoiTool) |
| Status | PARTIAL — user-visible shell chrome EN cleared where desktop has CN; no PASS |

## Scope done (PARTIAL honesty)

Aligned user-visible chrome labels to desktop CN (no new visual language):

### SpectrumToolbar
- Workspace toggle: **Wideband/Narrowband** → **宽带/窄带**
- Mode wheel: **STFT/Waterfall/Wave/PSD** → **时频图/瀑布图/时域波形/功率谱(PSD)** (desktop modeMain/modeAux)
- **Load demo IQ** → **加载演示 IQ**; **Level/Display** → **电平/显示**; **More …** → **更多…**
- Overflow: **Palette** → **色板**; **ROI/Mark** → **检测 ROI/标记**
- Kept: STFT N, brand, Latin accel, data-* honesty stamps, G16 EN titles (not primary chrome)

### ChartParamStrip (live host)
- Aux + live mode wheel same CN as above
- **Detection ROI** → **检测 ROI** (desktop ▨ 检测 ROI)
- Mode readout: STFT/Waterfall → 时频图/瀑布图; aux qlabel PSD → 功率谱
- Overflow summary **STFT / Waterfall** → **时频图 / 瀑布图**; SegmentMs/Detect feed/on/off → 段长(ms)/检测馈送/开/关
- **More** overflow → **更多…**

### MenuBar
- View **STFT/Waterfall** → **时频图/瀑布图**
- View-history empty title EN → **没有更早的视图历史**
- Already CN: 宽带工作区 / 窄带工作区 / 加载宽带演示 IQ

### RightRail / TempLayers / NarrowbandWorkspace
- RightRail **打开 Level层** → **打开电平层**
- TempLayers dialog chrome: 电平/显示/自动适配电平/频率模式/射频频率/基带频率/显示网格/色标/应用（Enter）
- NB: PSD FFT→PSD N; contextFramePsd→驻留帧谱; RF→射频; drop English (overflow) suffix on STFT N/频率

## Intentional EN kept
- Brand **Signal Studio**; Latin shortcuts (Esc/Enter/Del/Alt+Left); tech tokens desktop also keeps (**STFT N**, **PSD N**, **ROI**, **FFT**, **dB**, **Hz**)
- data-testid / data-desktop-* / G16 honesty 	itle/ria-label meta (not primary chrome)
- Filename sample nodes (demo_wideband.iq etc.)

## Fence
- Not touched: G06 eye/bitstream invent, G17 recognition, Multitaper/Burg, G16 enable-matrix
- Preserved: demo→tree QUALITY path, F Add-signal wire, handleWidth=10, Observe-only NB product surface

## Self-check
1. Toolbar shows 宽带/窄带 (not Wideband/Narrowband)
2. Live strip mode wheel 时频图/瀑布图/时域波形/功率谱(PSD)
3. Temp layer headers 电平/显示
4. No ACCEPTANCE_MATRIX PASS flips; matrix_pass_claimed=false

## Deliver
- Tip: (fill after commit)
- Evidence: docs/acceptance/evidence/bot-b/RESIDUAL_EN_7969aba.md
- matrix_pass_claimed=false
