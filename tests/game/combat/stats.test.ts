// tests/game/combat/stats.test.ts
import { describe, test, expect } from "vitest";
import {
  calculateMaxHp,
  calculateMaxMana,
  calculateArmorMitigation,
  ratingToPercentage,
  calculateAttackPower,
  calculateSpellPower,
} from "@game/combat/stats";

describe("HP and Mana", () => {
  test("HP = stamina * 10 + classBaseHp", () => {
    expect(calculateMaxHp(100, 100)).toBe(1100);
    expect(calculateMaxHp(0, 0)).toBe(0);
    expect(calculateMaxHp(500, 200)).toBe(5200);
  });

  test("Mana = intellect * 15 + classBaseMana", () => {
    expect(calculateMaxMana(100, 100)).toBe(1600);
    expect(calculateMaxMana(0, 0)).toBe(0);
    expect(calculateMaxMana(500, 200)).toBe(7700);
  });
});

describe("Armor mitigation", () => {
  test("0 armor = 0% at level 60", () => {
    expect(calculateArmorMitigation(0, 60)).toBeCloseTo(0, 5);
  });

  test("2750 armor = 33.3% at level 60", () => {
    expect(calculateArmorMitigation(2750, 60)).toBeCloseTo(0.333, 2);
  });

  test("5500 armor = 50% at level 60", () => {
    expect(calculateArmorMitigation(5500, 60)).toBeCloseTo(0.5, 5);
  });

  test("11000 armor = 66.7% at level 60", () => {
    expect(calculateArmorMitigation(11000, 60)).toBeCloseTo(0.667, 2);
  });
});

describe("Rating conversions", () => {
  test("22 crit rating = 1% crit", () => {
    expect(ratingToPercentage(22, "critRating")).toBeCloseTo(1.0, 5);
  });

  test("12.5 hit rating = 1% hit", () => {
    expect(ratingToPercentage(12.5, "hitRating")).toBeCloseTo(1.0, 5);
  });

  test("15 haste rating = 1% haste", () => {
    expect(ratingToPercentage(15, "hasteRating")).toBeCloseTo(1.0, 5);
  });

  test("0 rating = 0%", () => {
    expect(ratingToPercentage(0, "critRating")).toBe(0);
  });
});

describe("Attack Power", () => {
  test("strength-based class: AP = strength * 2", () => {
    expect(calculateAttackPower(100, 50, "warrior")).toBe(200);
  });

  test("agility-based class: AP = agility * 2", () => {
    expect(calculateAttackPower(50, 100, "rogue")).toBe(200);
  });
});

describe("Spell Power", () => {
  test("SP from gear only", () => {
    expect(calculateSpellPower(200, 50)).toBe(50);
  });
});
