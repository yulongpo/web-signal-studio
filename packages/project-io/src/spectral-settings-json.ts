/**
 * A5 spectral prefs persistence (ACTIONABLE A5 / desktop spectral_settings_json.h).
 * Landable fields only: window, overlap, segmentMs, kaiserBeta, removeMean, autoNb.
 * Does NOT enable Multitaper / Burg / non-PoT / STFT-DDC (BLOCKED).
 */
import {
  DEFAULT_KAISER_BETA,
  type ProjectFileJson,
  type SpectralWindowName,
} from '@wss/contracts';
import { ProjectIoError } from './load-project.js';

/** Display blob key for web project JSON (CAO A5). */
export const SPECTRAL_SETTINGS_JSON_KEY = 'spectral_settings_json' as const;

/** Desktop project_store DisplaySettings key for spectrogram parameters. */
export const DESKTOP_SPECTROGRAM_SETTINGS_KEY = 'spectrogramSettings' as const;

/** Optional FFT size companion (desktop display.stftSize). */
export const STFT_SIZE_DISPLAY_KEY = 'stftSize' as const;

const WINDOW_NAMES: readonly SpectralWindowName[] = [
  'rectangular',
  'hann',
  'hamming',
  'blackman',
  'blackman_harris',
  'flat_top',
  'kaiser',
] as const;

/** Desktop SpectralWindow enum ordinals (domain/project.h). */
const WINDOW_BY_ORDINAL: readonly SpectralWindowName[] = WINDOW_NAMES;

/**
 * Canonical A5 wire object (string window names for Bot-B uiStore alignment).
 * `segmentMilliseconds` mirrors desktop; `segmentMs` accepted on decode as alias.
 * `autoNb` is explicit (B `stftAutoNbPref`); when true, desktop wire uses segmentMilliseconds=0.
 */
export interface SpectralSettingsJson {
  window: SpectralWindowName;
  overlap: number;
  /** Fixed SegmentMs pref (ms). Meaningful when autoNb is false. */
  segmentMilliseconds: number;
  kaiserBeta: number;
  removeMean: boolean;
  /** Desktop auto N/B (segmentMilliseconds === 0 on native spectrogramSettings). */
  autoNb: boolean;
}

/** Bot-B ChartParamStrip / uiStore chrome prefs (names must stay aligned). */
export interface SpectralChromePrefs {
  stftWindowPref: SpectralWindowName;
  stftOverlapPref: number;
  stftSegmentMsPref: number;
  stftKaiserBetaPref: number;
  stftAutoNbPref: boolean;
  stftRemoveMeanPref: boolean;
  /** Optional; maps to display.stftSize when present. */
  stftN?: number;
}

export function defaultSpectralSettingsJson(): SpectralSettingsJson {
  return {
    window: 'hann',
    overlap: 0.75,
    segmentMilliseconds: 1,
    kaiserBeta: DEFAULT_KAISER_BETA,
    removeMean: false,
    autoNb: false,
  };
}

export function defaultSpectralChromePrefs(): SpectralChromePrefs {
  const s = defaultSpectralSettingsJson();
  return {
    stftWindowPref: s.window,
    stftOverlapPref: s.overlap,
    stftSegmentMsPref: s.segmentMilliseconds,
    stftKaiserBetaPref: s.kaiserBeta,
    stftAutoNbPref: s.autoNb,
    stftRemoveMeanPref: s.removeMean,
    stftN: 1024,
  };
}

function isWindowName(v: unknown): v is SpectralWindowName {
  return typeof v === 'string' && (WINDOW_NAMES as readonly string[]).includes(v);
}

function windowFromWire(raw: unknown): SpectralWindowName {
  if (isWindowName(raw)) return raw;
  if (typeof raw === 'number' && Number.isInteger(raw) && raw >= 0 && raw < WINDOW_BY_ORDINAL.length) {
    return WINDOW_BY_ORDINAL[raw]!;
  }
  throw new ProjectIoError(`spectral_settings_json: invalid window ${JSON.stringify(raw)}`);
}

function requireFinite(name: string, v: unknown): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) {
    throw new ProjectIoError(`spectral_settings_json: invalid ${name}`);
  }
  return v;
}

