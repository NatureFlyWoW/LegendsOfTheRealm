// tests/shared/constants.test.ts
import { describe, it, expect } from "vitest";
import {
  TICK_RATE_MS, MAX_LEVEL, XP_FORMULA_EXPONENT,
  xpToNextLevel, calculateBaseMobXP, getMobXpLevelModifier,
  QUALITY_ILVL_OFFSET, STAT_BUDGET_PER_ILVL,
  COMPANION_THRESHOLDS, OFFLINE_EFFICIENCY,
  RATING_CONVERSIONS,
} from "@shared/constants";

describe("XP formulas", () => {
  it("xpToNextLevel matches design doc at key levels", () => {
    expect(xpToNextLevel(1)).toBe(1000);
    expect(xpToNextLevel(10)).toBe(Math.round(1000 * Math.pow(10, 2.4)));
    expect(xpToNextLevel(59)).toBeGreaterThan(0);
    expect(xpToNextLevel(60)).toBe(0);
  });

  it("calculateBaseMobXP follows MobLevel * 45 + 100", () => {
    expect(calculateBaseMobXP(1)).toBe(145);
    expect(calculateBaseMobXP(10)).toBe(550);
    expect(calculateBaseMobXP(60)).toBe(2800);
  });

  it("level delta modifiers match design doc", () => {
    expect(getMobXpLevelModifier(0)).toBe(1.0);
    expect(getMobXpLevelModifier(-1)).toBe(0.9);
    expect(getMobXpLevelModifier(-2)).toBe(0.75);
    expect(getMobXpLevelModifier(-3)).toBe(0.5);
    expect(getMobXpLevelModifier(-5)).toBe(0.1);
    expect(getMobXpLevelModifier(1)).toBe(1.1);
    expect(getMobXpLevelModifier(4)).toBe(1.4);
  });
});

describe("stat budget", () => {
  it("quality offsets match design doc", () => {
    expect(QUALITY_ILVL_OFFSET.common).toBe(0);
    expect(QUALITY_ILVL_OFFSET.uncommon).toBe(5);
    expect(QUALITY_ILVL_OFFSET.rare).toBe(10);
    expect(QUALITY_ILVL_OFFSET.epic).toBe(20);
    expect(QUALITY_ILVL_OFFSET.legendary).toBe(30);
  });

  it("stat budget is iLvl * 2", () => {
    expect(STAT_BUDGET_PER_ILVL).toBe(2);
  });
});

describe("companion thresholds", () => {
  it("dungeon thresholds: 1 / 10 / 25", () => {
    expect(COMPANION_THRESHOLDS.dungeon.veteran).toBe(1);
    expect(COMPANION_THRESHOLDS.dungeon.elite).toBe(10);
    expect(COMPANION_THRESHOLDS.dungeon.champion).toBe(25);
  });

  it("raid thresholds: 1 / 5 / 15", () => {
    expect(COMPANION_THRESHOLDS.raid.veteran).toBe(1);
    expect(COMPANION_THRESHOLDS.raid.elite).toBe(5);
    expect(COMPANION_THRESHOLDS.raid.champion).toBe(15);
  });
});

describe("offline efficiency penalties", () => {
  it("grinding is 80%", () => {
    expect(OFFLINE_EFFICIENCY.grinding).toBe(0.80);
  });
  it("raids are 0%", () => {
    expect(OFFLINE_EFFICIENCY.raid).toBe(0);
  });
});

describe("rating conversions at level 60", () => {
  it("22 crit rating = 1% crit", () => {
    expect(RATING_CONVERSIONS.critRating).toBe(22);
  });
  it("12.5 hit rating = 1% hit", () => {
    expect(RATING_CONVERSIONS.hitRating).toBe(12.5);
  });
});
