import { describe, expect, it } from 'vitest';
import {
  DEFAULT_KAISER_BETA,
  PROJECT_SCHEMA,
  PROJECT_WRITE_VERSION,
  type ProjectDocumentJson,
} from '@wss/contracts';
import { serializeProjectJson } from './save-project.js';
import { parseProjectJson } from './load-project.js';
import {
  SPECTRAL_SETTINGS_JSON_KEY,
  DESKTOP_SPECTROGRAM_SETTINGS_KEY,
  applySpectralChromePrefsToProject,
  chromePrefsFromSpectralSettings,
  decodeSpectralSettingsJson,
  defaultSpectralChromePrefs,
  encodeDesktopSpectrogramSettings,
  encodeSpectralSettingsJson,
  readSpectralChromePrefsFromFile,
  readSpectralSettingsFromFile,
  spectralSettingsFromChromePrefs,
  writeSpectralChromePrefsToFile,
} from './spectral-settings-json.js';

function demoDoc(): ProjectDocumentJson {
  return {
    schema: PROJECT_SCHEMA,
    version: PROJECT_WRITE_VERSION,
    name: 'a5-spectral',
    activeFileId: 'f1',
    files: [
      {
        metadata: {
          id: 'f1',
          name: 'demo.iq',
          path: 'demo.iq',
          sampleRateHz: 20e6,
          centerFrequencyHz: 1e9,
          sampleCount: '1000',
        },
      },
    ],
  };
}

describe('A5 spectral_settings_json persistence', () => {
  it('roundtrips chrome prefs through file.display and project JSON', () => {
    const prefs = {
      ...defaultSpectralChromePrefs(),
      stftWindowPref: 'kaiser' as const,
      stftOverlapPref: 0.5,
      stftSegmentMsPref: 10,
      stftKaiserBetaPref: 9.1,
      stftAutoNbPref: false,
      stftRemoveMeanPref: true,
      stftN: 2048,
    };
    const doc = applySpectralChromePrefsToProject(demoDoc(), prefs);
    const file = doc.files[0]!;
    expect(file.display?.[SPECTRAL_SETTINGS_JSON_KEY]).toMatchObject({
      window: 'kaiser',
      overlap: 0.5,
      segmentMilliseconds: 10,
      kaiserBeta: 9.1,
      removeMean: true,
      autoNb: false,
    });
    expect(file.display?.[DESKTOP_SPECTROGRAM_SETTINGS_KEY]).toMatchObject({
      window: 6,
      segmentMilliseconds: 10,
      removeMean: true,
      method: 2,
    });
    expect(file.display?.stftSize).toBe(2048);

    const text = serializeProjectJson(doc);
    const loaded = parseProjectJson(text).document;
    const round = readSpectralChromePrefsFromFile(loaded.files[0]!);
    expect(round).toEqual(prefs);
  });

  it('maps autoNb true to desktop segmentMilliseconds 0 on bridge', () => {
    const settings = encodeSpectralSettingsJson({
      window: 'hann',
      overlap: 0.75,
      segmentMilliseconds: 100,
      kaiserBeta: DEFAULT_KAISER_BETA,
      removeMean: false,
      autoNb: true,
    });
    const desktop = encodeDesktopSpectrogramSettings(settings);
    expect(desktop.segmentMilliseconds).toBe(0);
    const back = decodeSpectralSettingsJson(desktop);
    expect(back.autoNb).toBe(true);
    // last fixed pref restored to default when wire was 0 without explicit autoNb+ms
    expect(back.segmentMilliseconds).toBeGreaterThan(0);
  });

  it('decodes desktop int-window spectrogramSettings', () => {
    const s = decodeSpectralSettingsJson({
      method: 2,
      window: 1,
      overlap: 0.5,
      segmentMilliseconds: 0,
      kaiserBeta: 8.6,
      timeBandwidth: 3.5,
      tapers: 6,
      burgOrder: 16,
      removeMean: false,
    });
    expect(s.window).toBe('hann');
    expect(s.autoNb).toBe(true);
  });

  it('chrome prefs <-> settings helpers stay aligned with B names', () => {
    const prefs = defaultSpectralChromePrefs();
    const settings = spectralSettingsFromChromePrefs(prefs);
    expect(chromePrefsFromSpectralSettings(settings, prefs.stftN)).toEqual(prefs);
    const file = writeSpectralChromePrefsToFile(demoDoc().files[0]!, prefs);
    expect(readSpectralSettingsFromFile(file)?.window).toBe('hann');
  });
});
