// tests/game/combat/attackTable.test.ts
import { describe, it, expect } from "vitest";
import {
  buildAttackTable,
  resolveAttack,
  type AttackTableInput,
} from "@game/combat/attackTable";
import { SeededRng } from "@game/combat/rng";

describe("buildAttackTable", () => {
  it("should return bands that sum to exactly 100%", () => {
    const input: AttackTableInput = {
      hitRating: 0,
      critChance: 5,
      targetDodgeChance: 5,
      targetParryChance: 5,
      targetBlockChance: 10,
      isDualWield: false,
      isSpell: false,
      isBoss: false,
    };

    const table = buildAttackTable(input);
    const sum = table.miss + table.dodge + table.parry + table.block + table.crit + table.hit;

    expect(sum).toBeCloseTo(100, 4);
  });

  it("should have 5% base miss for melee with zero hit rating", () => {
    const input: AttackTableInput = {
      hitRating: 0,
      critChance: 5,
      targetDodgeChance: 0,
      targetParryChance: 0,
      targetBlockChance: 0,
      isDualWield: false,
      isSpell: false,
      isBoss: false,
    };

    const table = buildAttackTable(input);

    expect(table.miss).toBeCloseTo(5, 4);
    expect(table.crit).toBeCloseTo(5, 4);
    expect(table.hit).toBeCloseTo(90, 4);
  });

  it("should add 19% miss for dual-wield attacks", () => {
    const input: AttackTableInput = {
      hitRating: 0,
      critChance: 5,
      targetDodgeChance: 0,
      targetParryChance: 0,
      targetBlockChance: 0,
      isDualWield: true,
      isSpell: false,
      isBoss: false,
    };

    const table = buildAttackTable(input);

    expect(table.miss).toBeCloseTo(24, 4);
  });

  it("should reduce miss chance with hit rating (12.5 rating = 1%)", () => {
    const input: AttackTableInput = {
      hitRating: 62.5, // 5% hit
      critChance: 5,
      targetDodgeChance: 0,
      targetParryChance: 0,
      targetBlockChance: 0,
      isDualWield: false,
      isSpell: false,
      isBoss: false,
    };

    const table = buildAttackTable(input);

    expect(table.miss).toBeCloseTo(0, 4);
    expect(table.crit).toBeCloseTo(5, 4);
    expect(table.hit).toBeCloseTo(95, 4);
  });

  it("should reduce crit chance by 4.8% against bosses (crit suppression)", () => {
    const input: AttackTableInput = {
      hitRating: 62.5,
      critChance: 20,
      targetDodgeChance: 0,
      targetParryChance: 0,
      targetBlockChance: 0,
      isDualWield: false,
      isSpell: false,
      isBoss: true,
    };

    const table = buildAttackTable(input);

    expect(table.crit).toBeCloseTo(15.2, 4); // 20 - 4.8
  });

  it("should push crit off the table when avoidance is high", () => {
    const input: AttackTableInput = {
      hitRating: 0,
      critChance: 25,
      targetDodgeChance: 30,
      targetParryChance: 20,
      targetBlockChance: 15,
      isDualWield: false,
      isSpell: false,
      isBoss: false,
    };

    const table = buildAttackTable(input);

    // Miss 5% + Dodge 30% + Parry 20% + Block 15% = 70%
    // Only 30% left for crit + hit
    // Crit pushes off first if space is insufficient
    expect(table.miss).toBeCloseTo(5, 4);
    expect(table.dodge).toBeCloseTo(30, 4);
    expect(table.parry).toBeCloseTo(20, 4);
    expect(table.block).toBeCloseTo(15, 4);
    expect(table.crit).toBeCloseTo(25, 4);
    expect(table.hit).toBeCloseTo(5, 4);
  });

  it("should push off hit and then crit when avoidance exceeds available space", () => {
    const input: AttackTableInput = {
      hitRating: 0,
      critChance: 25,
      targetDodgeChance: 40,
      targetParryChance: 30,
      targetBlockChance: 20,
      isDualWield: false,
      isSpell: false,
      isBoss: false,
    };

    const table = buildAttackTable(input);

    // Miss 5% + Dodge 40% + Parry 30% + Block 20% = 95%
    // Only 5% left for crit + hit
    // Hit goes to 0 first, then crit gets reduced
    expect(table.miss).toBeCloseTo(5, 4);
    expect(table.dodge).toBeCloseTo(40, 4);
    expect(table.parry).toBeCloseTo(30, 4);
    expect(table.block).toBeCloseTo(20, 4);
    expect(table.crit).toBeCloseTo(5, 4);
    expect(table.hit).toBeCloseTo(0, 4);
  });

  it("should build spell table with only miss/crit/hit (no dodge/parry/block)", () => {
    const input: AttackTableInput = {
      hitRating: 0,
      critChance: 15,
      targetDodgeChance: 20,
      targetParryChance: 15,
      targetBlockChance: 10,
      isDualWield: false,
      isSpell: true,
      isBoss: false,
    };

    const table = buildAttackTable(input);

    expect(table.dodge).toBe(0);
    expect(table.parry).toBe(0);
    expect(table.block).toBe(0);
    expect(table.miss).toBeCloseTo(6, 4); // Spells have 6% base miss
    expect(table.crit).toBeCloseTo(15, 4);
    expect(table.hit).toBeCloseTo(79, 4);
  });

  it("should cap hit rating to not go below 0% miss", () => {
    const input: AttackTableInput = {
      hitRating: 200, // Way more than needed
      critChance: 20,
      targetDodgeChance: 0,
      targetParryChance: 0,
      targetBlockChance: 0,
      isDualWield: false,
      isSpell: false,
      isBoss: false,
    };

    const table = buildAttackTable(input);

    expect(table.miss).toBeCloseTo(0, 4);
    expect(table.crit).toBeCloseTo(20, 4);
    expect(table.hit).toBeCloseTo(80, 4);
  });
});

