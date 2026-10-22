# GAP_QUALITY_8f73f69 — web-8f73f69-real quality gap audit (no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-22 09:41 Asia/Shanghai |
| Web pack base | **`8f73f69`** = `8f73f69461c044fc8bce3cc6efbc4f0903e0af06` |
| origin/main at audit | **`a68c2b9`** = `a68c2b9042d4f7d8298c37bbdb473015ee643db4` (includes C HOTFIX `70a2d9b` after G pack merge `e93c939`) |
| Desktop | **`17471a6`** = `17471a6488383b456281d12cb1a6d3d80290205d` |
| Pack path | `artifacts/validation/ui-parity/qa/web-8f73f69-real/` (also under shared tree `D:\project\web_signal_studio\artifacts\...\web-8f73f69-real\`) |
| Prior tips | `INCREMENTAL_c9725dd` `f06d0e1` · `PARITY_TREE_LAYOUT_NB` `512e946` · B `INCREMENTAL_c9725dd_TREE_ZH` |
| Rule | Docs-only; **matrix_pass_claimed: false**; no invent screenshots; 禁发明 G06/G17/G16-matrix/Multitaper/Burg |
| IQ | `resources\sigmf_data_demo` · `data-native-qfiledialog=false` |

## Summary counts (this quality pack focus)

| Bucket | Count | Notes |
|--------|------:|-------|
| **OPEN** | **3** | Tree empty-vs-open IQ · Shot 01≡03 duplicate · Demo menu hang/skip |
| **PARTIAL** | **4** | NB 05/06 fail + nbObserveTopH hotfix post-pack · Add-signal soft · CJK/EN shell · Mark-before-NB |
| **CLOSED** | **0** | none claimed this tip |
| **DOCS** | **1** | this GAP_QUALITY tip |

Matrix-wide prior carry (unchanged invent): OPEN 5 · PARTIAL 18 · CLOSED 2 · DOCS 1 — **not** flipped CLOSED here.

## § Known pack findings (verified)

### 1) Tree shows「尚未打开工程」while IQ loaded — **OPEN**
- **Pack cite:** `COMPARISON_NOTES.md` / `MANIFEST.json` `observations.shot01.tree_snippet` includes `尚未打开工程` while `dsp_source=file-stft-worker` / `iq_format=sigmf`.
- **Code cite:** `ProjectTree.tsx` empty-state `data-testid=project-tree-empty` (~L569–570); tree body only when `projectSource==='sample'|'json'` — **input-iq / demo chart feed does not populate engineering tree**.
- **Owner:** **B** (+**F** if commit-from-IQ session required).

### 2) Shot 01 ≈ 03 same blob — **OPEN** (capture quality)
- **Verified:** SHA256 identical `52E176046CD5D67B46F6A665103C6F75177CB6D8B1CDD1BE713637312A6B3100`; both length **88373**.
- Files: `01-project-tree-cn-demo-loaded.png` ≡ `03-broadband-shell-stft-cjk-en.png`.
- **Owner:** **G** (re-capture distinct tree crop vs STFT shell; do not invent pixels).

### 3) NB `nbObserveTopH` — **PARTIAL** (pending→hotfix landed; pack still PARTIAL)
- Pack **05** `05-narrowband-PARTIAL.png` + gap: `workspace-narrowband` not visible (ReferenceError era).
- C tip `70a2d9b` / evidence `HOTFIX_nbObserveTopH_913e441.md` **merged** on main `a68c2b9`: `useState(readNbObserveTopH)` now in `NarrowbandObserveCharts.tsx` (~L196).
- **Score:** code residual **mitigated**; acceptance **PARTIAL** until G **re-shot** 05/06 on post-hotfix tip. **Not CLOSED.**

### 4) Demo menu — **OPEN / PARTIAL**
- Pack: `load_via` = `input-iq (menu-load-demo skipped to avoid hang)`.
- Code still has `menu-load-demo-iq` → `openDemoIqForMainChart` (`MenuBar.tsx` ~L164–169, ~L469).
- **Owner:** **B** (stabilize demo load / hang) · **G** (re-run using fixed menu when green).

### Additional pack gaps (scored)
| ID | Status | Owner | Note |
|----|--------|-------|------|
| Q-05 NB workspace visible | **PARTIAL** | C+G | tied to #3; re-shot after hotfix |
| Q-06 mark→NB | **PARTIAL** | C+D+G | `06a` mark_count 0; NB nav failed |
| Q-02 Add-signal | **PARTIAL** | B | soft dialog only; file_pick skipped |
| Q-03 CJK/EN shell | **PARTIAL** | B | `has_en:true` on shot03 (and duplicate blob undermines) |
| Q-04 Waterfall | **PARTIAL** | C/G | captured; pixel vs desktop not CLOSED |

## Gap table (priority)

| Pri | Gap | Status | Owner | Actionable | Evidence |
|-----|-----|--------|-------|------------|----------|
| P0 | Tree empty despite open IQ/demo | **OPEN** | **B** | After IQ open, sync tree/session (or auto mini-project) so empty-state clears | pack shot01 tree_snippet; `ProjectTree.tsx` L569+ |
| P0 | 01≡03 duplicate PNG | **OPEN** | **G** | Re-capture distinct 01 tree vs 03 STFT | SHA256 match above |
| P0 | Demo menu hang skip | **OPEN** | **B** | Fix hang in `openDemoIqForMainChart` / menu path; keep demo dir allowlist | MANIFEST `load_via`; `menu-load-demo-iq` |
| P1 | NB Observe crash / 05 PARTIAL | **PARTIAL** | **C** (done hotfix) + **G** | Re-shot 05/06 on `a68c2b9+`; no CLOSED until green | `HOTFIX_nbObserveTopH_*.md`; pack gaps |
| P1 | Mark→NB flow | **PARTIAL** | **C/D/G** | Ensure mark exists before NB; DDC stamps | `06a` mark_count 0 |
| P1 | Add-signal soft-only | **PARTIAL** | **B/F** | Exercise pick+confirm in G; RAW tree commit residual | shot02; F `A-NEXT-2-raw-…` |
| P2 | Shell zh/en mix in shots | **PARTIAL** | **B** | Continue EN purge; G re-shot | shot03 `has_en` |

## TOP actionable (CAO dispatch)

1. **B** — Tree reflects open IQ/session (clear「尚未打开工程」when chart has file-stft).  
2. **G** — Re-capture **01 ≠ 03**; re-run 05/06 after `70a2d9b`.  
3. **B** — Stabilize `menu-load-demo-iq` (no hang).  
4. **C/G** — NB Observe post-hotfix acceptance shots.  
5. **D/C** — Broadband mark present before NB DDC proof shot.  
6. **B/F** — Add-signal full pick path in QA; RAW tree commit if still open.  
7. **B** — Residual EN in shell/dialogs (e.g. rename Cancel/Apply).  

## Explicit BLOCKED fences (do not dispatch as invent work)

- **G06** eye/bitstream · **G17** recognition · **G16** enable-matrix · **Multitaper** · **Burg** — pack `skipped: G06/G17 — not invented`; remain **BLOCKED**.

## Claims

| Claim | Value |
|-------|-------|
| **matrix_pass_claimed** | **false** |
| **ui_parity_pass_claimed** | **false** |
| **pass_claimed** | **false** |
| Screenshots invented | **false** — only cited pack files + hashes |

## Paths
- This tip: `docs/acceptance/evidence/bot-a/GAP_QUALITY_8f73f69.md`
- Pack: `artifacts/validation/ui-parity/qa/web-8f73f69-real/`