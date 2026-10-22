/**
 * Chart-area partition honesty: desktop workspaceStack is XOR (BB graphSplitter | NB).
 * matrix_pass_claimed: false — structural gate only.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const appSrc = readFileSync(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../App.tsx'),
  'utf8',
);

describe('BB/NB chart partition (desktop workspaceStack XOR)', () => {
  it('exposes partition attrs and XOR mounts', () => {
    expect(appSrc).toContain("data-chart-partition=");
    expect(appSrc).toContain("'narrowband-only'");
    expect(appSrc).toContain("'broadband-nav-aux-main'");
    expect(appSrc).toContain('data-chart-stack="narrowband"');
    expect(appSrc).toContain('workspace-nb');
  });

  it('narrowband arm mounts only NarrowbandWorkspace (no BB chart hosts)', () => {
    const start = appSrc.indexOf('data-chart-stack="narrowband"');
    expect(start).toBeGreaterThan(0);
    const end = appSrc.indexOf(') : (', start);
    expect(end).toBeGreaterThan(start);
    const nbArm = appSrc.slice(start, end);
    expect(nbArm).toContain('<NarrowbandWorkspace');
    expect(nbArm).not.toContain('<NavChartHost');
    expect(nbArm).not.toContain('<AuxChartHost');
    expect(nbArm).not.toContain('<MainChartHost');
    expect(nbArm).not.toContain('<SpecParamStrip');
  });

  it('broadband fragment keeps nav/aux/main and NarrowbandWorkspace appears once', () => {
    expect(appSrc).toContain('<NavChartHost');
    expect(appSrc).toContain('<AuxChartHost');
    expect(appSrc).toContain('<MainChartHost');
    const matches = appSrc.match(/<NarrowbandWorkspace/g) ?? [];
    expect(matches.length).toBe(1);
  });
});
