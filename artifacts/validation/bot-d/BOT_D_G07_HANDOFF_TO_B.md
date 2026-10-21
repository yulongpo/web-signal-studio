# Bot-D → Bot-B handoff: G07 panels (no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-21 ~23:10 Asia/Shanghai |
| Baseline evaluated | **`97fc7c0`** |
| Decision | **G07 residual is Bot-B (UI shell / layout)** — **not** Bot-D DSP |
| matrix_pass_claimed | **false** |

## What Bot-A listed for G07

From `INCREMENTAL_ba868e4.md` / `INCREMENTAL_8733cc1.md` / `UI_PARITY_GAP_AUDIT.md` / `BOT_B_G07_BOTTOM.md`:

- G07 = bottom panel / markers dock parity (`bottomContent_`).
- Landed (Bot-B): BottomPanel tabs / task / log; annotation & detection **dock hosts** chrome.
- Residual: **full Qt AnnotationPanel / DetectionPanel widget port** (hosts remain partial).

Note: `INCREMENTAL_8733cc1.md` TOP item 6 tags G07 residual as `(D)` — that attribution is **incorrect** relative to Bot-A’s own ba868e4 evidence and Bot-B ownership docs. Correct owner is **Bot-B**.

## Why not DSP / Bot-D

| Residual | Owner | Reason |
|----------|-------|--------|
| Full AnnotationPanel / DetectionPanel port | **Bot-B** | Qt→web shell, docks, lists, layout, chrome — no numerical DSP Worker feeds required |
| Dock host wiring already present | Bot-B | `BottomPanel.tsx`, e2e `g07-*.spec.ts`, `BOT_B_G07_BOTTOM.md` |
| Narrowband eye / bitstream (G06) | Bot-D | Separate; remain honest BLOCKED (see `BOT_D_G06_EYE_BITSTREAM_97fc7c0.md`) |

Bot-D will **not** implement G07 UI shell. No DSP hooks claimed for G07 in this tip.

## Handoff ask (for CAO → Bot-B)

Please continue G07 residual: full AnnotationPanel / DetectionPanel bottom hosts parity vs desktop `17471a6`, building on existing dock hosts in `apps/web/src/components/BottomPanel.tsx` and `artifacts/validation/ui-parity/bot-b/BOT_B_G07_BOTTOM.md`. Do not expect Bot-D Worker/WASM feeds for this item.

## Explicit

**matrix_pass_claimed: false**
