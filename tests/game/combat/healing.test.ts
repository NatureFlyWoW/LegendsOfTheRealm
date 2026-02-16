// tests/game/combat/healing.test.ts
import { describe, it, expect } from "vitest";
import {
  calculateHeal,
  calculateHotTick,
  calculateAbsorb,
  applyHealing,
  type HealInput,
} from "@game/combat/healing";
import { SeededRng } from "@game/combat/rng";

describe("calculateHeal", () => {
  it("should calculate direct heal with spell power scaling", () => {
    const input: HealInput = {
      baseHealMin: 500,
      baseHealMax: 500,
      spellPower: 400,
      coefficient: 0.8,
      isCrit: false,
      critMultiplier: 1.5,
      modifiers: 1.0,
    };

    const rng = new SeededRng(123);
    const heal = calculateHeal(input, rng);

    // Expected: (500 + 400 * 0.8) * 1.0 * 1.0 = 820
    // No variance in healing (unlike damage)
    expect(heal).toBe(820);
  });

  it("should apply 1.5x crit multiplier for heals", () => {
    const input: HealInput = {
      baseHealMin: 600,
      baseHealMax: 600,
      spellPower: 300,
      coefficient: 1.0,
      isCrit: true,
      critMultiplier: 1.5,
      modifiers: 1.0,
    };

    const rng = new SeededRng(456);
    const heal = calculateHeal(input, rng);

    // Expected: (600 + 300) * 1.5 = 1350
    expect(heal).toBe(1350);
  });

  it("should apply modifiers to healing", () => {
    const input: HealInput = {
      baseHealMin: 400,
      baseHealMax: 400,
      spellPower: 200,
      coefficient: 1.0,
      isCrit: false,
      critMultiplier: 1.5,
      modifiers: 1.2,
    };

    const rng = new SeededRng(789);
    const heal = calculateHeal(input, rng);

    // Expected: (400 + 200) * 1.2 = 720
    expect(heal).toBe(720);
  });

  it("should use heal range", () => {
    const input: HealInput = {
      baseHealMin: 300,
      baseHealMax: 500,
      spellPower: 200,
      coefficient: 1.0,
      isCrit: false,
      critMultiplier: 1.5,
      modifiers: 1.0,
    };

    const rng = new SeededRng(321);
    const heal = calculateHeal(input, rng);

    // Base should be between 300-500, then add SP contribution
    // Result should be between (300 + 200) = 500 and (500 + 200) = 700
    expect(heal).toBeGreaterThanOrEqual(500);
    expect(heal).toBeLessThanOrEqual(700);
  });

  it("should handle zero spell power", () => {
    const input: HealInput = {
      baseHealMin: 800,
      baseHealMax: 800,
      spellPower: 0,
      coefficient: 1.0,
      isCrit: false,
      critMultiplier: 1.5,
      modifiers: 1.0,
    };

    const rng = new SeededRng(654);
    const heal = calculateHeal(input, rng);

    expect(heal).toBe(800);
  });

  it("should be deterministic with same seed", () => {
    const input: HealInput = {
      baseHealMin: 400,
      baseHealMax: 600,
      spellPower: 250,
      coefficient: 0.9,
      isCrit: false,
      critMultiplier: 1.5,
      modifiers: 1.0,
    };

    const rng1 = new SeededRng(999);
    const rng2 = new SeededRng(999);

    const heal1 = calculateHeal(input, rng1);
    const heal2 = calculateHeal(input, rng2);

    expect(heal1).toBe(heal2);
  });

  it("should apply both crit and modifiers correctly", () => {
    const input: HealInput = {
      baseHealMin: 500,
      baseHealMax: 500,
      spellPower: 300,
      coefficient: 1.0,
      isCrit: true,
      critMultiplier: 1.5,
      modifiers: 1.1,
    };

    const rng = new SeededRng(111);
    const heal = calculateHeal(input, rng);

    // Expected: (500 + 300) * 1.1 * 1.5 = 1320
    expect(heal).toBeCloseTo(1320, 1);
  });
});