/**
 * Decode A5 JSON or desktop encodeSpectralParameters object.
 * Ignores BLOCKED fields (method/timeBandwidth/tapers/burgOrder) on read.
 */
export function decodeSpectralSettingsJson(raw: unknown): SpectralSettingsJson {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new ProjectIoError('spectral_settings_json must be an object');
  }
  const o = raw as Record<string, unknown>;
  const window = windowFromWire(o.window);
  const overlap = requireFinite('overlap', o.overlap);
  if (overlap < 0 || overlap >= 1) {
    throw new ProjectIoError(`spectral_settings_json: overlap out of range ${overlap}`);
  }
  const segmentRaw =
    o.segmentMilliseconds !== undefined ? o.segmentMilliseconds : o.segmentMs;
  const segmentMilliseconds = requireFinite('segmentMilliseconds', segmentRaw);
  if (segmentMilliseconds < 0) {
    throw new ProjectIoError('spectral_settings_json: segmentMilliseconds must be >= 0');
  }
  const kaiserBeta = requireFinite('kaiserBeta', o.kaiserBeta);
  if (typeof o.removeMean !== 'boolean') {
    throw new ProjectIoError('spectral_settings_json: removeMean must be boolean');
  }
  let autoNb: boolean;
  if (typeof o.autoNb === 'boolean') {
    autoNb = o.autoNb;
  } else {
    // Desktop spectrogramSettings: 0 => auto N/B
    autoNb = segmentMilliseconds === 0;
  }
  return {
    window,
    overlap,
    // Preserve last fixed ms when autoNb and wire used 0 (B keeps stftSegmentMsPref)
    segmentMilliseconds:
      autoNb && segmentMilliseconds === 0
        ? defaultSpectralSettingsJson().segmentMilliseconds
        : segmentMilliseconds,
    kaiserBeta,
    removeMean: o.removeMean,
    autoNb,
  };
}

/** Encode canonical A5 object (string window; no BLOCKED DSP fields). */
export function encodeSpectralSettingsJson(settings: SpectralSettingsJson): SpectralSettingsJson {
  const window = windowFromWire(settings.window);
  const overlap = requireFinite('overlap', settings.overlap);
  if (overlap < 0 || overlap >= 1) {
    throw new ProjectIoError(`spectral_settings_json: overlap out of range ${overlap}`);
  }
  const segmentMilliseconds = requireFinite(
    'segmentMilliseconds',
    settings.segmentMilliseconds,
  );
  if (segmentMilliseconds < 0) {
    throw new ProjectIoError('spectral_settings_json: segmentMilliseconds must be >= 0');
  }
  const kaiserBeta = requireFinite('kaiserBeta', settings.kaiserBeta);
  if (typeof settings.removeMean !== 'boolean' || typeof settings.autoNb !== 'boolean') {
    throw new ProjectIoError('spectral_settings_json: removeMean/autoNb must be boolean');
  }
  return {
    window,
    overlap,
    segmentMilliseconds,
    kaiserBeta,
    removeMean: settings.removeMean,
    autoNb: settings.autoNb,
  };
}

/**
 * Desktop-compatible spectrogramSettings blob (int window ordinal).
 * autoNb => segmentMilliseconds 0. Does not write Multitaper/Burg compute fields
 * beyond inert defaults required by desktop schema shape when bridging.
 */
export function encodeDesktopSpectrogramSettings(
  settings: SpectralSettingsJson,
): Record<string, unknown> {
  const s = encodeSpectralSettingsJson(settings);
  const windowOrdinal = WINDOW_BY_ORDINAL.indexOf(s.window);
  return {
    method: 2, // SpectralMethod::Welch - only landable web method
    window: windowOrdinal,
    overlap: s.overlap,
    segmentMilliseconds: s.autoNb ? 0 : s.segmentMilliseconds,
    kaiserBeta: s.kaiserBeta,
    timeBandwidth: 3.5,
    tapers: 6,
    burgOrder: 16,
    removeMean: s.removeMean,
  };
}

export function spectralSettingsFromChromePrefs(
  prefs: SpectralChromePrefs,
): SpectralSettingsJson {
  return encodeSpectralSettingsJson({
    window: prefs.stftWindowPref,
    overlap: prefs.stftOverlapPref,
    segmentMilliseconds: prefs.stftSegmentMsPref,
    kaiserBeta: prefs.stftKaiserBetaPref,
    removeMean: prefs.stftRemoveMeanPref,
    autoNb: prefs.stftAutoNbPref,
  });
}

