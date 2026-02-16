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

  test("abilities has 16 entries", () => {
    const data = loadGameData();
    expect(data.abilities).toHaveLength(16);
  });

  test("items has entries", () => {
    const data = loadGameData();
    expect(data.items.length).toBeGreaterThan(0);
  });

  test("zones has 1 entry", () => {
    const data = loadGameData();
    expect(data.zones).toHaveLength(1);
  });

  test("mobs has 5 entries", () => {
    const data = loadGameData();
    expect(data.mobs).toHaveLength(5);
  });

  test("quests has 5 entries", () => {
    const data = loadGameData();
    expect(data.quests).toHaveLength(5);
  });

  test("lootTables has 6 entries", () => {
    const data = loadGameData();
    expect(data.lootTables).toHaveLength(6);
  });

  test("xpPerLevel has 59 entries", () => {
    const data = loadGameData();
    expect(data.xpPerLevel).toHaveLength(59);
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
