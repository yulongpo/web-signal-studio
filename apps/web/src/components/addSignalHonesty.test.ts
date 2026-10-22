/**
 * Soft source-guard: Add-signal F wire honesty (no PASS).
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(__dirname);

function src(name: string): string {
  return readFileSync(resolve(root, name), 'utf8');
}

describe('Add-signal F wire honesty', () => {
  it('AddSignalDialog stamps browser picker + calls F preview/confirm APIs', () => {
    const t = src('AddSignalDialog.tsx');
    expect(t).toContain('data-testid="add-signal-dialog"');
    expect(t).toContain('data-native-qfiledialog="false"');
    expect(t).toContain('data-g20="browser-picker"');
    expect(t).toContain('data-add-signal="f-wire"');
    expect(t).toContain('listBuiltinFormatTemplates');
    expect(t).toContain('previewSigmfImport');
    expect(t).toContain('describeRawIqWithTemplate');
    expect(t).toContain('importSigmfStream');
    expect(t).toContain('enforceDemoPath: false');
    expect(t).not.toContain('ACCEPTANCE PASS');
  });

  it('MenuBar Add-signal menuitem opens dialog with honesty stamps', () => {
    const t = src('MenuBar.tsx');
    expect(t).toContain("from './AddSignalDialog'");
    expect(t).toContain('data-testid="menu-open-iq" data-native-qfiledialog="false"');
    expect(t).toContain('data-add-signal="f-wire"');
    expect(t).toContain('setAddSignalOpen(true)');
    expect(t).toContain('<AddSignalDialog');
  });
});
