// tests/renderer/ascii/Palette.test.ts
import { describe, test, expect } from "vitest";
import { ANSI_COLORS, getQualityColor, ANSIColor } from "@renderer/ascii/Palette";

describe("ANSI Color Palette", () => {
  test("has 16 color entries", () => {
    expect(ANSI_COLORS).toHaveLength(16);
  });

  test("black is [0,0,0]", () => {
    expect(ANSI_COLORS[ANSIColor.Black]).toEqual([0, 0, 0]);
  });

  test("bright white is [255,255,255]", () => {
    expect(ANSI_COLORS[ANSIColor.BrightWhite]).toEqual([255, 255, 255]);
  });

  test("red is correct", () => {
    expect(ANSI_COLORS[ANSIColor.Red]).toEqual([170, 0, 0]);
  });
});

describe("Quality color mapping", () => {
  test("common maps to white", () => {
    expect(getQualityColor("common")).toBe(ANSIColor.White);
  });

  test("uncommon maps to green", () => {
    expect(getQualityColor("uncommon")).toBe(ANSIColor.Green);
  });

  test("rare maps to bright blue", () => {
    expect(getQualityColor("rare")).toBe(ANSIColor.BrightBlue);
  });

  test("epic maps to bright magenta", () => {
    expect(getQualityColor("epic")).toBe(ANSIColor.BrightMagenta);
  });

  test("legendary maps to bright yellow", () => {
    expect(getQualityColor("legendary")).toBe(ANSIColor.BrightYellow);
  });
});
