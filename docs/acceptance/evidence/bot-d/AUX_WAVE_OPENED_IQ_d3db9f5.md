# Bot-D · Aux Wave opened-file chunked IQ

| Field | Value |
|-------|-------|
| When | 2026-10-22 Asia/Shanghai |
| Base | `9799e20` (rebased; work started from d3db9f5 / C colorbar) |
| Tip | `5e7eb26` |
| Branch | `work/bot-d-dsp` |
| matrix_pass_claimed | **false** |
| Ban | invent DSP · fake PASS · silent demo-vs-main mismatch |

## Problem (from C tip BROADBAND_STFT_COLORBAR_AXES)

Aux Wave was hardwired to `sigmf_data_demo` via `/@fs`, so Main STFT on an opened WAV/FSA/demo session could show energy while Aux Wave looked empty or showed a different file. C documented honest empty + `data-aux-wave-feed=sigmf_data_demo_only` and waited on D.

## Fix

1. `readAuxWaveRawIq` prefers `getIqFileSession()` (same `ChunkedReader` Main STFT uses).
2. Without a session, host shows `data-aux-wave-feed=needs_opened_iq` (no silent demo paint).
3. Demo path remains behind `allowDemoFallback` / `demoDir` for vitest + NB helpers that still call `ensureDemoSigmfReader`.
4. Series carries `feed` / `format` / `via` / `fileName` for chrome attrs.

## Files

- `apps/web/src/dsp/auxWaveRawIq.ts`
- `apps/web/src/dsp/auxWaveRawIq.test.ts`
- `apps/web/src/components/AuxChartHost.tsx`
- this evidence + artifacts mirror

## Verify

```
npx vitest run apps/web/src/dsp/auxWaveRawIq.test.ts
```

Expect: iqRmsOverview + window mapping + opened-session suite green; demo suite runs when `sigmf_data_demo` is on disk (else skipped).

## Claims

| Claim | Value |
|-------|-------|
| matrix_pass_claimed | false |
| ui_parity_pass_claimed | false |
| Screenshots invented | false |
