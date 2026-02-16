// tests/game/combat/damage.test.ts
import { describe, it, expect } from "vitest";
import {
  calculatePhysicalDamage,
  calculateSpellDamage,
  calculateDotTick,
  calculateAutoAttack,
  type PhysicalDamageInput,
  type SpellDamageInput,
} from "@game/combat/damage";
import { SeededRng } from "@game/combat/rng";

describe("calculatePhysicalDamage", () => {
  it("should calculate physical damage with 0 armor (full damage)", () => {
    const input: PhysicalDamageInput = {
      weaponDamageMin: 100,
      weaponDamageMax: 100,
      weaponSpeed: 2.0,
      attackPower: 140,
      coefficient: 1.0,
      armorMitigation: 0,
      critMultiplier: 2.0,
      isCrit: false,
      modifiers: 1.0,
    };

    const rng = new SeededRng(123);
    const damage = calculatePhysicalDamage(input, rng);

    // Expected: (100 + (140 / 14) * 2.0) * 1.0 * 1.0 * (1 - 0) * 1.0 * variance
    // = (100 + 10 * 2.0) * 1.0 = 120 * variance
    // variance is 0.95-1.05, so damage should be ~114-126
    expect(damage).toBeGreaterThanOrEqual(114);
    expect(damage).toBeLessThanOrEqual(126);
  });

  it("should calculate physical damage with 50% armor mitigation", () => {
    const input: PhysicalDamageInput = {
      weaponDamageMin: 100,
      weaponDamageMax: 100,
      weaponSpeed: 2.0,
      attackPower: 140,
      coefficient: 1.0,
      armorMitigation: 0.5,
      critMultiplier: 2.0,
      isCrit: false,
      modifiers: 1.0,
    };

    const rng = new SeededRng(456);
    const damage = calculatePhysicalDamage(input, rng);

    // Expected: 120 * (1 - 0.5) * variance = 60 * variance
    // variance is 0.95-1.05, so damage should be ~57-63
    expect(damage).toBeGreaterThanOrEqual(57);
    expect(damage).toBeLessThanOrEqual(63);
  });

  it("should double physical damage on crit", () => {
    const input: PhysicalDamageInput = {
      weaponDamageMin: 100,
      weaponDamageMax: 100,
      weaponSpeed: 2.0,
      attackPower: 140,
      coefficient: 1.0,
      armorMitigation: 0,
      critMultiplier: 2.0,
      isCrit: true,
      modifiers: 1.0,
    };

    const rng = new SeededRng(789);
    const damage = calculatePhysicalDamage(input, rng);

    // Expected: 120 * 2.0 * variance = 240 * variance
    // variance is 0.95-1.05, so damage should be ~228-252
    expect(damage).toBeGreaterThanOrEqual(228);
    expect(damage).toBeLessThanOrEqual(252);
  });

  it("should apply coefficient to weapon damage calculation", () => {
    const input: PhysicalDamageInput = {
      weaponDamageMin: 100,
      weaponDamageMax: 100,
      weaponSpeed: 2.0,
      attackPower: 140,
      coefficient: 0.5,
      armorMitigation: 0,
      critMultiplier: 2.0,
      isCrit: false,
      modifiers: 1.0,
    };

    const rng = new SeededRng(321);
    const damage = calculatePhysicalDamage(input, rng);

    // Expected: (100 + (140 / 14) * 2.0) * 0.5 * variance
    // = 120 * 0.5 * variance = 60 * variance
    expect(damage).toBeGreaterThanOrEqual(57);
    expect(damage).toBeLessThanOrEqual(63);
  });

  it("should apply modifiers to damage", () => {
    const input: PhysicalDamageInput = {
      weaponDamageMin: 100,
      weaponDamageMax: 100,
      weaponSpeed: 2.0,
      attackPower: 140,
      coefficient: 1.0,
      armorMitigation: 0,
      critMultiplier: 2.0,
      isCrit: false,
      modifiers: 1.2,
    };

    const rng = new SeededRng(654);
    const damage = calculatePhysicalDamage(input, rng);

    // Expected: 120 * 1.2 * variance = 144 * variance
    expect(damage).toBeGreaterThanOrEqual(136.8);
    expect(damage).toBeLessThanOrEqual(151.2);
  });

  it("should use weapon damage range and stay within variance", () => {
    const input: PhysicalDamageInput = {
      weaponDamageMin: 80,
      weaponDamageMax: 120,
      weaponSpeed: 2.5,
      attackPower: 200,
      coefficient: 1.0,
      armorMitigation: 0,
      critMultiplier: 2.0,
      isCrit: false,
      modifiers: 1.0,
    };

    const rng = new SeededRng(999);

    // Test multiple times to verify variance stays in range
    for (let i = 0; i < 100; i++) {
      const damage = calculatePhysicalDamage(input, rng);
      // Max possible: (120 + (200/14) * 2.5) * 1.05 = ~174.17
      // Min possible: (80 + (200/14) * 2.5) * 0.95 = ~111.60
      expect(damage).toBeGreaterThanOrEqual(100);
      expect(damage).toBeLessThanOrEqual(185);
    }
  });

  it("should be deterministic with same rng seed", () => {
    const input: PhysicalDamageInput = {
      weaponDamageMin: 100,
      weaponDamageMax: 100,
      weaponSpeed: 2.0,
      attackPower: 140,
      coefficient: 1.0,
      armorMitigation: 0,
      critMultiplier: 2.0,
      isCrit: false,
      modifiers: 1.0,
    };

    const rng1 = new SeededRng(111);
    const rng2 = new SeededRng(111);

    const damage1 = calculatePhysicalDamage(input, rng1);
    const damage2 = calculatePhysicalDamage(input, rng2);

    expect(damage1).toBe(damage2);
  });
});

