# Bot-C short tip — dwell-only NB PSD freq + scrubber sync (no PASS)

| Field | Value |
|-------|-------|
| Asia/Shanghai | 2026-10-22 01:37 |
| Base tip | 1f52465 |
| Branch | work/bot-c-charts |
| Desktop ref | 17471a6 pinCursor / updateLinkedCursors |
| Self-check | ChartMarkOverlay untouched; HeatmapCanvas backticks=30 |
| matrix_pass_claimed | false |

## Landed

| ID | Landed | Note |
|----|--------|------|
| G18 dwell-only historic freq | resolveNbPsdLinkedFreqHz | peak→xDomain else band center; stamp data-g18-nb-psd-freq-source |
| STFT scrubber → linkedCursor | pinLinkedCursor on scrub | preserve freq or band center; selectedFrame+timeSec |
| G11 PlotWidget | none | no clear C-owned evidence-backed gap this tip |
| typecheck | clean | 2 B-merge NB/Esc errors not reproduced |

## Deferred / gaps

| Item | Status |
|------|--------|
| Full desktop multi-view polish beyond PSD vline | still PARTIAL at matrix; not CLOSED |
| Dedicated NB pin-frequency D field | not needed — reuse linkedCursor + derive |
| rail-dwell-scrubber twin | Bot-B — untouched |
| G11 residual paint nuances | still PARTIAL at matrix; nothing concrete for C |

## Owner split

| Item | Owner |
|------|-------|
| NB PSD freq chrome / dwell-only recovery | **Bot-C** (this tip) |
| DSP series / new pin store fields | **Bot-D** (no new field) |
| Right-rail scrubber | **Bot-B** (untouched) |

## Evidence

- apps/web/src/components/nbPsdFreqFromDwell.ts
- apps/web/src/components/nbPsdFreqFromDwell.test.ts
- apps/web/src/components/NarrowbandObserveCharts.tsx

**matrix_pass_claimed: false. No PASS.**
