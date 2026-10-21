# BOT_B_WAVE5 — G19 column matrix / G07 live Detect / G02 chrome / G08 collapse

| Field | Value |
|-------|-------|
| Branch | `work/bot-b-ui` |
| Base | `1c7643d8c740f6ed05d0dcf93b451f2a1c97348e` (`origin/main`) |
| Desktop rebuild | `17471a6` (read-only) |
| IQ | `sigmf_data_demo` only when e2e needs IQ |
| matrix_pass_claimed | **false** |

## Delivered vs rebuild 17471a6

- **G19** Full Qt AnnotationPanel column matrix on BottomPanel + M06MarksPanel:
  check · 名字/annotationId · 来源 · 当前段 · 开始/ms · 结束/ms · 中心/MHz · 带宽/kHz · mean · 质量 · 通道.
  Honest `—` when sampleRate / scoreMean / channel snapshot absent. ProjectTree sourceKind CN labels.
- **G07** Live Detect feeds: `uiStore.detectRunFeed` upserted from DetectPage LocalCompute polls; BottomPanel list/inspector/refresh/cancel wired to real runIds only (no fake FFSCN/SCN/demod/recognition).
- **G02** Broader chrome: mode/workspace QLabels on chart header; overflow 参考/动态 + 图头标题; aux 辅助图 caption.
- **G08** Collapse-to-min: bottom double-click resize → 29px tabs (`data-collapsed-min`, persist expanded); left column double-click → 8px (`data-shell-left-collapsed`, persist in `wss.shellColumns.v1`). Prior 100–500 height + 278/390 side resize retained.

## Evidence

- `g19-column-matrix-wave5.png`
- `g07-live-detect-feed-wave5.png`
- `g02-broader-chrome-wave5.png`
- `g08-collapse-to-min-wave5.png`
- e2e `apps/web/e2e/g19-g07-g02-g08-wave5.spec.ts`

## Not claimed

- ACCEPTANCE_MATRIX PASS / CLOSED
- Fake Detect runs, recognition, demod, G06
- Full desktop interactive re-shot

## Deferred

- G06 / recognition / demod (blocked / other owners)
- Chart gesture / MainChartHost / VerticalSplitter ownership remains Bot-C
