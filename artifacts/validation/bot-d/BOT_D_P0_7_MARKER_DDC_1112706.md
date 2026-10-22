# BOT_D P0#7 marker/channel → Observe DDC

- base: `1112706aa496273db54cc60c065e8eb921647b7f`
- branch: `work/bot-d-dsp`
- matrix_pass_claimed: false
- IQ source: `sigmf_data_demo` only

## What landed

1. `apps/web/src/dsp/narrowbandObserveMarkerDdc.ts` — pure resolve of broadband active channel/mark → LO/BW/rate/window (desktop formulas).
2. `apps/web/src/dsp/narrowbandObserveDdc.ts` — accepts `broadbandDrive`; recomputes desktop out-rate with real capture Fs; returns `ddcStatusStamp` / `ddcKindAttr`.
3. `apps/web/src/components/NarrowbandObserveCharts.tsx` — polls `__wssM06` selection; passes drive into compute; exposes `data-nb-ddc-kind` / `data-nb-ddc-status`.
4. Unit tests: `narrowbandObserveMarkerDdc.test.ts`.

## How to verify

```bat
cd D:\project\wss-wt-d\apps\web
pnpm exec vitest run src/dsp/narrowbandObserveMarkerDdc.test.ts
```

Manual UI:
1. Open web app, load/use sigmf_data_demo broadband view.
2. Draw/select a mark with finite lowerHz/upperHz (or activate a channel).
3. Switch to Narrowband Observe.
4. Expect status/caption containing `真实 DDC` and `data-nb-ddc-kind` = `real-marker` or `real-channel`.
5. With no active mark/channel: `real-demo-annotation` (still honest real DDC, not fake IQ).

## Non-goals (honest BLOCKED / not invented)

- Cascaded ×2 FirDecimator stages (desktop `sourceDecimationStages`) — not invented; single-stage rational only.
- Bluestein / non-PoT FFT, Multitaper, Burg — banned for this tip.