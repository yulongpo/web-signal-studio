# Bot-C G18 PSD mode handoff (驻留帧谱 / 统计谱)

| Field | Value |
|-------|-------|
| Base | aeacc5f |
| matrix_pass_claimed | **false** |
| Desktop | 17471a6 `narrowband_workspace` / contextFramePsd |

## Decision

| Line | Owner | Status |
|------|-------|--------|
| Mode select UI->store | **Bot-C** | MET (`nb-select-psd-mode` -> `narrowbandPsdMode`) |
| Mode label display-summary | **Bot-C** | MET (`data-psd-mode`) |
| Charts pass mode into DDC | **Bot-D** | MET on main (`08b424e` / `aeacc5f`) |
| Frame / statistical series | **Bot-D** | MET series API; C consumes |
| Pinned dwell contextFramePsd | **Bot-D** | Residual |

Field name contract: `uiStore.narrowbandPsdMode` (`frame` | `statistical`) ? confirmed with Bot-D.

**No PASS.**
