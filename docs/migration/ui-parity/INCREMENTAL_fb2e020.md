# UI parity gap patch — Web `fb2e020` vs desktop `17471a6`

| Field | Value |
|-------|-------|
| Asia/Shanghai | 2026-10-21 21:33:00 |
| Author | Bot-A (`work/bot-a-audit`) |
| Desktop | `rebuild/a143-native` **`17471a6`** = `17471a6488383b456281d12cb1a6d3d80290205d`（unchanged） |
| **This Web tip** | **`fb2e020`** = `fb2e02052323127b33d665a03eb3400d8565b492`（Bot-G screenshot pack merge） |
| Implementation base | **`17937bb`** = `17937bb3a735d0df7058a3714aa353a88abb0e23`（B chrome/G02 · C 82/205 · D raw IQ） |
| Prior Bot-A tip | `1be860d` / `INCREMENTAL_17937bb.md`（code-only recheck @ `17937bb`） |
| Screenshot evidence | `artifacts/validation/ui-parity/qa/COMPARISON_NOTES.md` + `qa/web-17937bb/` + `qa/desktop-17471a6/` |
| Scope | Re-base incremental on `fb2e020`; fold Bot-G COMPARISON_NOTES; **no implementation edits**; **no self-PASS** |

## What `fb2e020` adds beyond `17937bb`

| Commit | Subject |
|--------|---------|
| `03e5f76` | Bot-G UI screenshot evidence @ `17937bb` vs desktop `17471a6` |
| `fb2e020` | merge(bot-g): UI parity screenshots |

Implementation claims (B/C/D) are unchanged from `17937bb`; this tip adds **visual evidence**, not new shell/DSP code.

## Bot-G COMPARISON_NOTES (incorporated)

Source: `artifacts/validation/ui-parity/qa/COMPARISON_NOTES.md` — **`ui_parity_pass_claimed=false`**, **`matrix_pass_claimed=false`**, CAO decides PASS.

### Evidence dirs

| Dir | Role |
|-----|------|
| `qa/web-17937bb/` | Playwright pack (10 PNGs + `capture-notes.json`) against code tip `17937bb` |
| `qa/desktop-17471a6/` | Fresh `desktop-primary-screen.png` + archival wide/narrow refs (**reference only**) |
| `baseline/desktop-*.png` | **STALE** — do not use alone for PASS |

### Observations used by this audit

| Observation (Bot-G) | Gap impact |
|---------------------|------------|
| `nav_chart_host` / splitters / `chart_strip_aux` present | Supports G03/G05 wiring; does **not** flip CLOSED beyond code evidence |
| G26 IQ loaded: `status_file=0000000`, `dsp_source=file-stft-worker` | PRE-2 / G26 IQ path exercised in capture |
| **Narrowband stub still visible** (`06-narrowband.png`) | **G06 remains OPEN** — confirmed visually |
| Status bar ~28px + file name (`04-status-bar-g25.png`) | **G25** stays DOCS / partial evidence only（无 gesture-hint） |
| Rails `07`–`10` display/detect/marker/channel | Shell rails exist; **Detect engine-picker G26 list not verified** in this pack |
| Desktop interactive same-IQ / same-rails walkthrough **not** automated | Blocks screenshot-only PASS for G01–G02 / full chrome |
| Archival desktop wide/narrow refs | Reference only — not PASS baseline |

### Gaps / blockers listed by Bot-G (mapped)

| # | Bot-G blocker | Mapped ID | Bot-A status after `fb2e020` |
|---|---------------|-----------|------------------------------|
| 1 | Narrowband real workspace still stub | **G06** | OPEN（视觉确认 stub） |
| 2 | Desktop interactive parity shots incomplete | （证据质量） | 不据此 CLOSED 任何 ID |
| 3 | G01 menubar / G02 toolbar chrome not closed by screenshots | **G01 / G02** | G01 OPEN；G02 PARTIAL（代码 demotion 保留；截图不升 CLOSED） |
| 4 | Detection UI engine-picker G26 not verified | **G17 / G26** | G17 OPEN；G26 PARTIAL（截图仅 Detect 页） |
| 5 | No PASS claimed | — | Bot-A 同意：**无矩阵 PASS** |

## Status vs `INCREMENTAL_17937bb` / `1be860d`

| ID | @ `1be860d` / `17937bb` | @ `fb2e020` | Screenshot delta |
|----|----------------------------|-------------|------------------|
| G01 | OPEN | OPEN | 截图无法补菜单栏 |
| G02 | PARTIAL | PARTIAL | 有 chart strips；COMPARISON_NOTES 明确不闭 G02 |
| G03 | PARTIAL | PARTIAL | `02-tri-chart-hosts` 支持；滚轮仍缺 |
| G04 | PARTIAL | PARTIAL | `05-aux-wave-or-psd` 存在；Bot-G 未 PASS；仍待 QA 语义确认 |
| G05 | **CLOSED** | **CLOSED** | 截图支持 hosts/splitters；CLOSED 仍以代码+e2e 为准 |
| G06 | OPEN | OPEN | **`06-narrowband` stub 可见 — 强化 OPEN** |
| G17 | OPEN | OPEN | `08-rail-detect` 仅页级；engine 列表未验 |
| G25 | DOCS | DOCS | ~28px + 文件名；无 gesture-hint |
| G26 | PARTIAL | PARTIAL | demo IQ 加载成功；Detect `.engine` 可选项未在本包验证 |
| G07–G16, G18–G24 | （同前） | 同前 | 本轮未改类 |

## Counts after this patch

| 状态 | Count | IDs |
|------|-------|-----|
| OPEN | **12** | G01, G06–G10, G15–G18, G21–G24 |
| PARTIAL | **10** | G02–G04, G11–G14, G19–G20, G26 |
| DOCS | **1** | G25 |
| CLOSED | **1** | G05 |

### Top remaining P0（含 COMPARISON_NOTES）

1. **G06** — 窄带去 stub（截图已证仍 stub）  
2. **G01** — 顶栏菜单/命令栏  
3. **G02** — `f9f05bb` caption + overflow 焦点（截图不闭）  
4. **G17** — DetectionCard 字段级 + engine 列表（Detect 截图不足）  
5. **G03 / G04** — 滚轮改窗宽；QA 确认 raw IQ 可视语义  
6. **G07 / G14 / G11–G13** — 底栏；ROI 确认条；框选放大/右键/标记控制点  
7. **G26** — Detect UI 不得暴露 `.pth`（本包未验 picker）  

## Canonical docs updated

- `artifacts/validation/ui-parity/INCREMENTAL_fb2e020.md`（本文件）
- `artifacts/validation/ui-parity/baseline/UI_PARITY_GAP_AUDIT.md`
- `artifacts/validation/ui-parity/baseline/UI_PARITY_ACCEPTANCE.md`
- mirrors: `docs/migration/ui-parity/*`
- `docs/migration/UPSTREAM_BASELINE.json` / `UPSTREAM_SYNC_LOG.md`

**Constraints unchanged:** IQ = `resources\sigmf_data_demo` only；models = rebuild-tree `*.engine` only. Shared tree not checked out. No implementation edits.
