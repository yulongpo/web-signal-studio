# Bot-C G18 PSD mode handoff (驻留帧谱 / 统计谱)

| Field | Value |
|-------|-------|
| Base | 98d858d |
| matrix_pass_claimed | **false** |
| Desktop | 17471a6 `narrowband_workspace` / `plot_widget` contextFramePsd |

## Decision

| Line | Owner | Status |
|------|-------|--------|
| Mode label in display-summary | **Bot-C** | Landed this tip (`narrowbandPsdMode`) |
| Mode select in NB toolbar | **Bot-C** | Landed (`nb-select-psd-mode`) |
| Frame / statistical PSD **curve data** | **Bot-D** | Not started ? observe charts still one PSD path |
| Pinned STFT-frame dwell PSD | **Bot-D** (+ charts paint when series exists) | Desktop needs pinned cursor |

## Ask Bot-D

1. Expose PSD series for `frame` (dwell / pinned STFT frame bins) vs `statistical` (independent PSD N).
2. Honor `uiStore.narrowbandPsdMode` (or shared contract) when computing narrowband observe PSD.
3. Until then, UI slot shows honest labels but series is unchanged.

**No PASS.**
