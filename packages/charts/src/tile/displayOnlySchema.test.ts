/**
 * C-02: JSON that proves display-only — assertable forbidden keys.
 */
import { describe, expect, it } from "vitest";
import {
  assertDisplayOnlyExtract,
  extractDisplayGrid,
  extractViewportTile,
  FORBIDDEN_DISPLAY_EXTRACT_KEYS,
  type DisplayExtractResult,
} from "./displayExtract.js";

const FORBIDDEN_JSON_KEYS = [
  "hz", "freqHz", "frequencyHz", "frequency", "markerId", "marker", "markers",
  "detectionId", "detection", "detections", "timeSec", "sampleIndex", "businessCoords",
] as const;

function toJsonSchema(result: DisplayExtractResult): Record<string, unknown> {
  return JSON.parse(
    JSON.stringify({
      width: result.width,
      height: result.height,
      displayOnly: result.displayOnly,
      reduce: result.reduce,
      extractMs: result.extractMs,
      sourceWindow: result.sourceWindow,
      dataLength: result.data.length,
      dataPeak: Math.max(...result.data),
    }),
  ) as Record<string, unknown>;
}

describe("C-02 display-only extract JSON schema", () => {
  it("serialized extract has displayOnly:true and no forbidden keys", () => {
    const source = new Float32Array(64);
    source[10] = 3.5;
    const result = extractDisplayGrid({
      source,
      sourceWidth: 8,
      sourceHeight: 8,
      srcX: 0,
      srcY: 0,
      srcW: 8,
      srcH: 8,
      outW: 4,
      outH: 4,
      reduce: "peak",
    });
    assertDisplayOnlyExtract(result);
    const json = toJsonSchema(result);
    expect(json.displayOnly).toBe(true);
    expect(json).toHaveProperty("sourceWindow");
    expect(json).toHaveProperty("dataLength");
    for (const key of FORBIDDEN_JSON_KEYS) expect(json).not.toHaveProperty(key);
    for (const key of FORBIDDEN_DISPLAY_EXTRACT_KEYS) expect(result).not.toHaveProperty(key);
  });

  it("viewport tile JSON also forbids hz/markerId/detectionId", () => {
    const source = new Float32Array(100);
    const result = extractViewportTile({
      source,
      sourceWidth: 10,
      sourceHeight: 10,
      plotCssWidth: 200,
      plotCssHeight: 100,
      viewCssX: 20,
      viewCssY: 10,
      viewCssW: 80,
      viewCssH: 40,
      outW: 8,
      outH: 4,
    });
    const json = toJsonSchema(result);
    expect(json.displayOnly).toBe(true);
    expect(Object.keys(json).sort()).toEqual(
      ["dataLength", "dataPeak", "displayOnly", "extractMs", "height", "reduce", "sourceWindow", "width"].sort(),
    );
    for (const key of ["hz", "markerId", "detectionId"] as const) {
      expect(json).not.toHaveProperty(key);
    }
  });
});
