# INCREMENTAL_8783b55 — short G19 tree API delta (no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-21 22:45 Asia/Shanghai |
| Web tip (audit subject) | **`8783b55`** = merge Bot-A `6348484` (INCREMENTAL_0e31e6d) onto **`e134bb6`** (F G19 residual tree API `bb58265`) |
| Desktop | **`17471a6`** (`rebuild/a143-native`; presentation lineage `c1f2cce`) |
| Prior Bot-A | `INCREMENTAL_0e31e6d.md` @ `6348484` (G06-focused; G19 unchanged there) |
| Scope | **G19 short** (tree API presentation); siblings only if clearly affected |
| Rule | Read-only; **no matrix PASS**; API deepen ≠ CLOSED; screenshots alone never CLOSE |
| Note | Retarget from draft `INCREMENTAL_e134bb6` → **`INCREMENTAL_8783b55`** per CAO (6348484 already on main). Post-audit `origin/main` also has Bot-G pack `ecd75cb` / `qa/web-e134bb6` (G19 shots) — screenshots alone never CLOSE. |

## Verified SHAs

| SHA | Role |
|-----|------|
| `8783b553a58ce371c973bf0e4717459e73c74f7e` | `origin/main` tip = audit subject |
| `e134bb699232acf00ae4f9632b92d4b792302d32` | merge(bot-f) G19 residual tree API |
| `bb58265f30d1293b49846737d837a3e5a471017c` | Bot-F: engineering-tree presentation |
| `63484841a14e3773dc12b74225edca57870e820c` | Bot-A INCREMENTAL_0e31e6d (docs only) |
| `17471a6488383b456281d12cb1a6d3d80290205d` | Desktop tip |

## Diff vs prior (`0e31e6d` → `8783b55`)

Impl delta is **only** Bot-F `bb58265` / merge `e134bb6` (plus Bot-A docs merge). No G06/G17/etc. product code in this tip.

`packages/project-io/src/engineering-tree.ts` (+ tests/re-exports) deepens `EngineeringTreeNode` vs desktop `c1f2cce` / `17471a6`:

- `title` / `tooltip` / `sourceTooltip` on file, channel, mark, annotationSource
- `CHANNEL_SOURCE_RELATION_DETAILS` + `normalizeChannelSourceRelation` / `channelRelationDetail` (desktop relationText)
- Compact channel detail: CF / BW / sample-rate / sourceTime / relation / create revision
- File / channel `unread` badge when view/sourceTime end > availableSamples
- `detectionRuns` branch under each file when `file.detectionRuns` present
- Re-exports from `@wss/project-io` and `apps/web/src/projectIo`
- Vitest: `engineering-tree.test.ts` (+ helpers) — Bot-F claims 7 passed / 1 skipped (not re-run here)

G18: Bot-F **declined** (handoff Bot-B display-summary UI) — evidence `bot-f/G18-HANDOFF-declined.md`. **No G18 status flip** (stays OPEN).

## Verdict summary

| ID | Prior (`0e31e6d`) | Now (`8783b55`) | One-liner |
|----|-------------------|-----------------|-----------|
| **G19** | PARTIAL (deepened @ba868e4 UI wire) | **PARTIAL (API presentation deepened)** | Tree API now emits title/tooltip/relation/unread/detectionRuns; ProjectTree UI still uses `title={node.detail\|\|label}` — does **not** surface `node.tooltip`/`node.title`; not CLOSED |
| G06 / G17 / G07 / G02 / G11 / G13 / G14 / G18 | as `0e31e6d` | **unchanged** | No product impl for these in tip |

**Counts (membership-normalized):** OPEN **9** · PARTIAL **14** · CLOSED **2** (G05, G14) · DOCS **1** (G25). **No PASS.** Same as `INCREMENTAL_0e31e6d`.

- OPEN: G08–G10, G16, G18, G21–G24
- PARTIAL: G01, G02–G04, G06, G07, G11–G13, G15, G17, **G19**–G20, G26
- CLOSED: G05, G14

## G19 detail

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| engineering-tree three-source marks API | **MET** (prior) | `733bde4` / session tree |
| ProjectTree maps `engineeringTreeFromSession` / mark select / soft-delete | **MET (UI wire)** (prior @ba868e4) | `ProjectTree.tsx` (`15022b5` lineage) |
| API: title / tooltip / sourceTooltip | **MET (API)** | `EngineeringTreeNode` fields; file/channel/mark/src builders (`bb58265`) |
| API: channel relation normalize + detail map | **MET (API)** | `CHANNEL_SOURCE_RELATION_DETAILS`, `normalizeChannelSourceRelation`, `channelRelationDetail` |
| API: compact channel detail (CF/BW/rate/src/relation/rev) | **MET (API)** | `channelDetail()` |
| API: unread badges (file view / channel sourceTime vs availableSamples) | **MET (API)** | `fileBadges` / channel branch |
| API: detectionRuns branch | **MET (API)** | `buildDetectionRunsBranch`; kind `detectionRuns` |
| Web re-exports | **MET** | `packages/project-io/src/index.ts`, `apps/web/src/projectIo/index.ts` |
| ProjectTree surfaces `node.tooltip` / richer title | **NOT MET** | `ProjectTree.tsx` still `title={node.detail \|\| node.label}` — ignores `node.tooltip` / `node.title` |
| Chinese desktop relation strings / folder glyphs / multi-select chrome | **NOT MET** | Bot-B residual (ASCII detail codes only) |
| G20 Open IQ UI | **NOT MET** (sibling PARTIAL) | Not this tip |

**Item not CLOSED.** API residual from prior “presentation NOT MET” is largely closed on the **project-io** side; **UI chrome parity** still blocks G19 CLOSED.

Code paths: `packages/project-io/src/engineering-tree.ts`, `engineering-tree.test.ts`, `packages/project-io/src/index.ts`, `apps/web/src/projectIo/index.ts`, `apps/web/src/components/ProjectTree.tsx`.  
Bot-F evidence: `artifacts/validation/ui-parity/bot-f/G19-RESIDUAL-presentation.md` (+ `.json`); `matrix_pass_claimed: false`.

## Sibling note

- **G18** remains **OPEN** (Bot-F declined; display-summary owned by Bot-B).
- **G20** remains **PARTIAL** (Open IQ UI).
- No flip claimed for G06/G17/G14/etc.

## TOP residual (max 8, parallel-friendly)

1. **G19 residual** — ProjectTree wire `node.tooltip`/`title`; optional CN relation copy; folder glyphs / multi-select (Bot-B on F API)
2. **G06 residual** — eye / recognition / bitstream beyond BLOCKED; workbench title + interactive STFT
3. **G17 residual** — DetectionCard + `.engine` picker (overlaps G26)
4. **G02 residual** — SpectrumToolbar habit / overflow focus
5. **G07 residual** — Annotation/Detection full bottom hosts
6. **G11 residual** — axis-only / middle-button pan
7. **G08** — column widths 278/390 (OPEN)
8. **G18** — display/channel page fill + 参考/动态 summary copy (OPEN)

## Explicit

**matrix_pass_claimed: false**  
**No ACCEPTANCE_MATRIX PASS. No self-declared PASS.**  
G19 remains **PARTIAL** — not CLOSED. Counts unchanged from `0e31e6d`.