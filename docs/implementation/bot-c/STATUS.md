# Bot-C G18 UI->store narrowbandPsdMode STATUS (WIP - do not self-claim PASS)

| Field | Value |
|-------|-------|
| Asia/Shanghai | 2026-10-22 00:11 |
| Base tip | aeacc5f |
| Branch | work/bot-c-charts |
| Scope | **G18** UI->store proof + STATUS; Charts->DDC already on main via Bot-D `08b424e` |
| Out of scope | Overlay repair (Bot-B `85dab15`); new DSP; pinned dwell |
| Desktop ref | 17471a6 narrowband_workspace / contextFramePsd |
| Self-check | ChartMarkOverlay backticks=10 (matches 85dab15); no overlay commit |

## Landed (honest)

| ID | Landed | Known gap / note |
|----|--------|------------------|
| G18 UI->store | `nb-select-psd-mode` -> `setNarrowbandPsdMode` / `narrowbandPsdMode`; RightRail `data-psd-mode` | Unit proves setter updates store |
| G18 store->DDC | On main via Bot-D `08b424e` / merge `aeacc5f` (`psdMode` kwarg in ObserveCharts) | C does not re-touch call site |
| G18 DSP series | Bot-D | Pinned dwell / contextFramePsd residual remains D |
| G11 Overlay | Bot-B restored templates on `85dab15` | C self-check only; no overlay commit |

## Evidence
- apps/web/src/components/NarrowbandWorkspace.tsx (`nb-select-psd-mode`)
- apps/web/src/store/uiStore.ts (`narrowbandPsdMode`)
- apps/web/src/store/uiStore.narrowbandPsdMode.test.ts
- artifacts/validation/ui-parity/bot-c/G18-PSD-MODE-HANDOFF.md
- artifacts/validation/ui-parity/bot-c/STATUS.md (+ docs dual-write)

## Tests
- web unit: uiStore.narrowbandPsdMode (2 cases)

**No self-PASS.**
