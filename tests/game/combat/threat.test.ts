// tests/game/combat/threat.test.ts
import { describe, it, expect } from "vitest";
import {
  calculateDamageThreat,
  calculateHealingThreat,
  shouldTransferAggro,
  ThreatTable,
  type ThreatModifiers,
} from "@game/combat/threat";

describe("calculateDamageThreat", () => {
  it("should calculate base damage threat with no modifiers", () => {
    const damage = 1000;
    const mods: ThreatModifiers = {
      stanceModifier: 1.0,
      talentModifier: 1.0,
      abilityModifier: 1.0,
    };

    const threat = calculateDamageThreat(damage, mods);

    expect(threat).toBe(1000);
  });

  it("should apply stance modifier (defensive stance)", () => {
    const damage = 500;
    const mods: ThreatModifiers = {
      stanceModifier: 1.3,
      talentModifier: 1.0,
      abilityModifier: 1.0,
    };

    const threat = calculateDamageThreat(damage, mods);

    expect(threat).toBe(650);
  });

  it("should apply talent modifier (threat reduction)", () => {
    const damage = 800;
    const mods: ThreatModifiers = {
      stanceModifier: 1.0,
      talentModifier: 0.7,
      abilityModifier: 1.0,
    };

    const threat = calculateDamageThreat(damage, mods);

    expect(threat).toBe(560);
  });

  it("should apply ability modifier (high-threat ability)", () => {
    const damage = 600;
    const mods: ThreatModifiers = {
      stanceModifier: 1.0,
      talentModifier: 1.0,
      abilityModifier: 1.5,
    };

    const threat = calculateDamageThreat(damage, mods);

    expect(threat).toBe(900);
  });

  it("should apply all modifiers multiplicatively", () => {
    const damage = 1000;
    const mods: ThreatModifiers = {
      stanceModifier: 1.3,
      talentModifier: 0.8,
      abilityModifier: 2.0,
    };

    const threat = calculateDamageThreat(damage, mods);

    // Expected: 1000 * 1.3 * 0.8 * 2.0 = 2080
    expect(threat).toBe(2080);
  });

  it("should handle zero damage", () => {
    const damage = 0;
    const mods: ThreatModifiers = {
      stanceModifier: 1.5,
      talentModifier: 1.0,
      abilityModifier: 2.0,
    };

    const threat = calculateDamageThreat(damage, mods);

    expect(threat).toBe(0);
  });
});

describe("calculateHealingThreat", () => {
  it("should calculate healing threat split among enemies", () => {
    const totalHeal = 2000;
    const enemyCount = 1;

    const threat = calculateHealingThreat(totalHeal, enemyCount);

    // Expected: 2000 * 0.5 / 1 = 1000
    expect(threat).toBe(1000);
  });

  it("should split threat evenly among multiple enemies", () => {
    const totalHeal = 3000;
    const enemyCount = 3;

    const threat = calculateHealingThreat(totalHeal, enemyCount);

    // Expected: 3000 * 0.5 / 3 = 500
    expect(threat).toBe(500);
  });

  it("should apply 0.5x multiplier to healing threat", () => {
    const totalHeal = 1000;
    const enemyCount = 2;

    const threat = calculateHealingThreat(totalHeal, enemyCount);

    // Expected: 1000 * 0.5 / 2 = 250
    expect(threat).toBe(250);
  });

  it("should handle large enemy groups", () => {
    const totalHeal = 5000;
    const enemyCount = 10;

    const threat = calculateHealingThreat(totalHeal, enemyCount);

    // Expected: 5000 * 0.5 / 10 = 250
    expect(threat).toBe(250);
  });

  it("should handle zero healing", () => {
    const totalHeal = 0;
    const enemyCount = 5;

    const threat = calculateHealingThreat(totalHeal, enemyCount);

    expect(threat).toBe(0);
  });
});

