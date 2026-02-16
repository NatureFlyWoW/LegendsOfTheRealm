import { describe, it, expect } from "vitest";
import xpCurves from "@game/data/content/xp-curves.json";

describe("xp-curves.json", () => {
  it("has xpPerLevel array with 59 entries", () => {
    expect(xpCurves.xpPerLevel).toBeDefined();
    expect(xpCurves.xpPerLevel).toHaveLength(59);
  });

  it("XP values are monotonically increasing", () => {
    for (let i = 1; i < xpCurves.xpPerLevel.length; i++) {
      expect(xpCurves.xpPerLevel[i]).toBeGreaterThan(xpCurves.xpPerLevel[i - 1]);
    }
  });

  it("level 1→2 requires 1000 XP", () => {
    expect(xpCurves.xpPerLevel[0]).toBe(1000);
  });

  it("level 10→11 matches formula", () => {
    const expected = Math.round(1000 * Math.pow(10, 2.4));
    expect(xpCurves.xpPerLevel[9]).toBe(expected);
  });

  it("level 59→60 matches formula", () => {
    const expected = Math.round(1000 * Math.pow(59, 2.4));
    expect(xpCurves.xpPerLevel[58]).toBe(expected);
  });

  it("all values are positive integers", () => {
    for (const xp of xpCurves.xpPerLevel) {
      expect(xp).toBeGreaterThan(0);
      expect(Number.isInteger(xp)).toBe(true);
    }
  });
});
