# Bot-C G03–G05 STATUS (WIP — do not self-claim PASS)

| Field | Value |
|-------|-------|
| Asia/Shanghai | 2026-10-21 21:22:10 |
| Base tip | 196db21 (origin/main; merged ebdf359) |
| Branch | work/bot-c-charts |
| Scope | **Follow-up**: VerticalSplitter / pane defaults → desktop **nav=82 / aux=205** |
| Out of scope | G11–G14; Wave→raw IQ (Bot-D); short-window aux=176 (height()<850) not encoded yet |
| Desktop对照 | signal_studio 
ebuild/a143-native @ **17471a6** (enforceLayout: nav=82, aux=205 or 176 if height&lt;850) |
| Push | this follow-up tip on origin/work/bot-c-charts |

## Desktop对照 @ 17471a6

- Splitter defaults now match desktop **nav=82 / aux=205** CSS px (uiStore, App defaultPx, CSS var fallbacks, chart component defaults, VerticalSplitter fallback).
- Short-window desktop branch **aux=176 when height&lt;850** is **not** implemented in web yet (follow-up optional).
- Commit **9f05bb** (nav vs label-plot settings): unchanged vs prior STATUS — Bot-B chrome; no geometry impact.

## Acceptance (honest)

| ID | Landed | Known gap |
|----|--------|-----------|
| G03 | NavigationChart in global-nav; drag window; STFT main 	imeSec linked; envelope from spectrogram | No desktop zoom/pause / nav-vs-label settings chrome (Bot-B; see 9f05bb). Strip default **82px**. |
| G04 | WaveformChart Wave/PSD from spectrogram derive; mode switch changes X/Y meaning; no ChartPlaceholder | **Wave = STFT time-envelope**, not raw IQ. Display-only, not demod. |
| G05 | VerticalSplitter nav↔aux and aux↔main; drag + double-click reset | Defaults **82/205** CSS px (matches desktop tip defaults; no height&lt;850→176). |

## Follow-ups (not in this tip)

1. Optional: encode height&lt;850 → aux=176 like desktop enforceLayout.
2. Wave → **raw IQ** path via **Bot-D** (keep display-only; no fake demod).
3. Bot-B: nav/tab chart settings separation parity with 9f05bb (out of Bot-C scope).

## Embeddables (@wss/charts)
NavigationChart, WaveformChart, VerticalSplitter (+ vite aliases)

## Host plugs
NavChartHost, AuxChartHost; App workspace-split; uiStore nav/pane/spectrogramDisplay

## Evidence
- artifacts/validation/ui-parity/bot-c/*.png (+ STATUS/manifest)
- docs/acceptance/ui-parity/bot-c/ (dual-write)
- e2e g03-g05-tri-chart.spec.ts (reset assert → 205)

## Tests
charts typecheck (+ unit if run); web typecheck if touched

**No self-PASS.**
