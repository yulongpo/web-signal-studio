# Bot-B G07 bottom panel (WIP / NOT PASS)

| Field | Value |
|-------|-------|
| Status | **WIP evidence** — not ACCEPTANCE PASS |
| Base tip | `c63f1de` |
| Rebuild | `17471a6` bottomTabs 29px / bottomContent_ ~150px open |

## Landed

| Item | Implementation |
|------|----------------|
| Tabs | 统一标记记录 / 后台任务 / 日志 |
| Collapse | 29px bar + toggle; open uses `bottomPanelHeightPx` (150) |
| Task progress | chip + bar (idle / honest; no fake %) |
| Log strip | `shellLogLines` max 300 |

## Screenshots

- g07-bottom-tasks.png
- g07-bottom-log.png

## Non-claims

- No ACCEPTANCE_MATRIX PASS. AnnotationPanel / DetectionPanel full hosts remain partial.
