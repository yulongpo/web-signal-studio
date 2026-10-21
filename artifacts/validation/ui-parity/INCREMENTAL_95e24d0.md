# UI parity gap patch — Web `95e24d0` vs desktop `17471a6`

| Field | Value |
|-------|-------|
| Asia/Shanghai | 2026-10-21 21:46:00 |
| Author | Bot-A (`work/bot-a-audit`) |
| Desktop | `rebuild/a143-native` **`17471a6`** = `17471a6488383b456281d12cb1a6d3d80290205d`（unchanged） |
| **This Web tip** | **`95e24d0`** = `95e24d0ff98a2404fb58c7ab53049bff7330b70d`（merge Bot-G G06 screenshots `web-6c17a53` / `2509c69`） |
| Implementation base | **`6c17a53`** = `6c17a53d4731ca0984b43a1e3cb837ae5c6224f7`（merge Bot-B G06 NarrowbandWorkspace four-tab / `f0d68e9`） |
| Prior Bot-A tip | `2ccdacd` / `INCREMENTAL_fb2e020.md`（G06 OPEN stub） |
| Screenshot evidence | `artifacts/validation/ui-parity/qa/web-6c17a53/` + updated `qa/COMPARISON_NOTES.md` |
| Bot-B claim | `bot-b/BOT_B_G06_NARROWBAND.md` — **WIP / wiring only, NOT PASS** |
| Bot-G claim | `capture-notes.json` — **`ui_parity_pass_claimed=false`**, **`matrix_pass_claimed=false`** |
| Scope | G06 / 窄带四页 code + screenshot recheck @ `95e24d0`; **no implementation edits**; **screenshots alone do not CLOSE** |

## What `95e24d0` adds beyond `6c17a53`

| Commit | Subject |
|--------|---------|
| `2509c69` | qa(bot-g): G06 narrowband screenshots @6c17a53 (stub cleared, no PASS) |
| `95e24d0` | merge(bot-g): G06 narrowband screenshots web-6c17a53 |

Implementation code is unchanged from `6c17a53`; this tip adds **visual evidence** under `qa/web-6c17a53/`.

## Desktop four pages @ `17471a6` (source of truth)

Source: `ui/narrowband_workspace.{h,cpp}` + `docs/architecture/narrowband.md` + `a64117e`.

| Page index | Desktop title / objectName | Desktop panels / chrome |
|------------|----------------------------|-------------------------|
| 0 Observe | 信号观察 / `observePage` | Wave + PSD top; STFT bottom; `narrowbandObserveSplitter` 320/640 |
| 1 Modulation | 调制分析 / `modulationPage` | 星座/眼图「合成示意」+ 时频；调制格式/符号率/眼图控件 |
| 2 DeepLearning | 深度学习识别 / `deepLearningPage` | 合成识别披露 + 配置 + 通道时频（**非真推理**） |
| 3 Demodulation | 解调工作台 / `demodulationPage` | 解调星座/眼图「合成示意」+ `syntheticBitstream` |

Shared settings: PSD FFT / STFT N / 频率(基带\|RF) / 网格. `a64117e`: `pageChanged` + MainWindow overflow re-host.  
Architecture: Wave/PSD/STFT = real DDC; constellation/eye/recognition/bitstream = **synthetic DEMO** with disclosure.

## Web code evidence @ `6c17a53` (still current @ `95e24d0`)

| Path | Role |
|------|------|
| `apps/web/src/components/NarrowbandWorkspace.tsx` | Four tabs + ChartPanel hosts + toolbar/overflow |
| `apps/web/src/store/uiStore.ts` | narrowband page + PSD/STFT/freq/grid/waveform persist |
| `apps/web/src/App.tsx` | `workspaceMode==='narrowband'` → `<NarrowbandWorkspace />`（stub 组件移除） |
| `apps/web/src/App.css` | `.narrowband-workspace` / `.nb-*` |
| `apps/web/e2e/g06-narrowband.spec.ts` | stub=0；跨页保留；overflow；禁伪解调文案 |
| `apps/web/e2e/bot-g-g06-narrowband-capture.spec.ts` | Bot-G 截图采集 |

### ACCEPTANCE criterion map（G06）

