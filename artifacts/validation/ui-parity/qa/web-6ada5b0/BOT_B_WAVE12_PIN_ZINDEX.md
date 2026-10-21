# BOT_B_WAVE12 — rail pin clickability / z-index (no PASS)

| Field | Value |
|-------|-------|
| Branch | `work/bot-b-ui` |
| Base | `4c2858896e706a7d42f88b2c8bab52c44d8d1fd9` (`origin/main` = Bot-G web-56233d2 evidence) |
| QA gap | Bot-G `notes.json`: `rail-dwell-pin-btn` click intercepted by workspace canvas |
| matrix_pass_claimed | **false** |

## Cause

Workspace/chart canvas could receive hits in the right-rail screen region (overflow + stacking). Shell resize `::after` hit widen also extended into the rail.

## Fix (chrome-only)

- `.workspace` in shell body: `z-index: 0; overflow: hidden; min-width: 0`
- `.right-rail`: `z-index: 6; isolation: isolate; pointer-events: auto`
- Pin / scrubber controls: explicit `pointer-events: auto` + local z-index
- Right resize `::after`: no right overhang into rail (`right: 0`)
- Stamps: `data-rail-stack="wave12"` on context-rail + rail-dwell-pin

Does **not** change chart hosts, C gesture, or ClosedHand paths.

## Checks

- typecheck green
- e2e `rail-dwell-pin-clickable-wave12.spec.ts` (env may limit)

## Deferred

- Live pin interaction re-shot by Bot-G
- Matrix PASS
