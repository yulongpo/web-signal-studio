# BROADBAND_G08_IQ_G07 — Bot-B soft close-out (no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-22 Asia/Shanghai |
| Branch | work/bot-b-ui |
| Base | **b72c2fdd8f3f7014b728df0f3848571b4bb7ac0d** (b72c2fd) = origin/main BROADBAND_GAP merge |
| Tip | **7b688f5153f1e471a8215263a9a529b2b49eb602** (7b688f5) |
| Desktop | 17471a6 read-only signal_studio_rebuild |
| Owner | Bot-B (WSS-前端B) |
| matrix_pass_claimed | **false** |
| ui_parity_pass_claimed | **false** |
| pass_claimed | **false** |

## Scope (CAO steer)

Priority soft close-outs vs desktop 17471a6, **no invent** visual language:

1. **G08** MenuBar / accel soft inventory
2. **G19 / G20** Open IQ UX honesty (data-native-qfiledialog=false)
3. **G07** LocalCompute / Worker inspector honesty stamps
4. **G10** Esc / focus soft (existing handlers stamped; not full Maximize invent)
5. Strip overflow copy: remove stale andwidth=fs after A2 isibleBandwidthHz MET

**Fenced (not touched):** G16 enable-matrix · G06 eye/bitstream · G17 recognition · Multitaper/Burg · non-PoT · STFT-DDC invent · G21–G24 theme invent · ACCEPTANCE_MATRIX PASS flips.

## What landed

### G08 — MenuBar / accel soft
- Root stamps: data-g08-soft="broadband-gap", data-g08-accel-inventory="Ctrl+N|Ctrl+O|Ctrl+S|Ctrl+Z|Ctrl+Y|Del|Ctrl+A|Alt+Left|Alt+Right", data-g08-desktop-cite="MainWindow::buildMenus@17471a6".
- Existing six-menu shell + useMenuBarShortcuts retained (wave23/wave33). Disabled honesty unchanged (Save when projectSource!=='json', Undo/Redo/Delete gated).
- **PARTIAL** — soft inventory / accel map close-out only; **not** pixel CLOSED / re-shot MET.

### G19 / G20 — Open IQ browser honesty
- MenuBar: menu-open-iq + menubar-input-iq (+ project input) stamp data-native-qfiledialog="false"; title states browser/FSA picker, not native QFileDialog.
- SpectrumToolbar: root + tn-open-iq-wav + input-iq-wav stamped.
- ChartParamStrip: Open IQ button/input stamped (strip root already had the attr).
- **PARTIAL** — honest web picker path; never claims native QFileDialog MET.

### G07 — LocalCompute inspector honesty
- ottom-detect-worker-status: data-native-worker="false", data-g07-soft="broadband-gap", data-feed-source="local-compute".
- Inspector: data-g07-soft + data-inspector-fields listing created/updated/feed (fields already present from prior waves).
- **PARTIAL** — deepens honesty stamps; full Qt Worker dock residual remains.

### G10 — Esc soft (optional)
- MainChartHost: data-g10-soft="esc-context-menu-roi" (existing Escape clears context menu / ROI).
- MenuBar: data-g10-soft="esc-dialog-overflow" (existing Escape closes dialogs/menus).
- Overflow Esc already in ChartParamStrip (f9f05bb). **No full Maximize invent** this tip.
- **PARTIAL / soft** — G10 remains OPEN at matrix level per BROADBAND_GAP; this is stamp + existing behavior only.

### Strip overflow honesty
- Replaced stale andwidth=fs copy with andwidthHz=visibleBandwidthHz; fs fallback (auto-N + fixed SegmentMs).
- SegMs QLabel title aligned to A2 path.
- data-strip-bw-honesty="a2-visibleBandwidthHz" on strip root.

## Self-test bullets (manual)

1. Open File → **添加 / 打开信号…** (menu-open-iq): DOM has data-native-qfiledialog="false"; picking uses browser <input type=file> / FSA WAV — not a fake native dialog.
2. SpectrumToolbar **Open IQ** + hidden input-iq-wav: same data-native-qfiledialog="false".
3. MenuBar root: inspect data-g08-accel-inventory matches displayed accel spans; Ctrl+N/O/S/Z/Y, Del, Ctrl+A, Alt+Left/Right still fire when not typing (and respect disabled gates).
4. Bottom Detect dock → Worker status / inspector: data-native-worker="false"; selecting a real LocalCompute run shows **created** / **updated** / **feed** size (empty feed stays honest —).
5. Chart overflow → Segment auto-N copy mentions **visibleBandwidthHz** (no andwidth=fs).
6. Esc: open chart context menu → Esc dismisses; draw ROI → Esc cancels; MenuBar dialog → Esc closes.
7. Vitest: pps/web → itest run src/components/broadbandShellHonesty.test.ts → 4 passed.

## Honesty / claims

| Claim | Value |
|-------|-------|
| matrix_pass_claimed | **false** |
| Gap CLOSED claimed | **false** (G08/G19/G20/G07 stay PARTIAL; G10 soft only) |
| Invented visual language (G21–G24) | **no** |
| Invented Maximize shell | **no** |
| Fenced G06/G16/G17/Multitaper/Burg | **untouched** |

## Files touched

- pps/web/src/components/MenuBar.tsx
- pps/web/src/components/SpectrumToolbar.tsx
- pps/web/src/components/ChartParamStrip.tsx
- pps/web/src/components/BottomPanel.tsx
- pps/web/src/components/MainChartHost.tsx
- pps/web/src/components/broadbandShellHonesty.test.ts (new)
- docs/acceptance/evidence/bot-b/BROADBAND_G08_IQ_G07_b72c2fd.md (this file)

## Note on tip SHA

After git commit, rewrite the Tip row in this file to the new full SHA (or leave CAO to read git rev-parse HEAD on work/bot-b-ui).
