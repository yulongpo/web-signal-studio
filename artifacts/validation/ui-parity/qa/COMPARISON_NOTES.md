# UI parity comparison notes — Bot-G evidence (NOT PASS)

| Field | Value |
|-------|--------|
| Asia/Shanghai | 2026-10-21 |
| Web tip (this pack) | `905cdadda26b0ef453256be8352a30824851addf` (≥ DDC `ef2713a`) |
| DDC feature tip | `ef2713a735cc96407ff2dcf7156f08fffb74a6a3` |
| Interim G01 (folded) | `d9263ac` / `qa/web-d8297d1` — superseded |
| Desktop tip | `17471a6488383b456281d12cb1a6d3d80290205d` |
| **ui_parity_pass_claimed** | **false** |
| **matrix_pass_claimed** | **false** |

## Evidence dirs

| Dir | Contents |
|-----|----------|
| `qa/web-905cdad/` | **Current:** G01 menubar + NB observe DDC filled (`data-nb-chart-ready=true`) |
| `qa/web-6c17a53/` | Prior NB shell; observe **STALE empty DDC** |
| `qa/web-d8297d1/` | Interim G01-only — **superseded** by web-905cdad |
| `qa/web-17937bb/` | Older full pack; G01/G06 STALE markers |
| `bot-b/` | Bot-B wiring shots (not Bot-G PASS) |

## G01 + NB observe before / after

| | Before | After (`web-905cdad`) |
|--|--------|----------------------|
| G01 | absent / interim d9263ac @ d8297d1 | menubar+command-bar 34px; File Open IQ; View↔NB |
| NB observe | `web-6c17a53` empty hosts | wave/PSD/STFT **ready**; pipeline `sigmf_data_demo→DDC` LO~2.15MHz R=1/16 |
| Stub | cleared since 6c17a53 | still cleared |

## Observations (not PASS)

- `nb_charts_non_empty: true`; charts mounted; pipeline kind `ddc`.
- Menubar height 34; menu Open IQ visible.
- Demod pages still honest empty (not claimed filled).
- Desktop interactive parity not re-done.

## Gaps

1. Not UI_PARITY PASS — CAO decides.
2. Desktop menubar / filled-NB side-by-side incomplete.
3. G02 chrome / other gates untouched.
4. Modulation/demod/DL pages still awaiting real paths.

## Reproduce

```text
cd apps/web && npx playwright test e2e/bot-g-g01-nb-observe-capture.spec.ts
```

## Gesture / ROI / Level @ 3d7ab59 (Bot-G, NOT PASS)

| Field | Value |
|-------|--------|
| Web tip | `3d7ab591a0e4ee09b6a03286b528f32c3196a45d` |
| Desktop ref | `17471a6` baseline (no fresh desktop re-capture) |
| Pack | `qa/web-3d7ab59/` |
| **ui_parity_pass_claimed** | **false** |

| Theme | Web evidence | Desktop note |
|-------|--------------|--------------|
| zoom-box | `01-zoom-box-drag.png`, `01b-zoom-box-applied.png` | desktop-axis box zoom on rebuild; archival only |
| view back | `02-view-back-menu.png`, `02b-view-back-restored.png` | context back/forward on desktop |
| ROI → Detect range | `03-roi-confirmation.png`, `03b-detect-range-from-roi.png`, `03c-…-crop.png` | G14 confirm → detect range |
| Level ref/dynamic | `04-level-popover.png`, `04b-crop`, `04c-applied` | baseline `web-temp-layer-level.png` archival |

Gaps: no PASS; desktop interactive not re-shot; G01 File corner parallel Bot-B.
## G01 corner / fit / File @ 23c38d0 (Bot-G, NOT PASS)

| Field | Value |
|-------|--------|
| Web tip | `23c38d01fc176bbb8319431639640bf0c54ec3c9` (includes `6adcd75` G01 deepen) |
| Pack | `qa/web-23c38d0/` |
| **ui_parity_pass_claimed** | **false** |

| Theme | Evidence |
|-------|----------|
| BrandV2 + window controls | `01-brandv2-window-controls.png`, `01b-menubar-corner-crop.png` |
| 视图适应全部 / 恢复默认 | `02-view-fit-restore-menu.png`, `02b-view-fit-all-applied.png`, `02c-view-restore-defaults-applied.png` |
| File 菜单展开 | `03-file-menu-expanded.png`, `03b-file-menu-crop.png` |

Gaps: web window controls are chrome stubs; no PASS.
## Combined pack @ e134bb6 (Bot-G, NOT PASS)

| Field | Value |
|-------|--------|
| Sync tip | `e134bb699232acf00ae4f9632b92d4b792302d32` |
| Impl baseline | `ba868e4` (G11/G14/G13/G07/G06 chrome) |
| Pack | `qa/web-e134bb6/` |
| Desktop | `17471a6` |
| **ui_parity_pass_claimed** | **false** |

Shots: Detect caps/REAL_RUNTIME; G19 tree three-source/presentation; G07 bottom; G06 observe/mod/demod/BLOCKED; G11 zoom-box; G14 ROI header; G13 handles.
## Pack @ 425cb40 (Bot-G, NOT PASS)

| Field | Value |
|-------|--------|
| Sync tip | `425cb400f8ccf10e2ca82b8d86330a851fd79965` (includes B `e9153b8`) |
| Pack | `qa/web-425cb40/` |
| Desktop | `17471a6` |
| **ui_parity_pass_claimed** | **false** |

Coverage: G08, G02 chart-header + physical caption, G07 dock, G18 display-summary, G19 fields + ProjectTree tooltip, G11 box-zoom.
## Pack @ 8733cc1 (Bot-G, NOT PASS)

| Field | Value |
|-------|--------|
| Sync tip | `8733cc10d77e8a17077d398c0d9ef9a4c07139ee` |
| Pack | `qa/web-8733cc1/` |
| Desktop | `17471a6` |
| **ui_parity_pass_claimed** | **false** |

Priority: CN tree chrome (`data-cn-chrome` / `desktop-cn-chrome`), DetectionCard, G11 axis-only pan. Adjacent: physical caption after pan.
