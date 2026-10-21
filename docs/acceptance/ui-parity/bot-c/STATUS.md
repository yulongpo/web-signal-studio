# Bot-C G03–G05 STATUS (WIP — do not self-claim PASS)

| Field | Value |
|-------|-------|
| Asia/Shanghai | 2026-10-21 21:18:57 |
| Base tip | `563458a` (origin/main at land); branch tip after push below |
| Branch | `work/bot-c-charts` |
| Scope | **G03–G05 only** (nav + aux Wave/PSD + vertical splitter) |
| Out of scope | G11–G14 (already on main) — not reimplemented |
| Desktop对照 | `signal_studio` `rebuild/a143-native` @ **`17471a6`** |
| Push | `origin/work/bot-c-charts` @ land commit + this STATUS follow-up |

## Desktop对照 @ 17471a6

- Splitter defaults on desktop remain **nav=82 / aux=205** (`main_window.cpp` enforceLayout); we ship **36/160** CSS px — gap unchanged.
- Commit **`f9f05bb`** (*fix(ui): separate chart navigation and label plot settings*): ChartControlStrip / nav vs tab label-plot settings separation. **Does not change** G03–G05 pane geometry or aux Wave/PSD data path. Impact on web: nav chrome / settings-strip ownership stays with **Bot-B** (we still lack desktop zoom/pause chrome); our `NavigationChart` window + envelope path still aligns with G03 intent under `17471a6`.
- **G03–G05 structural match vs `17471a6`: YES** (tri-pane + vertical splitters + nav window link). Pixel/chrome parity: **NO** (sizes + Wave source + nav settings strip).

## Acceptance (honest)

| ID | Landed | Known gap |
|----|--------|-----------|
| G03 | `NavigationChart` in `global-nav`; drag window; STFT main `timeSec` linked; envelope from spectrogram | No desktop zoom/pause / nav-vs-label settings chrome (Bot-B; see `f9f05bb`). Strip default 36px. |
| G04 | `WaveformChart` Wave/PSD from spectrogram derive; mode switch changes X/Y meaning; no ChartPlaceholder | **Wave = STFT time-envelope**, not raw IQ. Display-only, not demod. |
| G05 | `VerticalSplitter` nav↔aux and aux↔main; drag + double-click reset | Defaults 36/160 CSS px (not exact desktop 82/205). |

## Follow-ups (not in this tip)

1. Splitter defaults → desktop **82/205** (or proportional CSS equivalent).
2. Wave → **raw IQ** path via **Bot-D** (keep display-only; no fake demod).
3. Bot-B: nav/tab chart settings separation parity with `f9f05bb` (out of Bot-C scope).

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