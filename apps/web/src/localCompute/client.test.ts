import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LOCAL_COMPUTE_BASE_URL,
  capabilitiesUrl,
  resolveLocalComputeBaseUrl,
  taskCancelUrl,
  taskUrl,
  tasksUrl,
} from './client';

describe('localCompute URL builders', () => {
  it('defaults to loopback 8765 and strips trailing slash', () => {
    expect(resolveLocalComputeBaseUrl(null, null)).toBe(DEFAULT_LOCAL_COMPUTE_BASE_URL);
    expect(resolveLocalComputeBaseUrl('http://127.0.0.1:9000/', null)).toBe(
      'http://127.0.0.1:9000',
    );
    expect(resolveLocalComputeBaseUrl(null, ' http://127.0.0.1:1/ ')).toBe(
      'http://127.0.0.1:1',
    );
  });

  it('builds capabilities / tasks / cancel paths', () => {
    const base = 'http://127.0.0.1:8765';
    expect(capabilitiesUrl(base)).toBe('http://127.0.0.1:8765/capabilities');
    expect(tasksUrl(base + '/')).toBe('http://127.0.0.1:8765/tasks');
    expect(taskUrl(base, 'abc-1')).toBe('http://127.0.0.1:8765/tasks/abc-1');
    expect(taskCancelUrl(base, 'abc-1')).toBe(
      'http://127.0.0.1:8765/tasks/abc-1/cancel',
    );
  });
});
