# BOT_B_WAVE23 — G08 MenuBar QKeySequence parity (no PASS)

| Field | Value |
|-------|-------|
| Branch | `work/bot-b-ui` |
| Base | `42265bfde28871d6ffae30e9def0e03ceda7bfcf` (`origin/main`; past d4f0943) |
| Desktop | `17471a6` `MainWindow::buildMenus` QKeySequence |
| Prior | wave17 shell column keyboard only |
| matrix_pass_claimed | **false** |

## Delivered (real delta vs wave17 / rebuild)

- **G08 menu accelerators** matching rebuild `main_window.cpp` buildMenus:
  - Ctrl/Cmd+N new project · Ctrl/Cmd+O open project JSON · Ctrl/Cmd+S save (json source only)
  - Ctrl/Cmd+Z undo · Ctrl/Cmd+Y / Ctrl/Cmd+Shift+Z redo · Delete selected mark
  - Alt+Left / Alt+Right view history back/forward (existing `viewHistory*` hooks; no chart host edits)
- Skip when focus is input/textarea/select/contenteditable (Qt QLineEdit preference).
- Hook: `apps/web/src/hooks/useMenuBarShortcuts.ts`; stamps `data-menubar-shortcuts="wave23"` / `data-accel`.

## G07

- **No tip delta.** wave17 LocalCompute / `detectRunFeed` inspector already MET; residual = full Qt DetectionWorker beyond LocalCompute (backend — out of Bot-B chrome scope). No invented engines.

## Non-goals

- No full desktop shell pixel re-shot claim; no G06/G17 invent; `data-native-qfiledialog` remains false.
- No MainChartHost / scrubber / ClosedHand edits.

## Checks

- typecheck: no new errors vs base (pre-existing NarrowbandObserveCharts / useEscClearPinnedCursor only)

## Deferred

- Full shell visual re-shot; full Qt Worker; matrix PASS
