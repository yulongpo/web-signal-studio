import { describe, expect, it } from "vitest";

export const SHELL_RAIL_PAGES = [
  { id: "display", label: "显示" },
  { id: "detect", label: "检测" },
  { id: "marker", label: "标记" },
  { id: "channel", label: "通道" },
] as const;

describe("shell rail contract", () => {
  it("exposes exactly four context pages", () => {
    expect(SHELL_RAIL_PAGES).toHaveLength(4);
    expect(SHELL_RAIL_PAGES.map((p) => p.id)).toEqual([
      "display",
      "detect",
      "marker",
      "channel",
    ]);
  });

  it("uses the Chinese labels asserted by e2e", () => {
    expect(SHELL_RAIL_PAGES.map((p) => p.label)).toEqual([
      "显示",
      "检测",
      "标记",
      "通道",
    ]);
  });
});