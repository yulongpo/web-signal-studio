/**
 * PROVISIONAL — Bot-B local-compute HTTP client (loopback).
 * Aligned with services/local-compute/examples/detection-page-client.ts
 * (LocalComputeClient class, loopback assert, same methods).
 * Sample indexes on the wire are decimal strings only.
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

/** Bot-E docs + Vite proxy target (see vite.config.ts /api → :8000). */
export const DEFAULT_LOCAL_COMPUTE_BASE_URL = 'http://127.0.0.1:8000';

export function resolveLocalComputeBaseUrl(
  envUrl?: string | null,
  override?: string | null,
): string {
  const raw = (override?.trim() || envUrl?.trim() || DEFAULT_LOCAL_COMPUTE_BASE_URL).replace(
    /\/$/,
    '',
  );
  return raw;
}

export function capabilitiesUrl(baseUrl: string): string {
  return `${baseUrl.replace(/\/$/, '')}/capabilities`;
}

export function tasksUrl(baseUrl: string): string {
  return `${baseUrl.replace(/\/$/, '')}/tasks`;
}

export function taskUrl(baseUrl: string, runId: string): string {
  return `${baseUrl.replace(/\/$/, '')}/tasks/${encodeURIComponent(runId)}`;
}

export function taskCancelUrl(baseUrl: string, runId: string): string {
  return `${taskUrl(baseUrl, runId)}/cancel`;
}

export function assertLoopback(baseUrl: string): void {
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

export class LocalComputeClientError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = 'LocalComputeClientError';
    this.status = status;
    this.body = body;
  }
}

export interface LocalComputeClientOptions {
  /** Must be loopback, e.g. http://127.0.0.1:8000 */
  baseUrl: string;
  /** Bearer token value (no "Bearer " prefix) */
  token: string;
  fetchImpl?: typeof fetch;
}

/**
 * HTTP client for the detection page — matches Bot-E example API surface.
 */
export class LocalComputeClient {
  readonly baseUrl: string;
  private readonly token: string;
  private readonly fetchImpl: typeof fetch;

  constructor(opts: LocalComputeClientOptions) {
    assertLoopback(opts.baseUrl);
    this.baseUrl = opts.baseUrl.replace(/\/$/, '');
    this.token = opts.token;
    this.fetchImpl = opts.fetchImpl ?? fetch.bind(globalThis);
  }

  private authHeaders(json = false): HeadersInit {
    const h: Record<string, string> = {
      Accept: 'application/json',
    };
    if (this.token.trim()) {
      h.Authorization = `Bearer ${this.token.trim()}`;
    }
    if (json) h['Content-Type'] = 'application/json';
    return h;
  }

  private async request<T>(url: string, init?: RequestInit): Promise<T> {
    let res: Response;
    try {
      res = await this.fetchImpl(url, {
        ...init,
        headers: {
          ...(init?.headers ?? {}),
        },
      });
    } catch (err) {
      throw new LocalComputeClientError(
        err instanceof Error ? err.message : 'Network error',
        0,
        null,
      );
    }
    const text = await res.text();
    let body: unknown = null;
    if (text) {
      try {
        body = JSON.parse(text) as unknown;
      } catch {
        body = text;
      }
    }
    if (!res.ok) {
      const detail =
        body && typeof body === 'object' && body !== null && 'detail' in body
          ? String((body as { detail: unknown }).detail)
          : res.statusText;
      throw new LocalComputeClientError(detail || `HTTP ${res.status}`, res.status, body);
    }
    return body as T;
  }

  /** GET /capabilities — call before enabling Detect buttons. */
  getCapabilities(): Promise<LocalComputeCapabilities> {
    return this.request<LocalComputeCapabilities>(capabilitiesUrl(this.baseUrl), {
      method: 'GET',
      headers: this.authHeaders(),
    });
  }

  /**
   * POST /tasks — create a frozen task snapshot.
   * sampleRange / sampleIndices MUST be decimal strings.
   */
  createTask(body: LocalComputeTaskCreateRequest): Promise<LocalComputeTaskCreateResponse> {
    return this.request<LocalComputeTaskCreateResponse>(tasksUrl(this.baseUrl), {
      method: 'POST',
      headers: this.authHeaders(true),
      body: JSON.stringify(body),
    });
  }

  /** GET /tasks/{runId} — poll until terminal. */
  getTask(runId: string): Promise<LocalComputeTaskRecord> {
    return this.request<LocalComputeTaskRecord>(taskUrl(this.baseUrl, runId), {
      method: 'GET',
      headers: this.authHeaders(),
    });
  }

  /** POST /tasks/{runId}/cancel — exact runId; cancel is terminal. */
  cancelTask(runId: string): Promise<LocalComputeTaskCancelResponse> {
    return this.request<LocalComputeTaskCancelResponse>(taskCancelUrl(this.baseUrl, runId), {
      method: 'POST',
      headers: this.authHeaders(),
    });
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

/** Pick banner copy for the detection page locale (Bot-E helper). */
export function pickClientUiMessageText(
  messages: LocalComputeUiMessage[],
  locale: 'zh' | 'en' = 'zh',
): string | null {
  if (!messages.length) return null;
  const first = messages[0];
  return locale === 'zh' ? first.zh : first.en;
}

/** Factory matching older call sites; prefer `new LocalComputeClient(opts)`. */
export function createLocalComputeClient(opts: LocalComputeClientOptions): LocalComputeClient {
  return new LocalComputeClient(opts);
}

/** Default stub sample range when no real IQ file is loaded (decimal strings). */
export const DEFAULT_DETECT_SAMPLE_RANGE = {
  start: '0',
  end: '1048576',
} as const;
