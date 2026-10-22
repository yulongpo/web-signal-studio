# SHELL_RAIL_4K_MENUBAR_29d29df — Bot-B shell rails / MenuBar mode / 4K thresholds (no PASS)

| Field | Value |
| --- | --- |
| When | 2026-10-22 Asia/Shanghai |
| Base | **29d29df** = 29d29df5bd58fce289faf229cc6634e3d8e3dbd0 (origin/main = C colorscale + BB/NB partition) |
| Branch | work/bot-b-ui |
| Desktop | **17471a6** = 17471a6488383b456281d12cb1a6d3d80290205d read-only `D:\project\signal_studio_rebuild` |
| Worktree | `D:\project\wss-wt-b` (HH-laptop) |
| matrix_pass_claimed | **false** |
| pass_claimed | **false** |

## Ownership split (CAO)

| Owner | Scope |
| --- | --- |
| **Bot-C (already in 29d29df / tip 0396f85)** | Chart-area BB/NB **XOR** partition (`data-chart-partition=narrowband-only` \| `broadband-nav-aux-main`); MainChartHost / Nav / Aux / VerticalSplitter / colorscale gutter. **Not re-touched by B.** |
| **Bot-B (this tip)** | Shell L/R rails; MenuBar persistent 宽带/窄带 mode chrome; NB page mode chrome; 4K side-rail thresholds from `MainWindow::enforceLayout` @17471a6. |

## Before → After (B scope only)

### Chart pages
- **Before (pre-C):** NB nested in main slot with BB nav/aux still visible (mix).
- **After C (base):** XOR partition already landed — B did **not** re-implement.
- **B residual before this tip:** SpecParamStrip (with `btn-workspace-*`) is BB-only after C; NB only had `nb-return-wideband`; no MenuBar persistent mode segment; shell collapse mins were 8px; no 990/1150/1490 auto thresholds.

### Shell rails / 4K thresholds (this tip)
Desktop `enforceLayout` cite:
- `hideResources = collapsed \|\| w <= 990` → width **38**
- `hideProperties = collapsed \|\| w <= 1150` → width **38**
- left visible + `w <= 1490`: **194** if `w <= 1150` else **218**; else preferred (default **278**, clamp 190–450)
- right visible: preferred (default **390**, clamp 320–650)

Web:
- New `apps/web/src/shellRailLayout.ts` + unit tests (6).
- `App.tsx` resize listener → `computeShellRailWidths`; data attrs `data-shell-4k-thresholds="990/1150/1490"`, `data-shell-auto-hide-left/right`, `data-shell-left-tier`, `data-shell-rail-collapsed-px="38"`, `data-shell-desktop-cite="enforceLayout@17471a6"`.
- Collapse rail px **8 → 38** (CSS grid end column 48 → 38).
- Auto-hide CSS hides tree body / rail body when threshold-collapsed (no invent DSP).

### MenuBar / NB mode chrome (this tip)
- MenuBar persistent segment `menubar-mode-chrome` with `btn-workspace-wideband` / `btn-workspace-narrowband` (desktop `workspaceModeButton` habit) — always available on NB after SpecParamStrip unmounts.
- View menu items retained (`menu-view-wideband` / `menu-view-narrowband`).
- NB header `nb-mode-chrome`: 宽带 / 窄带 / 返回宽带 (`nb-return-wideband` kept).

## Left for C
- Chart-area proportions (nav/aux/main mins already C); MainChartHost / splitter gesture / colorscale pixel polish.
- Do **not** ask B to rewrite C XOR hosts.

## Residual gaps (honest)
- Mid-band left compact 194/218 is width-driven; user drag preferred only applies at `w > 1490` (desktop same).
- RightRail store vs auto-hide: width + CSS hide body; store may stay false under 1150 until user toggles (no PASS).
- Project-tree i18n / bottom-dock further pixel parity OPEN.
- data-native-qfiledialog=false unchanged.
- IQ demo only sigmf_data_demo.

## Verify
```
cd apps/web && npx vitest run src/shellRailLayout.test.ts src/shellRail.contract.test.ts src/components/chartPartitionHonesty.test.ts
# 11 passed
```

## Claims
| Claim | Value |
| --- | --- |
| matrix_pass_claimed | **false** |
| pass_claimed | **false** |
| invent DSP / G06 / Multitaper / Burg | **false** |
| rewrote C chart partition | **false** |


## Deliver

- feature_sha: **1760499** = 17604991c5d096af2ba6fd722e9b64895d1a1f5d
- base_sha: **29d29df** = 29d29df5bd58fce289faf229cc6634e3d8e3dbd0