| Criterion | Web code | Screenshot (`web-6c17a53`) | Verdict |
|-----------|----------|----------------------------|---------|
| 1 无 stub | App 无 stub；e2e count=0 | `narrowband_stub_visible: false`；`06-narrowband.png` | **MET**（code+shot） |
| 2 多页/多图区分 | 4 tabs + panels | `06` / `06b` / `06d` 可见页切换 | **MET（壳）** |
| 3 无伪解调文案 | honest notes + e2e | `demod_fake_claim: false`；`06d` | **MET** |
| 4 STFT N/网格/频率跨页（`a64117e`） | uiStore + e2e | `06b` page-switch pack | **MET（store）** |
| 5 overflow 值保留 | overflow 同 store + e2e | `06c-narrowband-overflow.png` | **MET（store）** |
| 真 DDC Wave/PSD/STFT | ChartPanel 仅 status | shots 显示空 host | **NOT MET** |
| 调制/识别/解调 chrome 对等 | 缺控件/位流/合成图布局 | shots 仅壳 | **NOT MET** |
| 标题文案 | Web「解调工作区」 | — | **MINOR DRIFT** vs 桌面「解调工作台」 |

**Strict:** screenshots **confirm stub cleared** and support PARTIAL; they **do not** alone CLOSE G06.

## Status decision — G06

| ID | Prior (`fb2e020`) | Now (`95e24d0`) | Reason |
|----|-------------------|---------------------|--------|
| **G06** | **OPEN**（stub 可见） | **PARTIAL** | 代码四页壳 + uiStore；截图 stub=false；**未 CLOSED**：无真 DDC 图、四页 chrome 不对等；Bot-B/Bot-G 均声明 no PASS |

### Remaining G06 sub-gaps

1. Observe 真 Wave/PSD/STFT（Bot-D DDC）替换 ChartPanel  
2. Observe splitter 320/640 + 持久化（现 CSS flex）  
3. Modulation chrome（格式/符号率/眼图控件；合成示意须披露）  
4. DeepLearning chrome（model/run/stop/progress；禁发明分数）  
5. Demodulation chrome（星座/眼图/bitstream）  
6. a64117e overflow 归属（桌面 MainWindow vs Web workspace+store）— 功能 e2e 已过，像素非对等  
7. 标签「解调工作区」→「解调工作台」  
8. `ddcFromChunkedReader.ts` 仍写 “narrowband UI stub” 文档噪声  

## Screenshot package (`qa/web-6c17a53/`)

| File | Role |
|------|------|
| `06-narrowband.png` | Observe 四 tab 壳；stub 不可见 |
| `06b-narrowband-page-switch.png` | 换页后设置保留证据（配合 e2e） |
| `06c-narrowband-overflow.png` | overflow 菜单同值 |
| `06d-narrowband-demodulation.png` | 解调页诚实文案 |
| `capture-notes.json` | stub=false；no PASS claims；G26 IQ `0000000` |

Supersedes: `qa/web-17937bb/06-narrowband.png`（STALE stub；见 `06-narrowband-STALE.txt`）.

## Other gaps（unchanged）

| ID | Status |
|----|--------|
| G01 | OPEN |
| G02–G04 | PARTIAL |
| G05 | CLOSED |
| G07–G10, G15–G18, G21–G24 | OPEN |
| G11–G14, G19–G20, G26 | PARTIAL |
| G17 | OPEN |
| G25 | DOCS |

## Counts after this patch

| 状态 | Count | IDs |
|------|-------|-----|
| OPEN | **11** | G01, G07–G10, G15–G18, G21–G24 |
| PARTIAL | **11** | G02–G04, **G06**, G11–G14, G19–G20, G26 |
| DOCS | **1** | G25 |
| CLOSED | **1** | G05 |

Delta vs `INCREMENTAL_fb2e020`: OPEN 12→11；PARTIAL 10→11；**G06 OPEN→PARTIAL**；CLOSED 仍仅 G05.

## Canonical docs updated

- `artifacts/validation/ui-parity/INCREMENTAL_95e24d0.md`（本文件；取代草稿 `INCREMENTAL_6c17a53`）
- `artifacts/validation/ui-parity/baseline/UI_PARITY_GAP_AUDIT.md`
- `artifacts/validation/ui-parity/baseline/UI_PARITY_ACCEPTANCE.md`
- mirrors: `docs/migration/ui-parity/*`
- `docs/migration/UPSTREAM_BASELINE.json` / `UPSTREAM_SYNC_LOG.md`

**Constraints unchanged:** IQ = `resources\sigmf_data_demo` only；models = rebuild-tree `*.engine` only. Shared tree not checked out. No implementation edits.