describe("calculateHotTick", () => {
  it("should distribute healing evenly across ticks", () => {
    const baseTotalHeal = 2000;
    const spellPower = 400;
    const coefficient = 1.0;
    const numTicks = 5;

    const tickHeal = calculateHotTick(baseTotalHeal, spellPower, coefficient, numTicks);

    // Expected: (2000 + 400) / 5 = 480
    expect(tickHeal).toBe(480);
  });

  it("should scale with spell power", () => {
    const baseTotalHeal = 1200;
    const spellPower = 600;
    const coefficient = 0.5;
    const numTicks = 6;

    const tickHeal = calculateHotTick(baseTotalHeal, spellPower, coefficient, numTicks);

    // Expected: (1200 + 600 * 0.5) / 6 = 1500 / 6 = 250
    expect(tickHeal).toBe(250);
  });

  it("should handle zero spell power", () => {
    const baseTotalHeal = 900;
    const spellPower = 0;
    const coefficient = 1.0;
    const numTicks = 3;

    const tickHeal = calculateHotTick(baseTotalHeal, spellPower, coefficient, numTicks);

    // Expected: 900 / 3 = 300
    expect(tickHeal).toBe(300);
  });

  it("should handle single-tick HoT", () => {
    const baseTotalHeal = 800;
    const spellPower = 200;
    const coefficient = 1.0;
    const numTicks = 1;

    const tickHeal = calculateHotTick(baseTotalHeal, spellPower, coefficient, numTicks);

    // Expected: (800 + 200) / 1 = 1000
    expect(tickHeal).toBe(1000);
  });
});

describe("calculateAbsorb", () => {
  it("should calculate absorb shield with spell power scaling", () => {
    const baseAbsorb = 1000;
    const spellPower = 500;
    const coefficient = 0.8;

    const absorb = calculateAbsorb(baseAbsorb, spellPower, coefficient);

    // Expected: 1000 + 500 * 0.8 = 1400
    expect(absorb).toBe(1400);
  });

  it("should handle zero spell power", () => {
    const baseAbsorb = 1200;
    const spellPower = 0;
    const coefficient = 1.0;

    const absorb = calculateAbsorb(baseAbsorb, spellPower, coefficient);

    expect(absorb).toBe(1200);
  });

  it("should scale with coefficient", () => {
    const baseAbsorb = 800;
    const spellPower = 600;
    const coefficient = 0.5;

    const absorb = calculateAbsorb(baseAbsorb, spellPower, coefficient);

    // Expected: 800 + 600 * 0.5 = 1100
    expect(absorb).toBe(1100);
  });

  it("should handle coefficient of 1.0", () => {
    const baseAbsorb = 500;
    const spellPower = 400;
    const coefficient = 1.0;

    const absorb = calculateAbsorb(baseAbsorb, spellPower, coefficient);

    // Expected: 500 + 400 = 900
    expect(absorb).toBe(900);
  });
});

describe("applyHealing", () => {
  it("should apply partial heal when target not at max HP", () => {
    const healAmount = 500;
    const currentHp = 2000;
    const maxHp = 5000;

    const result = applyHealing(healAmount, currentHp, maxHp);

    expect(result.actual).toBe(500);
    expect(result.overheal).toBe(0);
  });

  it("should apply full heal when result would not exceed max HP", () => {
    const healAmount = 1000;
    const currentHp = 4500;
    const maxHp = 6000;

    const result = applyHealing(healAmount, currentHp, maxHp);

    expect(result.actual).toBe(1000);
    expect(result.overheal).toBe(0);
  });

  it("should cap healing at max HP and track overheal", () => {
    const healAmount = 1500;
    const currentHp = 4000;
    const maxHp = 5000;

    const result = applyHealing(healAmount, currentHp, maxHp);

    // Can only heal 1000 HP (5000 - 4000)
    expect(result.actual).toBe(1000);
    expect(result.overheal).toBe(500);
  });

  it("should show full overheal when target at max HP", () => {
    const healAmount = 800;
    const currentHp = 10000;
    const maxHp = 10000;

    const result = applyHealing(healAmount, currentHp, maxHp);

    expect(result.actual).toBe(0);
    expect(result.overheal).toBe(800);
  });

  it("should handle healing from very low HP", () => {
    const healAmount = 2000;
    const currentHp = 100;
    const maxHp = 5000;

    const result = applyHealing(healAmount, currentHp, maxHp);

    expect(result.actual).toBe(2000);
    expect(result.overheal).toBe(0);
  });

  it("should handle edge case with 1 HP remaining", () => {
    const healAmount = 1000;
    const currentHp = 1;
    const maxHp = 500;

    const result = applyHealing(healAmount, currentHp, maxHp);

    expect(result.actual).toBe(499);
    expect(result.overheal).toBe(501);
  });

  it("should handle exact heal to max HP", () => {
    const healAmount = 3000;
    const currentHp = 2000;
    const maxHp = 5000;

    const result = applyHealing(healAmount, currentHp, maxHp);

    expect(result.actual).toBe(3000);
    expect(result.overheal).toBe(0);
  });

  it("should handle zero heal amount", () => {
    const healAmount = 0;
    const currentHp = 3000;
    const maxHp = 5000;

    const result = applyHealing(healAmount, currentHp, maxHp);

    expect(result.actual).toBe(0);
    expect(result.overheal).toBe(0);
  });
});
