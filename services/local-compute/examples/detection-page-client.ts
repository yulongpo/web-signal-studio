/**
 * Minimal HTTP client for the web detection page ↔ local-compute.
 *
 * Aligns with:
 * - services/local-compute/docs/DETECTION_PAGE_CONTRACT.md
 * - services/local-compute/openapi.yaml (protocol WEB_NATIVE_PROTOCOL v0.1.0)
 * - @wss/contracts LocalCompute* types
 *
 * Hard rules for Bot-B wiring:
 * - Loopback only (http://127.0.0.1:<port>)
 * - Bearer token on every call
 * - Gate Detect buttons on capabilities.detection.ffscn / .scn
 * - Prefer detection.uiMessages for banners; never invent candidates/boxes
 * - Sample indices are decimal strings (never JSON Number for large indexes)
 * - When status is BLOCKED or runtime.canInventResults === false, result has no fake detections
 *
 * This file is documentation / copy-paste reference. It is not imported by the service.
 */

import type {
  LocalComputeCapabilities,
  LocalComputeTaskCancelResponse,
  LocalComputeTaskCreateRequest,
  LocalComputeTaskCreateResponse,
  LocalComputeTaskRecord,
  LocalComputeTaskStatus,
  LocalComputeUiMessage,
} from '@wss/contracts';

export type { LocalComputeCapabilities, LocalComputeTaskRecord, LocalComputeUiMessage };

export interface LocalComputeClientOptions {
  /** Must be loopback, e.g. http://127.0.0.1:8000 */
  baseUrl: string;
  /** Value of LOCAL_COMPUTE_TOKEN (no "Bearer " prefix) */
  token: string;
  /** Optional fetch override (tests / Node) */
  fetchImpl?: typeof fetch;
}

function assertLoopback(baseUrl: string): void {
  let u: URL;
  try {
    u = new URL(baseUrl);
  } catch {
    throw new Error(`local-compute baseUrl is not a valid URL: ${baseUrl}`);
  }
  const host = u.hostname.toLowerCase();
  if (host !== '127.0.0.1' && host !== 'localhost' && host !== '[::1]' && host !== '::1') {
    throw new Error(`local-compute must use loopback host, got: ${host}`);
  }
}

export class LocalComputeClient {
  private readonly baseUrl: string;
  private readonly token: string;
  private readonly fetchImpl: typeof fetch;

  constructor(opts: LocalComputeClientOptions) {
    assertLoopback(opts.baseUrl);
    this.baseUrl = opts.baseUrl.replace(/\/$/, '');
    this.token = opts.token;
    this.fetchImpl = opts.fetchImpl ?? fetch;
  }

  private headers(json = false): HeadersInit {
    const h: Record<string, string> = {
      Authorization: `Bearer ${this.token}`,
    };
    if (json) h['Content-Type'] = 'application/json';
    return h;
  }

  private async parseError(res: Response): Promise<never> {
    let detail: unknown = res.statusText;
    try {
      const body = (await res.json()) as { detail?: unknown };
      if (body?.detail !== undefined) detail = body.detail;
    } catch {
      /* keep statusText */
    }
    throw new Error(`local-compute HTTP ${res.status}: ${JSON.stringify(detail)}`);
  }

  /** GET /capabilities — call before enabling Detect buttons. */
  async getCapabilities(): Promise<LocalComputeCapabilities> {
    const res = await this.fetchImpl(`${this.baseUrl}/capabilities`, {
      method: 'GET',
      headers: this.headers(),
    });
    if (!res.ok) await this.parseError(res);
    return (await res.json()) as LocalComputeCapabilities;
  }

  /**
   * POST /tasks — create a frozen task snapshot.
   * sampleRange / sampleIndices MUST be decimal strings.
   */
  async createTask(body: LocalComputeTaskCreateRequest): Promise<LocalComputeTaskCreateResponse> {
    const res = await this.fetchImpl(`${this.baseUrl}/tasks`, {
      method: 'POST',
      headers: this.headers(true),
      body: JSON.stringify(body),
    });
    if (!res.ok) await this.parseError(res);
    return (await res.json()) as LocalComputeTaskCreateResponse;
  }

  /** GET /tasks/{runId} — poll until terminal. */
  async getTask(runId: string): Promise<LocalComputeTaskRecord> {
    const res = await this.fetchImpl(`${this.baseUrl}/tasks/${encodeURIComponent(runId)}`, {
      method: 'GET',
      headers: this.headers(),
    });
    if (!res.ok) await this.parseError(res);
    return (await res.json()) as LocalComputeTaskRecord;
  }

  /** POST /tasks/{runId}/cancel — exact runId; cancel is terminal. */
  async cancelTask(runId: string): Promise<LocalComputeTaskCancelResponse> {
    const res = await this.fetchImpl(
      `${this.baseUrl}/tasks/${encodeURIComponent(runId)}/cancel`,
      { method: 'POST', headers: this.headers() },
    );
    if (!res.ok) await this.parseError(res);
    return (await res.json()) as LocalComputeTaskCancelResponse;
  }
}

const TERMINAL: ReadonlySet<LocalComputeTaskStatus> = new Set([
  'succeeded',
  'failed',
  'cancelled',
  'BLOCKED',
]);

export function isTerminalStatus(status: LocalComputeTaskStatus): boolean {
  return TERMINAL.has(status);
}

/** Pick banner copy for the detection page locale. */
export function pickUiMessageText(
  messages: LocalComputeUiMessage[],
  locale: 'zh' | 'en' = 'zh',
): string | null {
  if (!messages.length) return null;
  const first = messages[0];
  return locale === 'zh' ? first.zh : first.en;
}

