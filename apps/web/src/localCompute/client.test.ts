import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LOCAL_COMPUTE_BASE_URL,
  LocalComputeClient,
  assertLoopback,
  capabilitiesUrl,
  resolveLocalComputeBaseUrl,
  taskCancelUrl,
  taskUrl,
  tasksUrl,
} from './client';

describe('localCompute URL builders', () => {
  it('defaults to loopback 8000 and strips trailing slash', () => {
    expect(DEFAULT_LOCAL_COMPUTE_BASE_URL).toBe('http://127.0.0.1:8000');
    expect(resolveLocalComputeBaseUrl(null, null)).toBe(DEFAULT_LOCAL_COMPUTE_BASE_URL);
    expect(resolveLocalComputeBaseUrl('http://127.0.0.1:9000/', null)).toBe(
      'http://127.0.0.1:9000',
    );
    expect(resolveLocalComputeBaseUrl(null, ' http://127.0.0.1:1/ ')).toBe(
      'http://127.0.0.1:1',
    );
  });

  it('builds capabilities / tasks / cancel paths', () => {
    const base = 'http://127.0.0.1:8000';
    expect(capabilitiesUrl(base)).toBe('http://127.0.0.1:8000/capabilities');
    expect(tasksUrl(base + '/')).toBe('http://127.0.0.1:8000/tasks');
    expect(taskUrl(base, 'abc-1')).toBe('http://127.0.0.1:8000/tasks/abc-1');
    expect(taskCancelUrl(base, 'abc-1')).toBe(
      'http://127.0.0.1:8000/tasks/abc-1/cancel',
    );
  });

  it('assertLoopback rejects non-loopback hosts', () => {
    expect(() => assertLoopback('http://127.0.0.1:8000')).not.toThrow();
    expect(() => assertLoopback('http://localhost:8000')).not.toThrow();
    expect(() => assertLoopback('http://example.com:8000')).toThrow(/loopback/);
  });
});

describe('LocalComputeClient (Bot-E aligned class)', () => {
  it('GETs capabilities with Bearer token', async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const fetchImpl: typeof fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : input.toString();
      calls.push({ url, init });
      return new Response(JSON.stringify({ protocolVersion: '0.1.0' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };
    const client = new LocalComputeClient({
      baseUrl: 'http://127.0.0.1:8000',
      token: 't0ken',
      fetchImpl,
    });
    await client.getCapabilities();
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('http://127.0.0.1:8000/capabilities');
    const headers = calls[0].init?.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer t0ken');
  });

  it('rejects non-loopback baseUrl in constructor', () => {
    expect(
      () =>
        new LocalComputeClient({
          baseUrl: 'http://10.0.0.1:8000',
          token: 'x',
        }),
    ).toThrow(/loopback/);
  });
});
