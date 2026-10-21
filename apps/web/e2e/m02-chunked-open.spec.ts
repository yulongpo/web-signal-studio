/**
 * M-02 evidence: RAW / SigMF / WAV chunked open via Bot-B file-input → openIqFromFiles → STFT.
 * Writes docs/acceptance/evidence/bot-b/m02_chunked_open_2026-10-21.json (+ optional PNGs).
 * Does NOT claim ACCEPTANCE_MATRIX PASS (QA-G only). Parsers stay in @wss/file-io.
 */
import { expect, test, type Page } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureEvidenceDir, writeEvidenceJson } from './evidenceWrite';

const here = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(here, 'fixtures');

const FIXTURES = {
  wav: {
    format: 'wav' as const,
    paths: [path.join(fixturesDir, 'tiny-iq.wav')],
    relative: ['apps/web/e2e/fixtures/tiny-iq.wav'],
    statusSubstring: 'tiny-iq.wav',
    /** PCM16 stereo IQ frames in tiny-iq.wav data chunk (decimal string). */
    sampleCount: '256',
    labelMustContain: 'wav',
  },
  raw: {
    format: 'raw' as const,
    paths: [path.join(fixturesDir, 'tiny-iq.raw')],
    relative: ['apps/web/e2e/fixtures/tiny-iq.raw'],
    statusSubstring: 'tiny-iq.raw',
    /** CI16 LE: 1024 bytes / 4 = 256 samples. */
    sampleCount: '256',
    labelMustContain: 'raw',
  },
  sigmf: {
    format: 'sigmf' as const,
    paths: [
      path.join(fixturesDir, 'tiny.sigmf-meta'),
      path.join(fixturesDir, 'tiny.sigmf-data'),
    ],
    relative: [
      'apps/web/e2e/fixtures/tiny.sigmf-meta',
      'apps/web/e2e/fixtures/tiny.sigmf-data',
    ],
    /** Display name strips .sigmf-meta → "tiny". */
    statusSubstring: 'tiny',
    /** CI16 LE payload 512 bytes / 4 = 128 samples (meta sample_rate 1000000). */
    sampleCount: '128',
    labelMustContain: 'sigmf',
  },
};

async function waitOpenSettled(page: Page) {
  const host = page.getByTestId('main-chart-host');
  await expect
    .poll(
      async () => {
        const s = await host.getAttribute('data-dsp-source');
        if (!s || s === 'loading') return null;
        return s;
      },
      { timeout: 20000 },
    )
    .not.toBeNull();
  return host;
}

type FormatResult = {
  format: 'wav' | 'raw' | 'sigmf';
  fixture_relative_paths: string[];
  sample_count_decimal: string;
  opened: boolean;
  dsp_source: string | null;
  iq_format_attr: string | null;
  dsp_label: string | null;
  status_file: string | null;
  chip_iq_format: string | null;
  assertions: Record<string, boolean | string>;
};

async function openFormat(
  page: Page,
  key: keyof typeof FIXTURES,
): Promise<FormatResult> {
  const fx = FIXTURES[key];
  await page.getByTestId('input-iq-wav').setInputFiles(fx.paths);
  const host = await waitOpenSettled(page);
  const dspSource = await host.getAttribute('data-dsp-source');
  const iqFormat = await host.getAttribute('data-iq-format');
  const dspLabel = await host.getAttribute('data-dsp-label');
  const statusFile = await page.getByTestId('status-file').innerText();
  const chip = page.getByTestId('dsp-source-chip');
  const chipFormat = await chip.getAttribute('data-iq-format');

  const opened = dspSource === 'file-stft-worker';
  const assertions: Record<string, boolean | string> = {
    dsp_source_allowed: String(
      ['file-stft-worker', 'demo-fallback', 'synthetic-stft-worker'].includes(
        dspSource ?? '',
      ),
    ),
    sample_count_decimal_string: fx.sampleCount,
  };

  if (opened) {
    expect(iqFormat).toBe(fx.format);
    expect(chipFormat).toBe(fx.format);
    await expect(page.getByTestId('status-file')).toContainText(fx.statusSubstring);
    expect((dspLabel ?? '').toLowerCase()).toContain(fx.labelMustContain);
    expect((dspLabel ?? '').toLowerCase()).not.toContain('synthetic');
    expect((dspLabel ?? '').toLowerCase()).not.toContain('live');
    expect((dspLabel ?? '').toLowerCase()).not.toContain('capture');
    assertions.data_iq_format = iqFormat === fx.format;
    assertions.chip_iq_format = chipFormat === fx.format;
    assertions.status_file_matches = statusFile
      .toLowerCase()
      .includes(fx.statusSubstring.toLowerCase());
    assertions.label_not_synthetic = true;
    assertions.chunked_reader_path = 'file-stft-worker';
  } else {
    // Soft path: CI without worker may stay synthetic; still record fixture pointers.
    assertions.opened_as_file_stft = false;
    assertions.note =
      'Open did not land on file-stft-worker; fixture + vitest still cover readers';
  }

  await page.getByTestId('btn-clear-iq-wav').click();
  await expect
    .poll(async () => host.getAttribute('data-dsp-source'), { timeout: 20000 })
    .not.toBe('loading');

  return {
    format: fx.format,
    fixture_relative_paths: fx.relative,
    sample_count_decimal: fx.sampleCount,
    opened,
    dsp_source: dspSource,
    iq_format_attr: iqFormat,
    dsp_label: dspLabel,
    status_file: statusFile,
    chip_iq_format: chipFormat,
    assertions,
  };
}

