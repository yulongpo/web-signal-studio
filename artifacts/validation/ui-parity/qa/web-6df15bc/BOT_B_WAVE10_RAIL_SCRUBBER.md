# BOT_B_WAVE10 — right-rail dwell scrubber chrome (no PASS)

| Field | Value |
|-------|-------|
| Branch | `work/bot-b-ui` |
| Base | `a48481d46262ac8cc8b830dc172928cc36c18cf5` (`origin/main` = C `7bfc86c` STFT margin-map/scrubber) |
| Desktop | `17471a6` LinkedCursor / framePsd |
| matrix_pass_claimed | **false** |

## Delivered

- **G18 rail scrubber twin:** Right-rail DisplayPage `data-testid="rail-dwell-scrubber"` range control.
- Drives existing store only: `setNarrowbandPinnedDwellIndex(idx)` + `setNarrowbandPsdMode('frame')` (same contract as B pin chrome + C chart scrubber).
- Frame max read from chart DOM (`nb-stft-pin-host` `data-frame-count` / PSD `data-nb-psd-frame-count`) — **no DSP / no chart scrubber duplication**.
- Idle (no frame count yet): scrubber disabled; readout honest `—`.
- Prior pin/clear number input retained.

## Not done / deferred

- Chart-side `nb-stft-dwell-scrubber` remains Bot-C (untouched).
- Plot-margin exact sample map remains C.
- G07 engines not invented; matrix PASS not claimed.

## Checks

- typecheck green
