/**
 * PROVISIONAL — Bot-B local-compute HTTP client (loopback).
 * Sample indexes on the wire are decimal strings only.
 */

import type {
  LocalComputeCapabilities,
  LocalComputeTaskCancelResponse,
  LocalComputeTaskCreateRequest,
  LocalComputeTaskCreateResponse,
  LocalComputeTaskRecord,
} from '@wss/contracts';

export const DEFAULT_LOCAL_COMPUTE_BASE_URL = 'http://127.0.0.1:8765';

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
  baseUrl: string;
  token: string;
  fetchImpl?: typeof fetch;
}

function authHeaders(token: string): HeadersInit {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (token.trim()) {
    headers.Authorization = `Bearer ${token.trim()}`;
  }
  return headers;
}

async function parseJsonSafe(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export function createLocalComputeClient(opts: LocalComputeClientOptions) {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const baseUrl = opts.baseUrl.replace(/\/$/, '');

  async function request<T>(url: string, init?: RequestInit): Promise<T> {
    let res: Response;
    try {
      res = await fetchImpl(url, {
        ...init,
        headers: {
          ...authHeaders(opts.token),
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
    const body = await parseJsonSafe(res);
    if (!res.ok) {
      const detail =
        body && typeof body === 'object' && 'detail' in body
          ? String((body as { detail: unknown }).detail)
          : res.statusText;
      throw new LocalComputeClientError(detail || `HTTP ${res.status}`, res.status, body);
    }
    return body as T;
  }

  return {
    baseUrl,
    getCapabilities: () =>
      request<LocalComputeCapabilities>(capabilitiesUrl(baseUrl), { method: 'GET' }),
    createTask: (body: LocalComputeTaskCreateRequest) =>
      request<LocalComputeTaskCreateResponse>(tasksUrl(baseUrl), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    getTask: (runId: string) =>
      request<LocalComputeTaskRecord>(taskUrl(baseUrl, runId), { method: 'GET' }),
    cancelTask: (runId: string) =>
      request<LocalComputeTaskCancelResponse>(taskCancelUrl(baseUrl, runId), {
        method: 'POST',
      }),
  };
}

export type LocalComputeClient = ReturnType<typeof createLocalComputeClient>;

/** Default stub sample range when no real IQ file is loaded (decimal strings). */
export const DEFAULT_DETECT_SAMPLE_RANGE = {
  start: '0',
  end: '1048576',
} as const;
