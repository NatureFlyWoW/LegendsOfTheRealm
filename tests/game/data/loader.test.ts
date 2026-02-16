import { describe, test, expect, beforeEach } from "vitest";
import { loadGameData, resetCache } from "@game/data/loader";

beforeEach(() => resetCache());

describe("loadGameData", () => {
  test("returns GameData with races, classes, and stats", () => {
    const data = loadGameData();
    expect(data.races).toBeDefined();
    expect(data.classes).toBeDefined();
    expect(data.stats).toBeDefined();
  });

  test("races has 6 entries", () => {
    const data = loadGameData();
    expect(data.races).toHaveLength(6);
  });

  test("classes has 8 entries", () => {
    const data = loadGameData();
    expect(data.classes).toHaveLength(8);
  });

  test("stats has health formula", () => {
    const data = loadGameData();
    expect(data.stats.health.staminaMultiplier).toBe(10);
  });

  test("caching: second call returns same object", () => {
    const data1 = loadGameData();
    const data2 = loadGameData();
    expect(data1).toBe(data2);
  });

  test("resetCache forces reload", () => {
    const data1 = loadGameData();
    resetCache();
    const data2 = loadGameData();
    expect(data1).not.toBe(data2);
    expect(data1).toEqual(data2);
  });
});
