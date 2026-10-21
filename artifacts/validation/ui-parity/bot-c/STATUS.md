# Bot-C G03–G05 STATUS (WIP — do not self-claim PASS)

| Field | Value |
|-------|-------|
| Asia/Shanghai | 2026-10-21 21:16:02 |
| Base tip | `563458a` (origin/main) |
| Scope | **G03–G05 only** (nav + aux Wave/PSD + vertical splitter) |
| Out of scope | G11–G14 (already on main) — not reimplemented |
| Push | none |

## Acceptance (honest)

| ID | Landed | Known gap |
|----|--------|-----------|
| G03 | `NavigationChart` in `global-nav`; drag window; STFT main `timeSec` linked; envelope from spectrogram | No desktop zoom/pause chrome buttons (Bot-B). Strip default 36px. |
| G04 | `WaveformChart` Wave/PSD from spectrogram derive; mode switch changes X/Y meaning; no ChartPlaceholder | **Wave = STFT time-envelope**, not raw IQ. Display-only, not demod. |
| G05 | `VerticalSplitter` nav↔aux and aux↔main; drag + double-click reset | Defaults 36/160 CSS px (not exact desktop 82/205). |

## Embeddables (`@wss/charts`)
NavigationChart, WaveformChart, VerticalSplitter (+ vite aliases)

## Host plugs
NavChartHost, AuxChartHost; App workspace-split; uiStore nav/pane/spectrogramDisplay

## Evidence
- artifacts/validation/ui-parity/bot-c/*.png (+ STATUS/manifest)
- docs/acceptance/ui-parity/bot-c/ (dual-write)
- e2e `g03-g05-tri-chart.spec.ts` (3/3 passed on this worktree)

## Tests
charts typecheck + 61 unit; web typecheck; chartDisplayDerive 3 unit; e2e 3/3

**No self-PASS.**