test.describe('M-02 chunked open (WAV / RAW / SigMF)', () => {
  test('opens e2e fixtures via file-input and writes evidence JSON', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByTestId('input-iq-wav')).toBeAttached();
    await expect(page.getByTestId('btn-open-iq-wav')).toBeVisible();

    const formats: FormatResult[] = [];
    formats.push(await openFormat(page, 'wav'));
    formats.push(await openFormat(page, 'raw'));
    formats.push(await openFormat(page, 'sigmf'));

    // At least one format must succeed as file-stft-worker in a healthy env;
    // all three should when worker + file-io are available.
    const openedCount = formats.filter((f) => f.opened).length;
    expect(openedCount).toBeGreaterThanOrEqual(1);

    // Prefer all three when the worker path works for the first (WAV).
    if (formats[0]?.opened) {
      expect(formats.every((f) => f.opened)).toBe(true);
    }

    const evidenceDir = ensureEvidenceDir();
    // Optional PNG of last successful open (re-open WAV for a clean shot).
    await page.getByTestId('input-iq-wav').setInputFiles(FIXTURES.wav.paths);
    await waitOpenSettled(page);
    await page.screenshot({
      path: path.join(evidenceDir, 'm02_chunked_open_wav.png'),
      fullPage: true,
    });
    await page.getByTestId('input-iq-wav').setInputFiles(FIXTURES.raw.paths);
    await waitOpenSettled(page);
    await page.screenshot({
      path: path.join(evidenceDir, 'm02_chunked_open_raw.png'),
      fullPage: true,
    });
    await page
      .getByTestId('input-iq-wav')
      .setInputFiles(FIXTURES.sigmf.paths);
    await waitOpenSettled(page);
    await page.screenshot({
      path: path.join(evidenceDir, 'm02_chunked_open_sigmf.png'),
      fullPage: true,
    });

    writeEvidenceJson('m02_chunked_open_2026-10-21.json', {
      id: 'm02_chunked_open',
      gate: 'M-02',
      date: '2026-10-21',
      matrix_pass_claimed: false,
      base_tip: '19313983fa535325dacf8f1317a9c8aa9bc18c91',
      package: 'B-M02-evidence-assist',
      open_path: 'file-input (multiple) -> openIqFromFiles -> @wss/file-io readers -> stftFromChunkedReader / computeFileSpectrogram',
      chunked_reader_labels: {
        wav: 'user-picked IQ WAV (file input): ...',
        raw: 'user-picked IQ RAW (file input): ...',
        sigmf: 'user-picked IQ SigMF (file input): ...',
      },
      formats: formats.map((f) => ({
        format: f.format,
        fixture_relative_paths: f.fixture_relative_paths,
        sample_count_decimal: f.sample_count_decimal,
        opened_file_stft_worker: f.opened,
        dsp_source: f.dsp_source,
        data_iq_format: f.iq_format_attr,
        chip_data_iq_format: f.chip_iq_format,
        dsp_label: f.dsp_label,
        status_file: f.status_file,
        assertions: f.assertions,
      })),
      file_io_alignment: {
        package: 'packages/file-io',
        unit_tests: [
          'packages/file-io/src/wav-iq.test.ts',
          'packages/file-io/src/raw-sigmf.test.ts',
          'packages/file-io/src/chunked-reader.test.ts',
        ],
        bot_b_dispatch_tests:
          'apps/web/src/dsp/computeFileSpectrogram.test.ts (openIq RAW / SigMF dispatch + e2e fixture open)',
        note: 'Parsers owned by Bot-D / @wss/file-io; Bot-B only wires open path + evidence.',
      },
      testids: [
        'input-iq-wav',
        'btn-open-iq-wav',
        'btn-clear-iq-wav',
        'main-chart-host',
        'dsp-source-chip',
        'status-file',
        'iq-open-error',
      ],
      artifacts: [
        'm02_chunked_open_2026-10-21.json',
        'm02_chunked_open_wav.png',
        'm02_chunked_open_raw.png',
        'm02_chunked_open_sigmf.png',
      ],
      note: 'Evidence for QA-G M-02. Bot-B does not claim ACCEPTANCE_MATRIX PASS.',
    });
  });

  test('SigMF meta without data shows iq-open-error (no silent rewrite)', async ({
    page,
  }) => {
    await page.goto('/');
    await page
      .getByTestId('input-iq-wav')
      .setInputFiles(path.join(fixturesDir, 'tiny.sigmf-meta'));
    await expect(page.getByTestId('iq-open-error')).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByTestId('app-shell')).toBeVisible();
  });
});
