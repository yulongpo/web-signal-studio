# VALIDATION

> 维护：WSS-QA-G。结论必须有 `artifacts/validation/` 证据；与 [ACCEPTANCE_MATRIX.md](./ACCEPTANCE_MATRIX.md) 行号对齐。

更新时间（Asia/Shanghai）：2026-10-21 17:57:21

## 如何跑

### apps/web 单元 / 类型 / 构建

```powershell
cd D:\project\web_signal_studio\apps\web
npm ci
npm run lint
npx tsc -b --pretty false
npm test
npm run build
```

### Playwright（本地必须绿；CI e2e job 暂 `if: false`）

```powershell
cd D:\project\web_signal_studio\apps\web
npx playwright install chromium
$env:NODE_PATH = (Resolve-Path .\node_modules).Path
npx playwright test
```

说明：规格文件在仓库根 `tests/e2e/shell-nav.spec.ts`，依赖解析需 `NODE_PATH` 指向 `apps/web/node_modules`。

## 本机门禁结果（P1-G / P2-G）

| 命令 | 退出码 | 证据 |
|------|--------|------|
| `npm run lint` | 0 | `artifacts/validation/p1g/lint.log` |
| `npx tsc -b` | 0 | `artifacts/validation/p1g/typecheck.log` |
| `npm test` | 0 | `artifacts/validation/p1g/unit.log` |
| `npm run build` | 0 | `artifacts/validation/p1g/build.log` |
| `npx playwright test` | 0 | `artifacts/validation/p1g/e2e.log` |
| 摘要 | — | `artifacts/validation/p1g/summary.txt` |

## 与 ACCEPTANCE_MATRIX 对齐

| 矩阵行 | 本轮状态 | 说明 |
|--------|----------|------|
| Q-01 CI workflow | PASS | `.github/workflows/ci.yml` 已去掉 lint/typecheck/unit/build 的 continue-on-error；apps/web 真实跑 |
| Q-02 Playwright E2E | PASS（本地） | `tests/e2e/shell-nav.spec.ts` 四页 + 波形/PSD；CI e2e 仍 `if: false` |
| Q-04 密钥入 Git | WIP | 继续依赖 `.gitignore` |
| Q-05 delivery manifest | TODO | P6 |
| Q-06 只读边界 | PASS* | 见 `READONLY_GUARD.md` / `artifacts/validation/readonly-guard/` |
| M-05 宽窄带工作区布局 | WIP | 壳层四页切换已有 e2e；宽窄带真实布局未完 |

## 已知缺口

1. CI 远端尚未创建 `yulongpo/web-signal-studio`，workflow 仅本地落盘。
2. CI 中 e2e job 显式 `if: false`（浏览器缓存成本）；以本地 Playwright 为准。
3. `App.tsx` 壳与 Bot-B 的 `ProjectTree`/`StatusBar`/store 并行演进，本轮为过 typecheck 补齐了 `provisional` 类型导出。
4. 无许可证扫描 / SBOM（Q-03）。
## 工作树隔离（CAO 协调）

- Bot-G 仅在 `D:\project\wss-wt-g`（分支 `work/bot-g-qa`）操作；**禁止**在共享 `D:\project\web_signal_studio` 上 checkout 切走 `main`。
- 包名统一 `@wss/*`（`@wss/web`、`@wss/contracts`、`@wss/dsp-wasm`、`@wss/charts`、`@wss/domain`、`@wss/file-io`）。
- worktree 复跑证据：`artifacts/validation/p1g-wt/summary.txt`（lint/tsc/unit/build/e2e 均为 0）。