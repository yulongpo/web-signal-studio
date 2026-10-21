# Bot-F web session contract (`@wss/project-io`)

Owner split:

| Area | Owner | Notes |
|------|-------|-------|
| `@wss/project-io` primitives + types | **Bot-F** | `openProjectFromJsonText`, `saveProjectToJsonText`, `summarizeLoadedProject`, channel snapshot, annotations |
| `ProjectSessionHookApi` (type-only) | **Bot-F** | Store/hook surface contract; no React |
| `apps/web/src/projectIo/` thin re-exports | **Bot-F** | Convenience import path for the web app |
| `apps/web` uiStore / ProjectTree / RightRail | **Bot-B** | Implements the hook API; owns shell UI |

## Primitives (call these; do not hand-roll JSON)

```ts
import {
  openProjectFromJsonText,
  saveProjectToJsonText,
  summarizeLoadedProject,
  type ProjectSessionHookApi,
} from '@wss/project-io';
// or from apps/web: import { ... } from '../projectIo';
```

| Function | Role |
|----------|------|
| `openProjectFromJsonText(text)` | Schema + version validate; returns `{ document, version }` |
| `saveProjectToJsonText(document, opts?)` | Always writes schema + version 6 JSON text |
| `summarizeLoadedProject(opened)` | Tree/status summary; sample counts stay decimal strings |

## `ProjectSessionHookApi`

Type-only contract the Zustand store (or a future hook) should satisfy:

- `openProjectFromText(text)` → `{ ok: true } | { ok: false; error }`
- `saveProjectJsonText()` → `string | null`
- `clearProject()`
- `readonly projectSummary` / `readonly projectDocument`

Bot-B implements it by wrapping the primitives above. Bot-F does **not** edit `uiStore.ts`.

## BigInt / decimal string rules

- Sample indexes and counts on the wire are **canonical decimal strings**.
- Never emit JSON Number for indexes that may exceed `Number.MAX_SAFE_INTEGER`.
- `JSON.parse` of a numeric literal past 2^53−1 loses precision irreversibly; a reviver cannot recover digits already rounded away.
- Summaries expose `sampleCount: string` for the same reason.

## Example call sequence (open / save text)

```ts
// Open (file picker / drag-drop text)
try {
  const opened = openProjectFromJsonText(fileText);
  const summary = summarizeLoadedProject(opened);
  // store: set projectDocument = opened.document, projectSummary = summary
} catch (e) {
  // surface e.message (ProjectIoError) to the user
}

// Save
const text = saveProjectToJsonText(projectDocument, { pretty: true });
// download / File System Access write

// Clear
// store: projectDocument = null, projectSummary = null
```

## Related paths

- `packages/project-io/src/project-session.ts` — primitives
- `packages/project-io/src/session-hook-contract.ts` — `ProjectSessionHookApi`
- `apps/web/src/projectIo/` — thin re-exports for the web app