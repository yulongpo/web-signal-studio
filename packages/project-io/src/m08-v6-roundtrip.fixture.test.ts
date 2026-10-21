import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  ANNOTATION_SOURCE_KINDS,
  PROJECT_SCHEMA,
  PROJECT_WRITE_VERSION,
  SAMPLE_INDEX_MAX,
  sampleIndexFromDecimal,
} from '@wss/contracts';
import {
  openAnnotationsFromJsonText,
  openProjectFromJsonText,
  readChannelSnapshot,
  saveAnnotationsToJsonText,
  saveProjectToJsonText,
  summarizeLoadedProject,
} from './index.js';

const here = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(here, '..', 'fixtures');

const PAST_SAFE_BEGIN = '9007199254741091'; // (1n<<53n)+99n
const PAST_SAFE_END = '9007199254741992'; // (1n<<53n)+1000n
const UINT64_MAX = '18446744073709551615';

function loadFixtureText(name: string): string {
  return readFileSync(join(fixturesDir, name), 'utf8');
}

/** Stable deep equality after JSON parse (ignores pretty-print whitespace). */
function asJsonValue(text: string): unknown {
  return JSON.parse(text);
}

describe('M-08 project v6 fixture roundtrip', () => {
  it('loads realistic fixture, identity save/reload, preserves decimal BigInt indexes', () => {
    const originalText = loadFixtureText('v6-realistic-project.json');
    const opened = openProjectFromJsonText(originalText);

    expect(opened.version).toBe(6);
    expect(opened.document.schema).toBe(PROJECT_SCHEMA);
    expect(opened.document.version).toBe(6);
    expect(opened.document.name).toBe('m08-v6-realistic-fixture');

    const file = opened.document.files[0]!;
    expect(typeof file.metadata.sampleCount).toBe('string');
    expect(file.metadata.sampleCount).toBe(UINT64_MAX);
    expect(file.view?.time.begin).toBe('0');
    expect(file.view?.time.end).toBe(PAST_SAFE_BEGIN);
    expect(typeof file.view?.time.end).toBe('string');

    // Number path would lose precision for past-safe indexes
    expect(BigInt(Math.trunc(Number(PAST_SAFE_BEGIN))).toString(10)).not.toBe(PAST_SAFE_BEGIN);
    expect(sampleIndexFromDecimal(file.metadata.sampleCount)).toBe(SAMPLE_INDEX_MAX);
    expect(sampleIndexFromDecimal(file.view!.time.end)).toBe((1n << 53n) + 99n);

    expect(file.channels).toHaveLength(2);
    const algoCh = file.channels![0]!;
    const snap = readChannelSnapshot(algoCh, opened.version);
    expect(snap).toBeDefined();
    expect(snap!.sourceKind).toBe('Algorithm');
    expect(snap!.bindingKind).toBe('LocatedSegment');
    expect(snap!.range.time.begin).toBe((1n << 53n) + 99n);
    expect(snap!.boundRange.time.end).toBe((1n << 53n) + 1000n);
    expect(typeof (algoCh.sourceSnapshot as { range: { time: { begin: unknown } } }).range.time.begin).toBe(
      'string',
    );

    const saved = saveProjectToJsonText(opened.document);
    const reopened = openProjectFromJsonText(saved);
    expect(reopened.document.version).toBe(PROJECT_WRITE_VERSION);
    expect(asJsonValue(saved)).toEqual(asJsonValue(JSON.stringify(opened.document)));

    // Structural equality of the loaded documents (wire fields)
    expect(reopened.document).toEqual({
      ...opened.document,
      version: PROJECT_WRITE_VERSION,
      schema: PROJECT_SCHEMA,
    });

    const summary = summarizeLoadedProject(reopened);
    expect(summary.fileCount).toBe(1);
    expect(summary.files[0]?.sampleCount).toBe(UINT64_MAX);
    expect(typeof summary.files[0]?.sampleCount).toBe('string');
    expect(summary.files[0]?.channelCount).toBe(2);
  });

  it('mutate → save → reload keeps indexes and applies name change', () => {
    const opened = openProjectFromJsonText(loadFixtureText('v6-realistic-project.json'));
    const mutated = {
      ...opened.document,
      name: 'm08-v6-realistic-fixture-mutated',
      activeChannelId: 'ch-nb-manual-1',
    };
    const saved = saveProjectToJsonText(mutated);
    const reopened = openProjectFromJsonText(saved);
    expect(reopened.document.name).toBe('m08-v6-realistic-fixture-mutated');
    expect(reopened.document.activeChannelId).toBe('ch-nb-manual-1');
    expect(reopened.document.files[0]?.metadata.sampleCount).toBe(UINT64_MAX);
    expect(reopened.document.files[0]?.view?.time.end).toBe(PAST_SAFE_BEGIN);

    const manual = reopened.document.files[0]!.channels![1]!;
    const snap = readChannelSnapshot(manual, reopened.version)!;
    expect(snap.sourceKind).toBe('Manual');
    expect(snap.range.time.end).toBe((1n << 53n) + 99n);
    expect(snap.boundRange.time.begin).toBe(1000n);
  });

  it('double roundtrip is idempotent (pretty serialize stable)', () => {
    const opened = openProjectFromJsonText(loadFixtureText('v6-realistic-project.json'));
    const once = saveProjectToJsonText(opened.document);
    const twice = saveProjectToJsonText(openProjectFromJsonText(once).document);
    expect(twice).toBe(once);
  });
});

describe('M-08 annotations fixture roundtrip (three sources)', () => {
  it('round-trips ImportedLabel / Manual / Algorithm with past-safe start/end strings', () => {
    const originalText = loadFixtureText('v6-annotations-three-sources.json');
    const doc = openAnnotationsFromJsonText(originalText);

    expect(doc.schema).toBe('signalstudio-annotations-v1');
    expect(doc.sourceSets.map((s) => s.sourceKind)).toEqual([...ANNOTATION_SOURCE_KINDS]);
    expect(doc.annotations).toHaveLength(3);

    const manual = doc.annotations.find((a) => a.id === 'ann-manual-1')!;
    const algo = doc.annotations.find((a) => a.id === 'ann-algo-1')!;
    expect(manual.start).toBe('1000');
    expect(manual.end).toBe(PAST_SAFE_BEGIN);
    expect(typeof manual.end).toBe('string');
    expect(algo.start).toBe(PAST_SAFE_BEGIN);
    expect(algo.end).toBe(PAST_SAFE_END);
    expect(algo.segments?.[0]?.start).toBe(PAST_SAFE_BEGIN);
    expect(typeof algo.segments?.[0]?.end).toBe('string');

    const saved = saveAnnotationsToJsonText(doc);
    const reopened = openAnnotationsFromJsonText(saved);
    expect(reopened).toEqual(doc);
    expect(asJsonValue(saved)).toEqual(asJsonValue(JSON.stringify(doc)));

    const again = saveAnnotationsToJsonText(reopened);
    expect(again).toBe(saved);
  });
});
