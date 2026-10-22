import { beforeEach, describe, expect, it } from 'vitest';
import {
  SPECTRAL_SETTINGS_JSON_KEY,
  readSpectralChromePrefsFromFile,
} from '../projectIo';
import { asProjectSessionHook, useUiStore } from './uiStore';

/** A5: open/save wires file.display.spectral_settings_json ↔ chrome prefs. */
describe('A5 spectral_settings_json open/save via uiStore', () => {
  const tinyBase = {
    schema: 'signal-studio-native-project',
    version: 6,
    name: 'a5-web-roundtrip',
    activeFileId: 'file-1',
    files: [
      {
        metadata: {
          id: 'file-1',
          name: 'a5.iq',
          path: 'a5.iq',
          sampleRateHz: 1000000,
          centerFrequencyHz: 915000000,
          sampleCount: '1048576',
        },
        view: {
          time: { begin: '0', end: '1048576' },
          frequency: { lowerHz: 900000000, upperHz: 930000000 },
        },
        display: {
          [SPECTRAL_SETTINGS_JSON_KEY]: {
            window: 'hamming',
            overlap: 0.5,
            segmentMilliseconds: 10,
            kaiserBeta: 8.6,
            removeMean: true,
            autoNb: false,
          },
          stftSize: 2048,
        },
      },
    ],
  };

  beforeEach(() => {
    useUiStore.getState().clearProject();
    useUiStore.getState().setStftWindowPref('hann');
    useUiStore.getState().setStftOverlapPref(0.75);
    useUiStore.getState().setStftSegmentMsPref(1);
    useUiStore.getState().setStftKaiserBetaPref(5);
    useUiStore.getState().setStftAutoNbPref(false);
    useUiStore.getState().setStftRemoveMeanPref(false);
    useUiStore.getState().setStftN(1024);
  });

  it('open applies spectral_settings_json to chrome prefs', () => {
    const api = asProjectSessionHook(useUiStore.getState());
    const opened = api.openProjectFromText(JSON.stringify(tinyBase));
    expect(opened.ok).toBe(true);
    const s = useUiStore.getState();
    expect(s.stftWindowPref).toBe('hamming');
    expect(s.stftOverlapPref).toBeCloseTo(0.5, 10);
    expect(s.stftSegmentMsPref).toBe(10);
    expect(s.stftKaiserBetaPref).toBeCloseTo(8.6, 10);
    expect(s.stftRemoveMeanPref).toBe(true);
    expect(s.stftAutoNbPref).toBe(false);
    expect(s.stftN).toBe(2048);
  });

  it('save writes chrome prefs into spectral_settings_json (round-trip)', () => {
    const api = asProjectSessionHook(useUiStore.getState());
    expect(api.openProjectFromText(JSON.stringify(tinyBase)).ok).toBe(true);

    useUiStore.getState().setStftWindowPref('kaiser');
    useUiStore.getState().setStftOverlapPref(0.9);
    useUiStore.getState().setStftSegmentMsPref(100);
    useUiStore.getState().setStftKaiserBetaPref(12);
    useUiStore.getState().setStftRemoveMeanPref(true);
    useUiStore.getState().setStftAutoNbPref(false);
    useUiStore.getState().setStftN(4096);

    const saved = asProjectSessionHook(useUiStore.getState()).saveProjectJsonText();
    expect(saved).toBeTruthy();

    // clear chrome then re-open saved text
    useUiStore.getState().clearProject();
    useUiStore.getState().setStftWindowPref('hann');
    useUiStore.getState().setStftOverlapPref(0.75);
    useUiStore.getState().setStftSegmentMsPref(1);
    useUiStore.getState().setStftKaiserBetaPref(5);
    useUiStore.getState().setStftAutoNbPref(true);
    useUiStore.getState().setStftRemoveMeanPref(false);
    useUiStore.getState().setStftN(256);

    const reopened = asProjectSessionHook(useUiStore.getState()).openProjectFromText(
      saved!,
    );
    expect(reopened.ok).toBe(true);
    const s = useUiStore.getState();
    expect(s.stftWindowPref).toBe('kaiser');
    expect(s.stftOverlapPref).toBeCloseTo(0.9, 10);
    expect(s.stftSegmentMsPref).toBe(100);
    expect(s.stftKaiserBetaPref).toBeCloseTo(12, 10);
    expect(s.stftRemoveMeanPref).toBe(true);
    expect(s.stftAutoNbPref).toBe(false);
    expect(s.stftN).toBe(4096);

    const file = s.projectDocument?.files[0];
    expect(file).toBeTruthy();
    const prefs = readSpectralChromePrefsFromFile(file!);
    expect(prefs?.stftWindowPref).toBe('kaiser');
    expect(prefs?.stftSegmentMsPref).toBe(100);
    expect(prefs?.stftN).toBe(4096);
    expect(file!.display?.[SPECTRAL_SETTINGS_JSON_KEY]).toMatchObject({
      window: 'kaiser',
      overlap: 0.9,
      segmentMilliseconds: 100,
      autoNb: false,
      removeMean: true,
    });
  });
});
