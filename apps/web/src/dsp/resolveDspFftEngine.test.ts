import { describe, expect, it } from 'vitest';
import {
  readEngineQueryParam,
  resolveDspFftEngine,
} from './resolveDspFftEngine';

describe('resolveDspFftEngine', () => {
  it('defaults to js', () => {
    expect(resolveDspFftEngine(undefined, '')).toBe('js');
    expect(resolveDspFftEngine('js', '')).toBe('js');
    expect(resolveDspFftEngine(null, '')).toBe('js');
  });

  it('honors store preference wasm-fft when no query', () => {
    expect(resolveDspFftEngine('wasm-fft', '')).toBe('wasm-fft');
  });

  it('URL query wins over preference', () => {
    expect(resolveDspFftEngine('js', '?engine=wasm-fft')).toBe('wasm-fft');
    expect(resolveDspFftEngine('wasm-fft', '?engine=js')).toBe('js');
  });

  it('ignores unknown engine query values', () => {
    expect(readEngineQueryParam('?engine=native')).toBeNull();
    expect(resolveDspFftEngine('js', '?engine=native')).toBe('js');
  });
});
