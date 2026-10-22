# Bot-C — Aux Wave host uses opened iqFileSession (confirm)

| Field | Value |
|-------|-------|
| When | 2026-10-22 Asia/Shanghai |
| Base | `5f8c849` (merge bot-d Aux Wave opened-file chunked IQ) |
| Tip | docs-only confirm (this file) |
| Branch | `work/bot-c-charts` |
| Decision | **HOST_OK** |
| matrix_pass_claimed | **false** |
| Ban | invent DSP · fake PASS · silent demo paint |

## Ask (CAO)

After D lands `readAuxWaveRawIq` + `getIqFileSession` / `data-aux-wave-feed=needs_opened_iq`, C must confirm chart host already uses that API and does **not** keep defaulting to demo IQ.

## Verify on `5f8c849`

Grep / read `apps/web/src/components/AuxChartHost.tsx`:

1. Imports `readAuxWaveRawIq` from `../dsp/auxWaveRawIq` and `getIqFileSession` / `subscribeIqFileSession` from `../dsp/iqFileSession`.
2. Wave effect: if `!iqSession` → clear series and return (no fetch).
3. When session present: `readAuxWaveRawIq({ win, fullTime, signal, allowDemoFallback: false })` — demo path explicitly off.
4. No-session render stamps `data-aux-wave-feed="needs_opened_iq"` / `data-aux-wave-source="none"` / waiting chrome (open WAV/RAW/SigMF or load demo).
5. Session present: stamps `data-aux-wave-feed="opened_iq_session"` (loading/error) or `waveSeries.feed` when painted.

`apps/web/src/dsp/auxWaveRawIq.ts`: prefers `getIqFileSession()`; `allowDemoFallback` / `demoDir` only for vitest / explicit callers — not AuxChartHost.

## Behavior

| State | Host |
|-------|------|
| No iqFileSession | Waiting panel; `needs_opened_iq`; **no** Wave paint; **no** silent `sigmf_data_demo` |
| Opened session (WAV/RAW/SigMF/demo via Main open) | `readAuxWaveRawIq` with `allowDemoFallback: false`; IqRms from same ChunkedReader as Main STFT |

## Gap?

**None.** D tip `5e7eb26` already rewired AuxChartHost; C confirms no further host fix.

## Claims

| Claim | Value |
|-------|-------|
| matrix_pass_claimed | false |
| ui_parity_pass_claimed | false |
| Screenshots invented | false |
| DSP invented | false |