/**
 * Suggested detection-page flow (stub runtime today → expect BLOCKED, no fake boxes).
 */
export async function runDetectionPageFlow(opts: {
  client: LocalComputeClient;
  kind: 'ffscn.detect' | 'scn.detect';
  sourcePath: string;
  sampleStart: string; // decimal
  sampleEnd: string; // decimal exclusive
  locale?: 'zh' | 'en';
  pollMs?: number;
  signal?: AbortSignal;
}): Promise<LocalComputeTaskRecord> {
  const { client, kind, sourcePath, sampleStart, sampleEnd } = opts;
  const locale = opts.locale ?? 'zh';
  const pollMs = opts.pollMs ?? 200;

  const caps = await client.getCapabilities();

  // Gate buttons — never invent availability client-side.
  const allowed =
    kind === 'ffscn.detect' ? caps.detection.ffscn === true : caps.detection.scn === true;

  if (!allowed) {
    const banner = pickUiMessageText(caps.detection.uiMessages, locale);
    throw new Error(
      banner ??
        `Detection blocked: ${caps.detection.reasons.join('; ') || 'ffscn/scn unavailable'}`,
    );
  }

  // Defense in depth: server must never allow invention; refuse if the flag is wrong.
  if (caps.runtime.canInventResults !== false) {
    throw new Error('Refusing client path: runtime.canInventResults must be false');
  }

  const { runId } = await client.createTask({
    kind,
    params: {},
    sourcePath,
    sampleRange: { start: sampleStart, end: sampleEnd },
  });

  for (;;) {
    if (opts.signal?.aborted) {
      await client.cancelTask(runId);
      throw new Error('aborted');
    }
    const rec = await client.getTask(runId);
    if (isTerminalStatus(rec.status)) {
      // BLOCKED / stub: result must not carry invented candidates.
      if (rec.status === 'BLOCKED' || rec.result == null) {
        return rec;
      }
      const r = rec.result as Record<string, unknown>;
      for (const bad of ['candidates', 'detections', 'boxes']) {
        if (bad in r) {
          throw new Error(`Refusing invented detection payload field: ${bad}`);
        }
      }
      return rec;
    }
    await new Promise((r) => setTimeout(r, pollMs));
  }
}

/* -------------------------------------------------------------------------- */
/* Example request/response shapes (illustrative; live values vary)           */
/* -------------------------------------------------------------------------- */

/** Example: GET /capabilities when no GPU / stub (detection blocked). */
export const EXAMPLE_CAPABILITIES_BLOCKED = {
  protocolVersion: '0.1.0',
  serviceVersion: '0.1.3',
  bindAddressPolicy: 'loopback-only',
  bindHost: '127.0.0.1',
  authRequired: true,
  dsp: { fft: true, psd: false, stft: false, ddc: false, reasons: [] as string[] },
  detection: {
    ffscn: false,
    scn: false,
    reasons: ['BLOCKED: stub runtime', 'BLOCKED: no verified TensorRT'],
    uiMessages: [
      {
        code: 'GPU_MISSING',
        severity: 'error',
        en: 'No NVIDIA GPU toolchain detected. Detection (FFSCN/SCN) is unavailable.',
        zh: '未检测到 NVIDIA GPU 工具链，检测（FFSCN/SCN）不可用。',
      },
      {
        code: 'STUB_RUNTIME',
        severity: 'warning',
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
  models: [] as Array<{ id: string; present: boolean }>,
  gpu: {
    toolchainVisible: false,
    runtimeVerified: false,
    name: null,
    driverVersion: null,
    reason: 'nvidia-smi not found (no GPU toolchain visible)',
    uiCode: 'GPU_MISSING',
  },
  runtime: {
    engine: 'STUB_NON_TENSORRT',
    tensorrtVerified: false,
    cudaVerified: false,
    canInventResults: false,
    modelSearchRoots: ['…/models'],
    ffscnPresent: false,
    scnPresent: false,
    ffscnReady: false,
    scnReady: false,
  },
  notes: ['Detection unavailable until real model + TensorRT path is verified'],
} as const;

/** Example: POST /tasks body — sample indices are decimal strings. */
export const EXAMPLE_TASK_CREATE_BODY: LocalComputeTaskCreateRequest = {
  kind: 'ffscn.detect',
  params: {},
  sourcePath: 'D:/data/example.iq',
  sampleRange: { start: '0', end: '1048576' },
  sampleIndices: ['0', '1024'],
};

/** Example: GET /tasks/{runId} when stub blocks (no invented candidates). */
export const EXAMPLE_TASK_BLOCKED = {
  runId: '00000000-0000-4000-8000-000000000001',
  kind: 'ffscn.detect',
  status: 'BLOCKED' as LocalComputeTaskStatus,
  progress: 1,
  request: EXAMPLE_TASK_CREATE_BODY,
  result: null,
  evidence: [{ kind: 'STUB_NON_TENSORRT', notes: 'no fake forward' }],
  blockReasons: ['BLOCKED: stub runtime', 'BLOCKED: NO_FAKE_INFERENCE'],
  message: 'Detection blocked (stub / no verified model+GPU)',
  messageZh: '检测已阻塞（占位运行时 / 无已核验模型与 GPU）',
  uiMessages: EXAMPLE_CAPABILITIES_BLOCKED.detection.uiMessages,
  statusHistory: ['queued', 'running', 'BLOCKED'],
  createdAt: '2026-10-21T10:00:00.000Z',
  updatedAt: '2026-10-21T10:00:01.000Z',
};
