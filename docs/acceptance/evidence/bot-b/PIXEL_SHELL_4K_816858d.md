# PIXEL_SHELL_4K_816858d — Bot-B 4K shell density vs desktop 17471a6 (no PASS)

| Field | Value |
| --- | --- |
| When | 2026-10-22 Asia/Shanghai |
| Base (CAO ask) | **816858d** |
| Base (actual tip parent) | **f54c404** = `f54c40448988e847c0a6cad8d235f8f5e068d062` (origin/main = merge bot-a GAP_QUALITY_7f7aead / 23a5be9) |
| Branch | `work/bot-b-ui` |
| Desktop RO | **17471a6** = `17471a6488383b456281d12cb1a6d3d80290205d` `D:\project\signal_studio_rebuild` |
| Worktree | `D:\project\wss-wt-b` (HH-laptop) |
| GAP cite | `docs/acceptance/evidence/bot-a/GAP_QUALITY_7f7aead.md` (Q7-01..05, Q7-12 B share) |
| matrix_pass_claimed | **false** |
| pass_claimed | **false** |

## Harsh user / GAP problem (owned by B)

From CAO + GAP_QUALITY_7f7aead:

| ID | Symptom | B action this tip |
| --- | --- | --- |
| Q7-01 | Chrome pinned to top ~¼–⅓ of 4K; huge black void below | `html/body/#root/.app-shell` **height + min-height 100vh/100dvh**; body flex column; workspace fills cell; main `minmax(80px,1fr)`; kill placeholder min-heights that leave black bands |
| Q7-02 | Rails cramped; mid stack undersized | Preferred rails **278 / 390**; **physical 4K never auto-hide/compact**; mid defaults nav **82** / aux **205** (short **176**); splitter handle **10**; bottom default **260**; CSS vars for C |
| Q7-03 | Tiny fonts on 4K | Shell font YaHei **12px**; `@media (min-width:2560/3200)` raise to **13/14px** tree+chrome |
| Q7-04 | zh/en mix (SS / Signal Studio brand) | Brand → **信号工作室**; `index.html` `lang=zh-CN` |
| Q7-05 | Twin tree labels (原始标签 + chip) | Hide redundant `tree-source-kind` when title already equals CN source; denser row padding |
| Q7-12 | Joint sparse shell | ScopeBar desktop **宽带时频研判** + page segment; graph margins 5px; bg `#0d1725` / `#121f32` |

## Desktop numbers used (enforceLayout / QSS @17471a6)

| Metric | Desktop | Web after |
| --- | --- | --- |
| resourceWidth_ default | **278** (clamp 190–450) | 278 |
| propertyWidth_ default | **390** (clamp 320–650) | 390 |
| collapsed / auto-hide rail | **38** | 38 |
| hide left | w≤**990** (not on physical 4K) | same + 4K guard |
| hide right | w≤**1150** (not on physical 4K) | same + 4K guard |
| left compact | ≤1490 → 194/218 | same off 4K; **preferred on physical 4K** |
| nav / aux reset | **82** / **205** (h&lt;850 → aux **176**) | 82 / 205 (web short h&lt;900 → 176) |
| nav clamp | 62–128 | 62–128 |
| aux min | 116 | 116 |
| splitter handle | **10** | 10 (was CSS grid 6) |
| menuBar | **34** | 34 |
| scopeBar | **35** + primary「宽带时频研判」 | ScopeBar 35 |
| bottomHeight_ | **260** | default 260 (was 150) |
| UI font | YaHei / Segoe **12px**; Consolas mono | 12px + 4K media bump |
| workspace / charts bg | `#0d1725` / `#121f32` | matched |

## Before → After (B only)

**Before (prior tip c676a15 / merged 7f7aead):** thresholds 990/1150/1490 + MenuBar segment; `#root` only `min-height:100vh` while `.app-shell{height:100%}` → percentage height collapsed to content → **4K void**; workspace grid omitted BottomPanel row + used 6px handles; no scopeBar; brand EN `SS`/`Signal Studio`; bottom default 150.

**After (this tip):** viewport fill chain; physical-4K rail guard; ScopeBar; mid CSS vars (`shellMidLayout.ts`) for C; grid = scope|nav|10|aux|10|main|bottom|status; zh brand; tree twin chip suppressed; fonts scaled on ≥2560.

## Left for C (do not rewrite hosts)

- MainChartHost / Nav / Aux paint fill, STFT≠waterfall (GAP Q7-06/08/09)
- Colorbar readability
- Consume `--nav-pane-h` / `--aux-pane-h` / `--shell-split-handle` as needed; **XOR `data-chart-partition` untouched**
- Gesture / splitter ownership stays C (`VerticalSplitter` package)

## Left for D

- Aux / NB data feed (Q7-07/10/11)

## Residual (honest)

- Physical 4K detection uses `screen.*` / `devicePixelRatio` / `innerWidth≥3000`; odd multi-monitor layouts may mis-classify (no PASS).
- Chart **content** black (empty IQ / low-res texture) remains C/D — B only fixed shell geometry.
- Right-rail EN field labels may remain in Detect/Marker pages (partial Q7-04).
- Brand wordmark is text「信号工作室」, not desktop PNG assets.
- No screenshot re-shot in this tip (evidence is code + unit tests).

## Verify

```
cd apps/web && npx vitest run src/shellRailLayout.test.ts src/shellRail.contract.test.ts src/components/chartPartitionHonesty.test.ts
# 15 passed
```

## Claims

| Claim | Value |
| --- | --- |
| matrix_pass_claimed | **false** |
| pass_claimed | **false** |
| invent DSP | **false** |
| rewrote C MainChartHost / XOR | **false** |

## Deliver SHAs

- feature_sha: **0f1a1f33cd17fdcc2364358503663f1fe0580b3f** = 0f1a1f33cd17fdcc2364358503663f1fe0580b3f
- base_sha: **f54c404** = 54c40448988e847c0a6cad8d235f8f5e068d062
- gap_sha: **23a5be9** (GAP_QUALITY_7f7aead)
