// tests/shared/utils.test.ts
import { describe, it, expect } from "vitest";
import { clamp, lerp, formatGold, formatDuration, formatNumber } from "@shared/utils";

describe("clamp", () => {
  it("clamps below min", () => { expect(clamp(-5, 0, 100)).toBe(0); });
  it("clamps above max", () => { expect(clamp(150, 0, 100)).toBe(100); });
  it("returns value when in range", () => { expect(clamp(50, 0, 100)).toBe(50); });
});

describe("lerp", () => {
  it("returns a at t=0", () => { expect(lerp(10, 20, 0)).toBe(10); });
  it("returns b at t=1", () => { expect(lerp(10, 20, 1)).toBe(20); });
  it("returns midpoint at t=0.5", () => { expect(lerp(10, 20, 0.5)).toBe(15); });
});

describe("formatGold", () => {
  it("formats copper only", () => { expect(formatGold(42)).toBe("42c"); });
  it("formats silver and copper", () => { expect(formatGold(1234)).toBe("12s 34c"); });
  it("formats gold, silver, copper", () => { expect(formatGold(123456)).toBe("12g 34s 56c"); });
  it("formats zero", () => { expect(formatGold(0)).toBe("0c"); });
});

describe("formatDuration", () => {
  it("formats seconds", () => { expect(formatDuration(45)).toBe("45 seconds"); });
  it("formats minutes", () => { expect(formatDuration(125)).toBe("2 minutes, 5 seconds"); });
  it("formats hours", () => { expect(formatDuration(3723)).toBe("1 hour, 2 minutes"); });
  it("formats days", () => { expect(formatDuration(90061)).toBe("1 day, 1 hour"); });
});

describe("formatNumber", () => {
  it("formats small numbers", () => { expect(formatNumber(999)).toBe("999"); });
  it("formats thousands", () => { expect(formatNumber(1234)).toBe("1,234"); });
  it("formats millions", () => { expect(formatNumber(1234567)).toBe("1,234,567"); });
});
