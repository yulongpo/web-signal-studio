import { expect, test } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, Accept',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const BLOCKED_CAPS = {
  protocolVersion: '0.1.0',
  serviceVersion: 'test',
  bindAddressPolicy: 'loopback-only',
  bindHost: '127.0.0.1',
  authRequired: true,
  dsp: { fft: true, psd: false, stft: false, ddc: false, reasons: [] },
  detection: {
    ffscn: false,
    scn: false,
    reasons: ['BLOCKED: stub'],
    uiMessages: [
      {
        code: 'STUB_RUNTIME',
        severity: 'error',
        en: 'Local compute is in stub mode (no TensorRT). Detection will not invent results.',
        zh: '本地计算处于占位模式（无 TensorRT），检测不会伪造结果。',
      },
      {
        code: 'NO_FAKE_INFERENCE',
        severity: 'error',
        en: 'Refusing to invent FFSCN/SCN detection candidates.',
        zh: '拒绝伪造 FFSCN/SCN 检测候选结果。',
      },
    ],
  },
  models: [],
  gpu: {
    toolchainVisible: false,
    runtimeVerified: false,
    name: null,
    driverVersion: null,
    reason: 'nvidia-smi not found',
    uiCode: 'GPU_MISSING',
  },
  runtime: {
    engine: 'STUB_NON_TENSORRT',
    tensorrtVerified: false,
    cudaVerified: false,
    canInventResults: false,
    modelSearchRoots: [],
    ffscnPresent: false,
    scnPresent: false,
    ffscnReady: false,
    scnReady: false,
  },
  notes: [],
};

const MODEL_MISSING_CAPS = {
  ...BLOCKED_CAPS,
  detection: {
    ffscn: false,
    scn: false,
    reasons: ['BLOCKED: MODEL_MISSING_FFSCN', 'BLOCKED: MODEL_MISSING_SCN'],
    uiMessages: [
      {
        code: 'MODEL_MISSING_FFSCN',
        severity: 'error',
        en: 'FFSCN model file is missing. Detection cannot run.',
        zh: '缺少 FFSCN 模型文件，无法运行检测。',
      },
      {
        code: 'MODEL_MISSING_SCN',
        severity: 'error',
        en: 'SCN model file is missing. Detection cannot run.',
        zh: '缺少 SCN 模型文件，无法运行检测。',
      },
      {
        code: 'GPU_MISSING',
        severity: 'error',
        en: 'No NVIDIA GPU toolchain detected. Detection (FFSCN/SCN) is unavailable.',
        zh: '未检测到 NVIDIA GPU 工具链，检测（FFSCN/SCN）不可用。',
      },
    ],
  },
};


const WEIGHT_HASH_CAPS = {
  ...BLOCKED_CAPS,
  detection: {
    ffscn: false,
    scn: false,
    reasons: [
      'BLOCKED: WEIGHT_HASH_MISMATCH for ffscn at model.pth (hash/version mismatch)',
      'BLOCKED: WEIGHT_HASH_MISMATCH for scn at model.pth (hash/version mismatch)',
    ],
    uiMessages: [
      {
        code: 'MODEL_HASH_MISMATCH',
        severity: 'error',
        en: "Detection model hash/version does not match the configured expectation.",
        zh: "检测模型哈希/版本与配置期望不一致。",
      },
      {
        code: 'WEIGHT_HASH_MISMATCH',
        severity: 'error',
        en: "Detection model hash/version does not match the configured expectation.",
        zh: "检测模型哈希/版本与配置期望不一致。",
      },
    ],
  },
};


