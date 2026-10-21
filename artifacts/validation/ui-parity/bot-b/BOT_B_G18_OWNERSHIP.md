# BOT_B G18 — PSD/STFT right-rail ownership

| Field | Value |
|-------|-------|
| Base | `1dbf67316bca088b1aefea4b948953a04391eb75` |
| matrix_pass_claimed | **false** |

## Conclusion

| Line | Owner | Action this tip |
|------|-------|-----------------|
| STFT N · palette | **Bot-B shell** (`uiStore`) | Implemented in `display-summary` |
| 参考 / 动态 | **Bot-B shell** (level) | Already present; kept |
| PSD N (FFT size) | **Bot-B shell** display of `narrowbandPsdFft` | Show number only |
| PSD mode 驻留帧谱/统计谱 | **Bot-C / Bot-D** | Not implemented; slot `—` |

Not chart paint, not DSP — shell chrome only where state already lives in uiStore.