export function chromePrefsFromSpectralSettings(
  settings: SpectralSettingsJson,
  stftN?: number,
): SpectralChromePrefs {
  const s = encodeSpectralSettingsJson(settings);
  const out: SpectralChromePrefs = {
    stftWindowPref: s.window,
    stftOverlapPref: s.overlap,
    stftSegmentMsPref: s.segmentMilliseconds,
    stftKaiserBetaPref: s.kaiserBeta,
    stftAutoNbPref: s.autoNb,
    stftRemoveMeanPref: s.removeMean,
  };
  if (stftN != null && Number.isFinite(stftN)) out.stftN = stftN;
  return out;
}

function asDisplay(file: ProjectFileJson): Record<string, unknown> {
  const d = file.display;
  if (d && typeof d === 'object' && !Array.isArray(d)) {
    return { ...(d as Record<string, unknown>) };
  }
  return {};
}

/** Read prefs from file.display (spectral_settings_json, else desktop spectrogramSettings). */
export function readSpectralSettingsFromFile(
  file: ProjectFileJson,
): SpectralSettingsJson | undefined {
  const display = asDisplay(file);
  if (display[SPECTRAL_SETTINGS_JSON_KEY] != null) {
    return decodeSpectralSettingsJson(display[SPECTRAL_SETTINGS_JSON_KEY]);
  }
  if (display[DESKTOP_SPECTROGRAM_SETTINGS_KEY] != null) {
    return decodeSpectralSettingsJson(display[DESKTOP_SPECTROGRAM_SETTINGS_KEY]);
  }
  return undefined;
}

export function readSpectralChromePrefsFromFile(
  file: ProjectFileJson,
): SpectralChromePrefs | undefined {
  const settings = readSpectralSettingsFromFile(file);
  if (!settings) return undefined;
  const display = asDisplay(file);
  const stftSize = display[STFT_SIZE_DISPLAY_KEY];
  const stftN =
    typeof stftSize === 'number' && Number.isFinite(stftSize) ? stftSize : undefined;
  return chromePrefsFromSpectralSettings(settings, stftN);
}

/**
 * Write A5 spectral_settings_json (+ desktop spectrogramSettings bridge + optional stftSize)
 * into file.display without clobbering unrelated display keys.
 */
export function writeSpectralSettingsToFile(
  file: ProjectFileJson,
  settings: SpectralSettingsJson,
  opts?: { stftN?: number; writeDesktopBridge?: boolean },
): ProjectFileJson {
  const encoded = encodeSpectralSettingsJson(settings);
  const display = asDisplay(file);
  display[SPECTRAL_SETTINGS_JSON_KEY] = encoded;
  if (opts?.writeDesktopBridge !== false) {
    display[DESKTOP_SPECTROGRAM_SETTINGS_KEY] = encodeDesktopSpectrogramSettings(encoded);
  }
  if (opts?.stftN != null && Number.isFinite(opts.stftN)) {
    display[STFT_SIZE_DISPLAY_KEY] = opts.stftN;
  }
  return { ...file, display };
}

export function writeSpectralChromePrefsToFile(
  file: ProjectFileJson,
  prefs: SpectralChromePrefs,
  opts?: { writeDesktopBridge?: boolean },
): ProjectFileJson {
  return writeSpectralSettingsToFile(file, spectralSettingsFromChromePrefs(prefs), {
    stftN: prefs.stftN,
    writeDesktopBridge: opts?.writeDesktopBridge,
  });
}

/** Apply prefs onto the active (or first) file of a project document. */
export function applySpectralChromePrefsToProject<
  T extends { files: ProjectFileJson[]; activeFileId?: string },
>(document: T, prefs: SpectralChromePrefs): T {
  if (!document.files.length) {
    throw new ProjectIoError('applySpectralChromePrefsToProject: project has no files');
  }
  const activeId = document.activeFileId ?? document.files[0]!.metadata.id;
  const files = document.files.map((f) =>
    f.metadata.id === activeId ? writeSpectralChromePrefsToFile(f, prefs) : f,
  );
  return { ...document, files };
}