describe("shouldTransferAggro", () => {
  it("should require 110% threat for melee attacker", () => {
    const currentTargetThreat = 1000;
    const attackerThreat = 1100;
    const isRanged = false;

    const result = shouldTransferAggro(attackerThreat, currentTargetThreat, isRanged);

    expect(result).toBe(true);
  });

  it("should not transfer at exactly 110% for melee", () => {
    const currentTargetThreat = 1000;
    const attackerThreat = 1099;
    const isRanged = false;

    const result = shouldTransferAggro(attackerThreat, currentTargetThreat, isRanged);

    expect(result).toBe(false);
  });

  it("should require 130% threat for ranged attacker", () => {
    const currentTargetThreat = 1000;
    const attackerThreat = 1300;
    const isRanged = true;

    const result = shouldTransferAggro(attackerThreat, currentTargetThreat, isRanged);

    expect(result).toBe(true);
  });

  it("should not transfer at exactly 130% for ranged", () => {
    const currentTargetThreat = 1000;
    const attackerThreat = 1299;
    const isRanged = true;

    const result = shouldTransferAggro(attackerThreat, currentTargetThreat, isRanged);

    expect(result).toBe(false);
  });

  it("should handle edge case with zero current threat", () => {
    const currentTargetThreat = 0;
    const attackerThreat = 100;
    const isRanged = false;

    const result = shouldTransferAggro(attackerThreat, currentTargetThreat, isRanged);

    expect(result).toBe(true);
  });

  it("should handle large threat values", () => {
    const currentTargetThreat = 1000000;
    const attackerThreat = 1300000;
    const isRanged = true;

    const result = shouldTransferAggro(attackerThreat, currentTargetThreat, isRanged);

    expect(result).toBe(true);
  });
});

describe("ThreatTable", () => {
  it("should add threat and retrieve it", () => {
    const table = new ThreatTable();

    table.addThreat(1, 100, 500);

    const threat = table.getThreat(1, 100);

    expect(threat).toBe(500);
  });

  it("should accumulate threat from multiple additions", () => {
    const table = new ThreatTable();

    table.addThreat(1, 100, 300);
    table.addThreat(1, 100, 200);
    table.addThreat(1, 100, 500);

    const threat = table.getThreat(1, 100);

    expect(threat).toBe(1000);
  });

  it("should track threat separately for different source/target pairs", () => {
    const table = new ThreatTable();

    table.addThreat(1, 100, 500);
    table.addThreat(2, 100, 300);
    table.addThreat(1, 200, 400);

    expect(table.getThreat(1, 100)).toBe(500);
    expect(table.getThreat(2, 100)).toBe(300);
    expect(table.getThreat(1, 200)).toBe(400);
  });

  it("should return 0 for non-existent threat entry", () => {
    const table = new ThreatTable();

    const threat = table.getThreat(999, 888);

    expect(threat).toBe(0);
  });

  it("should return top threat for a target", () => {
    const table = new ThreatTable();

    table.addThreat(1, 100, 300);
    table.addThreat(2, 100, 500);
    table.addThreat(3, 100, 200);

    const top = table.getTopThreat(100);

    expect(top).not.toBeNull();
    expect(top?.sourceId).toBe(2);
    expect(top?.threat).toBe(500);
  });

  it("should update top threat when threat changes", () => {
    const table = new ThreatTable();

    table.addThreat(1, 100, 300);
    table.addThreat(2, 100, 500);

    let top = table.getTopThreat(100);
    expect(top?.sourceId).toBe(2);

    table.addThreat(1, 100, 300); // Now source 1 has 600

    top = table.getTopThreat(100);
    expect(top?.sourceId).toBe(1);
    expect(top?.threat).toBe(600);
  });

  it("should return null for top threat when no entries exist", () => {
    const table = new ThreatTable();

    const top = table.getTopThreat(100);

    expect(top).toBeNull();
  });

  it("should handle multiple targets independently", () => {
    const table = new ThreatTable();

    table.addThreat(1, 100, 500);
    table.addThreat(2, 100, 300);
    table.addThreat(1, 200, 700);
    table.addThreat(2, 200, 400);

    const top100 = table.getTopThreat(100);
    const top200 = table.getTopThreat(200);

    expect(top100?.sourceId).toBe(1);
    expect(top100?.threat).toBe(500);
    expect(top200?.sourceId).toBe(1);
    expect(top200?.threat).toBe(700);
  });

  it("should reset all threat values", () => {
    const table = new ThreatTable();

    table.addThreat(1, 100, 500);
    table.addThreat(2, 100, 300);
    table.addThreat(1, 200, 400);

    table.reset();

    expect(table.getThreat(1, 100)).toBe(0);
    expect(table.getThreat(2, 100)).toBe(0);
    expect(table.getThreat(1, 200)).toBe(0);
    expect(table.getTopThreat(100)).toBeNull();
  });

  it("should handle negative threat values (threat reduction)", () => {
    const table = new ThreatTable();

    table.addThreat(1, 100, 1000);
    table.addThreat(1, 100, -300);

    const threat = table.getThreat(1, 100);

    expect(threat).toBe(700);
  });

  it("should handle threat going negative", () => {
    const table = new ThreatTable();

    table.addThreat(1, 100, 500);
    table.addThreat(1, 100, -700);

    const threat = table.getThreat(1, 100);

    expect(threat).toBe(-200);
  });
});