describe("calculateSpellDamage", () => {
  it("should calculate spell damage with coefficient", () => {
    const input: SpellDamageInput = {
      baseDamageMin: 200,
      baseDamageMax: 200,
      spellPower: 300,
      coefficient: 1.0,
      isCrit: false,
      critMultiplier: 1.5,
      resistance: 0,
      modifiers: 1.0,
    };

    const rng = new SeededRng(123);
    const damage = calculateSpellDamage(input, rng);

    // Expected: (200 + 300 * 1.0) * 1.0 * 1.0 * (1 - 0) * variance
    // = 500 * variance
    expect(damage).toBeGreaterThanOrEqual(475);
    expect(damage).toBeLessThanOrEqual(525);
  });

  it("should apply spell resistance", () => {
    const input: SpellDamageInput = {
      baseDamageMin: 500,
      baseDamageMax: 500,
      spellPower: 0,
      coefficient: 1.0,
      isCrit: false,
      critMultiplier: 1.5,
      resistance: 0.25,
      modifiers: 1.0,
    };

    const rng = new SeededRng(456);
    const damage = calculateSpellDamage(input, rng);

    // Expected: 500 * (1 - 0.25) * variance = 375 * variance
    expect(damage).toBeGreaterThanOrEqual(356);
    expect(damage).toBeLessThanOrEqual(394);
  });

  it("should apply 1.5x crit multiplier for spells", () => {
    const input: SpellDamageInput = {
      baseDamageMin: 400,
      baseDamageMax: 400,
      spellPower: 200,
      coefficient: 1.0,
      isCrit: true,
      critMultiplier: 1.5,
      resistance: 0,
      modifiers: 1.0,
    };

    const rng = new SeededRng(789);
    const damage = calculateSpellDamage(input, rng);

    // Expected: (400 + 200) * 1.5 * variance = 900 * variance
    expect(damage).toBeGreaterThanOrEqual(855);
    expect(damage).toBeLessThanOrEqual(945);
  });

  it("should scale with partial coefficients", () => {
    const input: SpellDamageInput = {
      baseDamageMin: 300,
      baseDamageMax: 300,
      spellPower: 400,
      coefficient: 0.43,
      isCrit: false,
      critMultiplier: 1.5,
      resistance: 0,
      modifiers: 1.0,
    };

    const rng = new SeededRng(321);
    const damage = calculateSpellDamage(input, rng);

    // Expected: (300 + 400 * 0.43) * variance = 472 * variance
    expect(damage).toBeGreaterThanOrEqual(448);
    expect(damage).toBeLessThanOrEqual(496);
  });

  it("should apply modifiers correctly", () => {
    const input: SpellDamageInput = {
      baseDamageMin: 200,
      baseDamageMax: 200,
      spellPower: 100,
      coefficient: 1.0,
      isCrit: false,
      critMultiplier: 1.5,
      resistance: 0,
      modifiers: 1.15,
    };

    const rng = new SeededRng(654);
    const damage = calculateSpellDamage(input, rng);

    // Expected: (200 + 100) * 1.15 * variance = 345 * variance
    expect(damage).toBeGreaterThanOrEqual(327);
    expect(damage).toBeLessThanOrEqual(363);
  });
});