test.describe('detection page', () => {
  test('opens detect tab; mocked capabilities disable buttons and show zh banner', async ({
    page,
  }) => {
    await page.route('**/capabilities', async (route) => {
      if (route.request().method() === 'OPTIONS') {
        await route.fulfill({ status: 204, headers: CORS });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: CORS,
        body: JSON.stringify(BLOCKED_CAPS),
      });
    });

    await page.goto('/');
    await page.getByTestId('rail-tab-detect').click();
    await expect(page.getByTestId('detect-page')).toBeVisible();
    await expect(page.getByTestId('detect-capabilities-banner')).toContainText('占位模式');
    await expect(page.getByTestId('detect-ui-code').first()).toHaveAttribute(
      'data-code',
      'STUB_RUNTIME',
    );
    await expect(page.getByTestId('detect-btn-ffscn')).toBeDisabled();
    await expect(page.getByTestId('detect-btn-scn')).toBeDisabled();
    await expect(page.getByTestId('detect-token-input')).toBeVisible();
    await expect(page.getByTestId('detect-refresh-caps')).toBeVisible();
    await expect(page.getByTestId('detect-task-status')).toBeVisible();
    await expect(page.getByTestId('detect-gpu-uicode')).toHaveAttribute('data-code', 'GPU_MISSING');
    await expect(page.getByTestId('detect-runtime-engine')).toHaveAttribute(
      'data-engine',
      'STUB_NON_TENSORRT',
    );
    await expect(page.getByTestId('detect-can-invent')).toHaveAttribute('data-can-invent', 'false');
    await expect(page.getByTestId('detect-iq-source')).toHaveAttribute('data-has-iq', 'false');
    await expect(page.getByTestId('detect-candidates')).toHaveCount(0);
    await expect(page.getByTestId('detect-candidate-item')).toHaveCount(0);
  });

  test('MODEL_MISSING_* shows code chips and disables detect buttons', async ({ page }) => {
    await page.route('**/capabilities', async (route) => {
      if (route.request().method() === 'OPTIONS') {
        await route.fulfill({ status: 204, headers: CORS });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: CORS,
        body: JSON.stringify(MODEL_MISSING_CAPS),
      });
    });

    await page.goto('/');
    await page.getByTestId('rail-tab-detect').click();
    await expect(page.getByTestId('detect-capabilities-banner')).toContainText('缺少 FFSCN');
    await expect(page.locator('[data-testid="detect-ui-code"][data-code="MODEL_MISSING_FFSCN"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="detect-ui-code"][data-code="MODEL_MISSING_SCN"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="detect-ui-code"][data-code="GPU_MISSING"]').first()).toBeVisible();
    await expect(page.getByTestId('detect-btn-ffscn')).toBeDisabled();
    await expect(page.getByTestId('detect-btn-scn')).toBeDisabled();
    await expect(page.getByTestId('detect-gate-reason-ffscn')).toContainText('MODEL_MISSING_FFSCN');
    await expect(page.getByTestId('detect-gate-reason-scn')).toContainText('MODEL_MISSING_SCN');
    await expect(page.getByTestId('detect-candidate-item')).toHaveCount(0);
  });

  test('no IQ session gates detect even when caps allow (SOURCE_MISSING)', async ({ page }) => {
    await page.route('**/capabilities', async (route) => {
      if (route.request().method() === 'OPTIONS') {
        await route.fulfill({ status: 204, headers: CORS });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: CORS,
        body: JSON.stringify({
          ...BLOCKED_CAPS,
          detection: {
            ffscn: true,
            scn: true,
            reasons: [],
            uiMessages: [],
          },
        }),
      });
    });
    await page.goto('/');
    await page.getByTestId('rail-tab-detect').click();
    await expect(page.getByTestId('detect-iq-source')).toHaveAttribute('data-has-iq', 'false');
    await expect(page.getByTestId('detect-btn-ffscn')).toBeDisabled();
    await expect(page.getByTestId('detect-btn-scn')).toBeDisabled();
    await expect(page.getByTestId('detect-gate-reason-ffscn')).toContainText('SOURCE_MISSING');
    await expect(page.getByTestId('detect-refresh-caps')).toBeEnabled();
    await expect(page.getByTestId('detect-candidate-item')).toHaveCount(0);
  });

  test('with IQ open, createTask sends sourcePath; BLOCKED draws no candidates', async ({
    page,
  }) => {
    const here = path.dirname(fileURLToPath(import.meta.url));
    const wavPath = path.join(here, 'fixtures', 'tiny-iq.wav');
    let postedBody: Record<string, unknown> | null = null;
    let taskGets = 0;

    await page.route('**/capabilities', async (route) => {
      if (route.request().method() === 'OPTIONS') {
        await route.fulfill({ status: 204, headers: CORS });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: CORS,
        body: JSON.stringify({
          ...BLOCKED_CAPS,
          detection: { ...BLOCKED_CAPS.detection, ffscn: true, scn: false },
        }),
      });
    });
    await page.route('**/tasks', async (route) => {
      if (route.request().method() === 'OPTIONS') {
        await route.fulfill({ status: 204, headers: CORS });
        return;
      }
      if (route.request().method() === 'POST') {
        postedBody = route.request().postDataJSON() as Record<string, unknown>;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: CORS,
          body: JSON.stringify({ runId: 'run-blocked-iq-1' }),
        });
        return;
      }
      await route.fallback();
    });
    await page.route('**/tasks/run-blocked-iq-1', async (route) => {
      if (route.request().method() === 'OPTIONS') {
        await route.fulfill({ status: 204, headers: CORS });
        return;
      }
      taskGets += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: CORS,
        body: JSON.stringify({
          runId: 'run-blocked-iq-1',
          kind: 'ffscn.detect',
          status: 'BLOCKED',
          progress: 1,
          request: {},
          result: {
            candidates: [{ score: 0.99, box: [0, 0, 10, 10] }],
            detections: [{ id: 'fake' }],
          },
          evidence: [],
          blockReasons: ['BLOCKED: STUB_RUNTIME'],
          message: 'stub',
          messageZh: '占位运行时，拒绝伪造候选结果。',
          uiMessages: [
            {
              code: 'STUB_RUNTIME',
              severity: 'error',
              en: 'Local compute is in stub mode (no TensorRT). Detection will not invent results.',
              zh: '本地计算处于占位模式（无 TensorRT），检测不会伪造结果。',
            },
          ],
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:01Z',
        }),
      });
    });

    await page.goto('/');
    await page.getByTestId('input-iq-wav').setInputFiles(wavPath);
    const host = page.getByTestId('main-chart-host');
    await expect
      .poll(async () => host.getAttribute('data-dsp-source'), { timeout: 20000 })
      .not.toBe('loading');

    await page.getByTestId('rail-tab-detect').click();
    await expect(page.getByTestId('detect-iq-source')).toHaveAttribute('data-has-iq', 'true');
    await expect(page.getByTestId('detect-btn-ffscn')).toBeEnabled();
    await page.getByTestId('detect-btn-ffscn').click();
    await expect(page.getByTestId('detect-task-status')).toContainText('BLOCKED');
    await expect(page.getByTestId('detect-no-candidates')).toBeVisible();
    await expect(page.getByTestId('detect-candidate-item')).toHaveCount(0);
    expect(postedBody).toBeTruthy();
    expect(String(postedBody?.sourcePath ?? '')).toMatch(/tiny-iq\.wav/i);
    expect(taskGets).toBeGreaterThan(0);

    await page.getByTestId('btn-clear-iq-wav').click();
    await expect(page.getByTestId('detect-iq-source')).toHaveAttribute('data-has-iq', 'false');
    await expect(page.getByTestId('detect-btn-ffscn')).toBeDisabled();
    await expect(page.getByTestId('detect-task-status')).toContainText('idle');
  });

  test('offline capabilities keep buttons disabled', async ({ page }) => {
    await page.route('**/capabilities', async (route) => {
      await route.abort('connectionfailed');
    });
    await page.goto('/');
    await page.getByTestId('rail-tab-detect').click();
    await expect(page.getByTestId('detect-btn-ffscn')).toBeDisabled();
    await expect(page.getByTestId('detect-btn-scn')).toBeDisabled();
    await expect(page.getByTestId('detect-capabilities-banner')).toBeVisible();
    await expect(page.getByTestId('detect-candidate-item')).toHaveCount(0);
  });

  test('REAL_RUNTIME is visible from capabilities and still refuses unverified candidates', async ({
    page,
  }) => {
    await page.route('**/capabilities', async (route) => {
      if (route.request().method() === 'OPTIONS') {
        await route.fulfill({ status: 204, headers: CORS });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: CORS,
        body: JSON.stringify({
          ...BLOCKED_CAPS,
          detection: {
            ffscn: true,
            scn: false,
            reasons: [],
            uiMessages: [
              {
                code: 'REAL_RUNTIME',
                severity: 'info',
                en: 'Verified real detection runtime is ready for this family (TensorRT or PyTorch).',
                zh: '该检测族别的 PyTorch 真推理运行时已就绪。',
              },
            ],
          },
          runtime: {
            ...BLOCKED_CAPS.runtime,
            engine: 'TENSORRT_CUDA',
            tensorrtVerified: true,
            canInventResults: false,
            ffscnReady: true,
          },
        }),
      });
    });
    await page.goto('/');
    await page.getByTestId('rail-tab-detect').click();
    const runtime = page.getByTestId('detect-real-runtime');
    await expect(runtime).toBeVisible();
    await expect(runtime).toHaveAttribute('data-code', 'REAL_RUNTIME');
    await expect(runtime).toHaveAttribute('data-can-invent', 'false');
    await expect(runtime).toContainText('真推理运行时已就绪');
    await expect(page.getByTestId('detect-runtime-engine')).toHaveAttribute(
      'data-engine',
      'TENSORRT_CUDA',
    );
    await expect(page.getByTestId('detect-sample-range')).toHaveAttribute(
      'data-range-source',
      'default',
    );
    await expect(page.getByTestId('detect-candidate-item')).toHaveCount(0);
    await expect(page.getByTestId('detect-btn-ffscn')).toBeDisabled();
  });

  test('WEIGHT_HASH_MISMATCH banners use server uiMessages; no candidates', async ({ page }) => {
    await page.route('**/capabilities', async (route) => {
      if (route.request().method() === 'OPTIONS') {
        await route.fulfill({ status: 204, headers: CORS });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: CORS,
        body: JSON.stringify(WEIGHT_HASH_CAPS),
      });
    });
    await page.goto('/');
    await page.getByTestId('rail-tab-detect').click();
    await expect(page.getByTestId('detect-page')).toBeVisible();
    await expect(
      page.locator('[data-testid="detect-ui-code"][data-code="WEIGHT_HASH_MISMATCH"]').first(),
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="detect-ui-code"][data-code="MODEL_HASH_MISMATCH"]').first(),
    ).toBeVisible();
    await expect(page.getByTestId('detect-btn-ffscn')).toBeDisabled();
    await expect(page.getByTestId('detect-btn-scn')).toBeDisabled();
    await expect(page.getByTestId('detect-candidates')).toHaveCount(0);
    await expect(page.getByTestId('detect-candidate-item')).toHaveCount(0);
    await expect(page.getByTestId('detect-gate-reason-ffscn')).toBeVisible();
  });

  test('engine inventory lists capabilities.models; .pth marked blocked (G26)', async ({ page }) => {
    await page.route('**/capabilities', async (route) => {
      if (route.request().method() === 'OPTIONS') {
        await route.fulfill({ status: 204, headers: CORS });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: CORS,
        body: JSON.stringify({
          ...BLOCKED_CAPS,
          models: [
            {
              id: 'ffscn:ffscn_epoch1200_dynamic_fp32.engine',
              path: 'D:\\project\\signal_studio_rebuild\\out\\vs2026-qt611-release_bin\\detection-models\\ffscn-gui-iq-v1\\ffscn_epoch1200_dynamic_fp32.engine',
              present: true,
              notes: 'engine',
            },
            {
              id: 'scn:scn_model.engine',
              path: 'D:\\project\\signal_studio_rebuild\\out\\vs2026-qt611-release_bin\\detection-models\\scn-max-psd-v1\\scn_model.engine',
              present: true,
              notes: 'engine',
            },
            {
              id: 'ffscn:legacy.pth',
              path: 'D:\\project\\signal_studio_rebuild\\out\\ignored\\legacy.pth',
              present: true,
              notes: 'pth-not-allowed',
            },
          ],
          runtime: {
            ...BLOCKED_CAPS.runtime,
            modelSearchRoots: [
              'D:\\project\\signal_studio_rebuild\\out\\vs2026-qt611-release_bin\\detection-models',
            ],
            ffscnPresent: true,
            scnPresent: true,
            ffscnReady: false,
            scnReady: false,
          },
          detection: {
            ...BLOCKED_CAPS.detection,
            uiMessages: [
              {
                code: 'ENGINE_MISSING',
                severity: 'error',
                en: 'Canonical TensorRT .engine not found under signal_studio_rebuild detection-models.',
                zh: '未在 signal_studio_rebuild detection-models 下找到规范 TensorRT .engine。',
              },
              ...BLOCKED_CAPS.detection.uiMessages,
            ],
          },
        }),
      });
    });
    await page.goto('/');
    await page.getByTestId('rail-tab-detect').click();
    await expect(page.getByTestId('detect-engine-inventory')).toHaveAttribute('data-model-count', '3');
    await expect(page.getByTestId('detect-engine-list')).toBeVisible();
    await expect(page.getByTestId('detect-engine-item').first()).toHaveAttribute('data-engine', 'true');
    await expect(page.locator('[data-testid="detect-engine-item"][data-pth="true"]').first()).toHaveAttribute('data-blocked-pth', 'true');
    await expect(page.getByTestId('detect-ffscn-present')).toHaveAttribute('data-present', 'true');
    await expect(page.getByTestId('detect-model-roots')).toHaveAttribute('data-count', '1');
    await expect(page.locator('[data-testid="detect-ui-code"][data-code="ENGINE_MISSING"]').first()).toBeVisible();
    await expect(page.getByTestId('detect-btn-ffscn')).toBeDisabled();
    await expect(page.getByTestId('detect-candidate-item')).toHaveCount(0);
  });

  test('cancel button stays disabled without active run; inventory visible', async ({ page }) => {
    await page.route('**/capabilities', async (route) => {
      if (route.request().method() === 'OPTIONS') {
        await route.fulfill({ status: 204, headers: CORS });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: CORS,
        body: JSON.stringify(BLOCKED_CAPS),
      });
    });
    await page.goto('/');
    await page.getByTestId('rail-tab-detect').click();
    await expect(page.getByTestId('detect-btn-cancel')).toBeDisabled();
    await expect(page.getByTestId('detect-engine-inventory')).toBeVisible();
  });


  test('DetectionCard selectable .engine picker + strategy/phase chrome', async ({ page }) => {
    await page.route('**/capabilities', async (route) => {
      if (route.request().method() === 'OPTIONS') {
        await route.fulfill({ status: 204, headers: CORS });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: CORS,
        body: JSON.stringify({
          ...BLOCKED_CAPS,
          models: [
            {
              id: 'ffscn:ffscn_epoch1200_dynamic_fp32.engine',
              path: 'D:\\project\\signal_studio_rebuild\\out\\vs2026-qt611-release_bin\\detection-models\\ffscn-gui-iq-v1\\ffscn_epoch1200_dynamic_fp32.engine',
              present: true,
              notes: 'engine',
            },
            {
              id: 'scn:scn_model.engine',
              path: 'D:\\project\\signal_studio_rebuild\\out\\vs2026-qt611-release_bin\\detection-models\\scn-max-psd-v1\\scn_model.engine',
              present: true,
              notes: 'engine',
            },
            {
              id: 'ffscn:legacy.pth',
              path: 'D:\\project\\signal_studio_rebuild\\out\\ignored\\legacy.pth',
              present: true,
              notes: 'pth-not-allowed',
            },
          ],
          runtime: {
            ...BLOCKED_CAPS.runtime,
            modelSearchRoots: [
              'D:\\project\\signal_studio_rebuild\\out\\vs2026-qt611-release_bin\\detection-models',
            ],
            ffscnPresent: true,
            scnPresent: true,
            ffscnReady: false,
            scnReady: false,
          },
        }),
      });
    });
    await page.goto('/');
    await page.getByTestId('rail-tab-detect').click();
    await expect(page.getByTestId('detection-card')).toBeVisible();
    await expect(page.getByTestId('detection-engine-select')).toBeVisible();
    await expect(page.getByTestId('detection-engine-select')).toHaveValue(
      'ffscn:ffscn_epoch1200_dynamic_fp32.engine',
    );
    await page.getByTestId('detection-engine-select').selectOption('scn:scn_model.engine');
    await expect(page.getByTestId('detection-engine-select')).toHaveValue('scn:scn_model.engine');
    await expect(
      page.locator('[data-testid="detect-engine-item"][data-model-id="scn:scn_model.engine"]'),
    ).toHaveAttribute('data-selected', 'true');
    await expect(
      page.locator('[data-testid="detect-engine-item"][data-pth="true"]').first(),
    ).toHaveAttribute('data-selectable', 'false');
    await page.getByTestId('detection-strategy-roi').click();
    await expect(page.getByTestId('detection-time-strategy')).toHaveAttribute(
      'data-strategy',
      'roi',
    );
    await expect(page.getByTestId('detection-spectrum-mode')).toBeVisible();
    await expect(page.getByTestId('detection-preflight')).toBeVisible();
    await expect(page.getByTestId('detect-engine-inventory')).toHaveAttribute(
      'data-selectable-count',
      '2',
    );
  });

});
