# Bot-D G18 wave7 — pinned dwell / contextFramePsd

| Field | Value |
|-------|-------|
| Base | `5a0b035` |
| Branch | `work/bot-d-dsp` |
| matrix_pass_claimed | **false** |
| Desktop ref | `17471a6` `LinkedCursorState.pinned` + `framePsd` / `contextFramePsd` |

## What landed (DSP / store contract)

| Line | Owner | Status |
|------|-------|--------|
| `uiStore.narrowbandPinnedDwellIndex` (`number \| null`) | **Bot-D** | MET — null = unpinned → last STFT frame |
| Charts → DDC `psdFrameIndex` (frame mode only) | **Bot-D** | MET — statistical ignores pin |
| Result `psdFrameIndexUsed` / `psdFrameCount` + data attrs | **Bot-D** | MET |
| Frame / statistical series + psdMode wiring | **Bot-D** (prior) | Already on main |

## Still chrome-owned (not invented here)

| Line | Owner | Notes |
|------|-------|-------|
| STFT click-to-pin / clear pin | **Bot-B / Bot-C** | Desktop `pinCursor` + linked cursor |
| Context menu `contextFramePsd` enable-only-when-pinned | **Bot-B / Bot-C** | Desktop `setFramePsd` requires `pinned` |
| Pin scrubber / dwell chrome in right-rail | **Bot-B / Bot-C** | Can call `setNarrowbandPinnedDwellIndex` |

Contract for chrome: set `narrowbandPinnedDwellIndex` then ensure PSD mode is `frame` (existing `setNarrowbandPsdMode('frame')`). Statistical mode must not show pinned frame series (D already ignores pin).

## G06 eye / bitstream

Still honest **BLOCKED** (`EYE_TIMING_SYNC_MISSING` / `BITSTREAM_DEMOD_MISSING`). Untouched this tip.

## Tests

- `apps/web/src/dsp/narrowbandObserveDdc.test.ts` — pinned index selects distinct frames; statistical ignores pin
- `apps/web/src/store/uiStore.narrowbandPinnedDwell.test.ts` — store setter contract

**No PASS.**