describe("calculateDotTick", () => {
  it("should distribute damage evenly across ticks", () => {
    const baseTotalDamage = 1000;
    const spellPower = 200;
    const coefficient = 1.0;
    const numTicks = 5;

    const tickDamage = calculateDotTick(baseTotalDamage, spellPower, coefficient, numTicks);

    // Expected: (1000 + 200 * 1.0) / 5 = 1200 / 5 = 240
    expect(tickDamage).toBe(240);
  });

  it("should scale with spell power", () => {
    const baseTotalDamage = 500;
    const spellPower = 500;
    const coefficient = 0.5;
    const numTicks = 4;

    const tickDamage = calculateDotTick(baseTotalDamage, spellPower, coefficient, numTicks);

    // Expected: (500 + 500 * 0.5) / 4 = 750 / 4 = 187.5
    expect(tickDamage).toBe(187.5);
  });

  it("should handle zero spell power", () => {
    const baseTotalDamage = 600;
    const spellPower = 0;
    const coefficient = 1.0;
    const numTicks = 3;

    const tickDamage = calculateDotTick(baseTotalDamage, spellPower, coefficient, numTicks);

    // Expected: 600 / 3 = 200
    expect(tickDamage).toBe(200);
  });

  it("should handle single-tick DoT", () => {
    const baseTotalDamage = 500;
    const spellPower = 100;
    const coefficient = 1.0;
    const numTicks = 1;

    const tickDamage = calculateDotTick(baseTotalDamage, spellPower, coefficient, numTicks);

    // Expected: (500 + 100) / 1 = 600
    expect(tickDamage).toBe(600);
  });
});

describe("calculateAutoAttack", () => {
  it("should calculate auto-attack with weapon damage and AP", () => {
    const rng = new SeededRng(123);
    const damage = calculateAutoAttack(50, 100, 2.0, 280, 0, rng);

    // Expected: weaponDmg (50-100) + (280 / 14) * 2.0 = weaponDmg + 40
    // With 0 armor, result is (weaponDmg + 40) * variance
    // Min: (50 + 40) * 0.95 = 85.5
    // Max: (100 + 40) * 1.05 = 147
    expect(damage).toBeGreaterThanOrEqual(85);
    expect(damage).toBeLessThanOrEqual(148);
  });

  it("should apply armor mitigation to auto-attack", () => {
    const rng = new SeededRng(456);
    const damage = calculateAutoAttack(100, 100, 2.5, 350, 0.5, rng);

    // Expected: (100 + (350 / 14) * 2.5) * (1 - 0.5) * variance
    // = (100 + 62.5) * 0.5 * variance = 81.25 * variance
    expect(damage).toBeGreaterThanOrEqual(77);
    expect(damage).toBeLessThanOrEqual(86);
  });

  it("should handle fast weapons", () => {
    const rng = new SeededRng(789);
    const damage = calculateAutoAttack(30, 50, 1.5, 210, 0, rng);

    // Expected: weaponDmg (30-50) + (210 / 14) * 1.5 = weaponDmg + 22.5
    // Result is (weaponDmg + 22.5) * variance
    expect(damage).toBeGreaterThanOrEqual(49);
    expect(damage).toBeLessThanOrEqual(77);
  });

  it("should handle slow weapons", () => {
    const rng = new SeededRng(321);
    const damage = calculateAutoAttack(150, 200, 3.5, 420, 0, rng);

    // Expected: weaponDmg (150-200) + (420 / 14) * 3.5 = weaponDmg + 105
    // Result is (weaponDmg + 105) * variance
    expect(damage).toBeGreaterThanOrEqual(242);
    expect(damage).toBeLessThanOrEqual(321);
  });

  it("should be deterministic with same seed", () => {
    const rng1 = new SeededRng(999);
    const rng2 = new SeededRng(999);

    const damage1 = calculateAutoAttack(80, 120, 2.0, 300, 0.3, rng1);
    const damage2 = calculateAutoAttack(80, 120, 2.0, 300, 0.3, rng2);

    expect(damage1).toBe(damage2);
  });

  it("should respect variance bounds over many iterations", () => {
    const rng = new SeededRng(555);
    const results: number[] = [];

    for (let i = 0; i < 1000; i++) {
      const damage = calculateAutoAttack(100, 100, 2.0, 280, 0, rng);
      results.push(damage);
    }

    // Base damage: 100 + (280 / 14) * 2.0 = 140
    // With variance 0.95-1.05: 133-147
    const min = Math.min(...results);
    const max = Math.max(...results);

    expect(min).toBeGreaterThanOrEqual(133);
    expect(max).toBeLessThanOrEqual(147);
  });
});