describe("resolveAttack", () => {
  it("should resolve attacks according to table percentages over many rolls", () => {
    const table = {
      miss: 10,
      dodge: 10,
      parry: 10,
      block: 10,
      crit: 20,
      hit: 40,
    };

    const rng = new SeededRng(12345);
    const rolls = 10000;
    const counts = {
      miss: 0,
      dodge: 0,
      parry: 0,
      block: 0,
      crit: 0,
      hit: 0,
    };

    for (let i = 0; i < rolls; i++) {
      const result = resolveAttack(table, rng);
      counts[result]++;
    }

    // Check that distributions are within ±2% of expected
    expect(counts.miss / rolls).toBeCloseTo(0.1, 2);
    expect(counts.dodge / rolls).toBeCloseTo(0.1, 2);
    expect(counts.parry / rolls).toBeCloseTo(0.1, 2);
    expect(counts.block / rolls).toBeCloseTo(0.1, 2);
    expect(counts.crit / rolls).toBeCloseTo(0.2, 2);
    expect(counts.hit / rolls).toBeCloseTo(0.4, 2);
  });

  it("should produce deterministic results with same rng seed", () => {
    const table = {
      miss: 5,
      dodge: 10,
      parry: 10,
      block: 15,
      crit: 25,
      hit: 35,
    };

    const rng1 = new SeededRng(99999);
    const rng2 = new SeededRng(99999);

    const results1: string[] = [];
    const results2: string[] = [];

    for (let i = 0; i < 100; i++) {
      results1.push(resolveAttack(table, rng1));
      results2.push(resolveAttack(table, rng2));
    }

    expect(results1).toEqual(results2);
  });

  it("should handle edge case with 100% miss", () => {
    const table = {
      miss: 100,
      dodge: 0,
      parry: 0,
      block: 0,
      crit: 0,
      hit: 0,
    };

    const rng = new SeededRng(123);

    for (let i = 0; i < 20; i++) {
      expect(resolveAttack(table, rng)).toBe("miss");
    }
  });

  it("should handle edge case with 100% crit", () => {
    const table = {
      miss: 0,
      dodge: 0,
      parry: 0,
      block: 0,
      crit: 100,
      hit: 0,
    };

    const rng = new SeededRng(456);

    for (let i = 0; i < 20; i++) {
      expect(resolveAttack(table, rng)).toBe("crit");
    }
  });
});
