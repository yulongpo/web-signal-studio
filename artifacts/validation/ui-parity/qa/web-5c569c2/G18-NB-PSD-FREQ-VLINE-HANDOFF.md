# Bot-C — NB PSD frequency vertical line (no PASS)

| Field | Value |
|-------|-------|
| Asia/Shanghai | 2026-10-22 01:25 |
| Base | 088f322 |
| Branch | work/bot-c-charts |
| matrix_pass_claimed | **false** |

## Behavior

1. **NB PSD** `WaveformChart` gets `linkedX={linkedCursor.frequencyHz}` when pinned (orange vertical line; same paint path as Aux PSD).
2. **STFT click** still pins dwell/frame PSD mode; additionally maps Y→freq via `cssToTimeFreq` and `pinLinkedCursor({ source:'main', timeSec, frequencyHz, selectedFrame })` so the PSD vline appears without a new store field from D.
3. **PSD click** `onPinX` → `pinLinkedCursor({ source:'psd', frequencyHz })`.
4. **Esc / clear** in narrowband now also clears `linkedCursor` so the freq vline disappears with the dwell pin.

## Gap for D (non-blocking)

No new store field required for chrome. If DSP later needs a dedicated `narrowbandPinnedFrequencyHz` for series math, D owns that; C will consume it. Until then chrome uses existing `linkedCursor.frequencyHz`.

## G11

No clear evidence-backed PlotWidget leftover landed this tip (sourceKind/hover already MET).

**No PASS.**
