# Bot-D · GAP_QUALITY_7f7aead Q7-07 / Q7-10 / Q7-11 (data-path)

| Field | Value |
|-------|-------|
| When | 2026-10-22 Asia/Shanghai |
| Base | 27e3e29 (PIXEL B on main; rebase again if C STFT tip lands before push) |
| Tip | TBD |
| Branch | work/bot-d-dsp |
| matrix_pass_claimed | **false** |
| Ban | invent Multitaper/Burg/G06 eye · fake PASS · silent demo-annotation NB claim |

## Gaps addressed (D data path only)

| ID | Gap | D change |
|----|-----|----------|
| Q7-07 | Aux upper empty-flat | Keep opened-session 
eadAuxWaveRawIq; add linear RMS yDomain + peak; honest empty_iq_buffer when window/read is silent (no flat fake ready). Amplitude domain: linear ADC-count RMS (not dBFS). Scale chrome residual → C. |
| Q7-10 | NB Observe empty wave/PSD | Drive Observe only from **active broadband mark/channel**; mark RF now falls back to annotation **segments**; IQ prefers **opened Main iqFileSession** (same reader as Aux/Main), demo allowlist only as fallback. |
| Q7-11 | demo-annotation honesty residual | UI passes 
equireActiveDrive: true; without drive host shows 
eeds_active_mark and does **not** set ready / does not claim real-marker visual. 
eal-demo-annotation no longer paints as NB Observe ready. |

## Feed APIs (for C hang)

- Aux: 
eadAuxWaveRawIq ← getIqFileSession(); attrs data-aux-wave-feed = opened_iq_session | 
eeds_opened_iq | empty_iq_buffer; data-aux-amp-domain=linear-rms; data-aux-wave-peak.
- NB Observe: computeNarrowbandObserveDdc({ broadbandDrive, requireActiveDrive: true }) ← opened session reader + centerFrequencyHz when SigMF/demo published; host gates on 
eadBroadbandDriveFromM06 / 
esolveBroadbandDrive → 
eal-marker | 
eal-channel.
- Mark RF: markRfEdges / markRfCenterBandwidth (top-level or active/first segment).

## Files

- pps/web/src/dsp/iqFileSession.ts — optional centerFrequencyHz
- pps/web/src/dsp/openIqForMainChart.ts — publish center from SigMF/demo
- pps/web/src/dsp/auxWaveRawIq.ts + test — yDomain / peak / empty_iq_buffer
- pps/web/src/components/AuxChartHost.tsx — empty buffer honesty + yDomain
- pps/web/src/dsp/narrowbandObserveMarkerDdc.ts + test — segment RF
- pps/web/src/dsp/narrowbandObserveDdc.ts + test — session IQ + requireActiveDrive
- pps/web/src/components/NarrowbandObserveCharts.tsx — gate + ready only real-marker/channel

## Verify

`
cd apps/web
npx vitest run src/dsp/auxWaveRawIq.test.ts src/dsp/narrowbandObserveMarkerDdc.test.ts src/dsp/narrowbandObserveDdc.test.ts
`

Expect: 29 passed (matrix_pass_claimed false).

## Residual for B/C

- **B**: 4K viewport / splitter / fonts / zh chrome (Q7-01..05) — not D.
- **C**: Aux/NB chart **paint + heights** (scale, STFT mode distinctness Q7-06/08/09); hang on attrs above when drive ready. D does not invent C canvas chrome.
- **G shot 06**: if session/DDC API hung but UI missing, leave chrome to B/C — no Multitaper/Burg/G06 invention.

## Claims

| Claim | Value |
|-------|-------|
| matrix_pass_claimed | false |
| ui_parity_pass_claimed | false |
| Screenshots invented | false |
