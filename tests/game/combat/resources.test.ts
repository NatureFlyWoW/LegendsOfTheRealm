// tests/game/combat/resources.test.ts
import { describe, it, expect } from "vitest";
import {
  createResourceState,
  spendResource,
  addResource,
  tickRegeneration,
  generateRage,
  calculateGCD,
  type ResourceState,
} from "@game/combat/resources";
import { ResourceType } from "@shared/enums";

describe("createResourceState", () => {
  it("should create mana state with full capacity", () => {
    const state = createResourceState(ResourceType.Mana);

    expect(state.type).toBe(ResourceType.Mana);
    expect(state.current).toBe(state.max);
    expect(state.max).toBeGreaterThan(0);
  });

  it("should create rage state at 0", () => {
    const state = createResourceState(ResourceType.Rage);

    expect(state.type).toBe(ResourceType.Rage);
    expect(state.current).toBe(0);
    expect(state.max).toBe(100);
  });

  it("should create energy state at 100", () => {
    const state = createResourceState(ResourceType.Energy);

    expect(state.type).toBe(ResourceType.Energy);
    expect(state.current).toBe(100);
    expect(state.max).toBe(100);
  });

  it("should create focus state at 100", () => {
    const state = createResourceState(ResourceType.Focus);

    expect(state.type).toBe(ResourceType.Focus);
    expect(state.current).toBe(100);
    expect(state.max).toBe(100);
  });

  it("should create combo points at 0", () => {
    const state = createResourceState(ResourceType.ComboPoints);

    expect(state.type).toBe(ResourceType.ComboPoints);
    expect(state.current).toBe(0);
    expect(state.max).toBe(5);
  });

  it("should create soul shards at 0", () => {
    const state = createResourceState(ResourceType.SoulShards);

    expect(state.type).toBe(ResourceType.SoulShards);
    expect(state.current).toBe(0);
    expect(state.max).toBe(3);
  });

  it("should create divine favor at 0", () => {
    const state = createResourceState(ResourceType.DivineFavor);

    expect(state.type).toBe(ResourceType.DivineFavor);
    expect(state.current).toBe(0);
    expect(state.max).toBe(100);
  });

  it("should create maelstrom at 0", () => {
    const state = createResourceState(ResourceType.Maelstrom);

    expect(state.type).toBe(ResourceType.Maelstrom);
    expect(state.current).toBe(0);
    expect(state.max).toBe(100);
  });

  it("should create arcane charges at 0", () => {
    const state = createResourceState(ResourceType.ArcaneCharges);

    expect(state.type).toBe(ResourceType.ArcaneCharges);
    expect(state.current).toBe(0);
    expect(state.max).toBe(4);
  });
});

describe("spendResource", () => {
  it("should spend resource successfully when enough available", () => {
    const state: ResourceState = {
      type: ResourceType.Mana,
      current: 1000,
      max: 2000,
    };

    const result = spendResource(state, 300);

    expect(result.success).toBe(true);
    expect(result.newState.current).toBe(700);
    expect(result.newState.max).toBe(2000);
  });

  it("should fail when insufficient resource", () => {
    const state: ResourceState = {
      type: ResourceType.Energy,
      current: 30,
      max: 100,
    };

    const result = spendResource(state, 50);

    expect(result.success).toBe(false);
    expect(result.newState.current).toBe(30); // Unchanged
  });

  it("should spend exact amount available", () => {
    const state: ResourceState = {
      type: ResourceType.Rage,
      current: 40,
      max: 100,
    };

    const result = spendResource(state, 40);

    expect(result.success).toBe(true);
    expect(result.newState.current).toBe(0);
  });

  it("should handle zero spend", () => {
    const state: ResourceState = {
      type: ResourceType.Mana,
      current: 500,
      max: 1000,
    };

    const result = spendResource(state, 0);

    expect(result.success).toBe(true);
    expect(result.newState.current).toBe(500);
  });

  it("should not mutate original state", () => {
    const state: ResourceState = {
      type: ResourceType.Mana,
      current: 1000,
      max: 2000,
    };

    spendResource(state, 300);

    expect(state.current).toBe(1000); // Original unchanged
  });
});

describe("addResource", () => {
  it("should add resource up to maximum", () => {
    const state: ResourceState = {
      type: ResourceType.Mana,
      current: 800,
      max: 2000,
    };

    const result = addResource(state, 500);

    expect(result.current).toBe(1300);
  });

  it("should clamp at maximum", () => {
    const state: ResourceState = {
      type: ResourceType.Energy,
      current: 80,
      max: 100,
    };

    const result = addResource(state, 50);

    expect(result.current).toBe(100);
  });

  it("should handle adding zero", () => {
    const state: ResourceState = {
      type: ResourceType.Rage,
      current: 50,
      max: 100,
    };

    const result = addResource(state, 0);

    expect(result.current).toBe(50);
  });

  it("should handle negative values (resource drain)", () => {
    const state: ResourceState = {
      type: ResourceType.Mana,
      current: 1000,
      max: 2000,
    };

    const result = addResource(state, -300);

    expect(result.current).toBe(700);
  });

  it("should not go below zero with negative add", () => {
    const state: ResourceState = {
      type: ResourceType.Mana,
      current: 200,
      max: 2000,
    };

    const result = addResource(state, -500);

    expect(result.current).toBe(0);
  });

  it("should not mutate original state", () => {
    const state: ResourceState = {
      type: ResourceType.Mana,
      current: 1000,
      max: 2000,
    };

    addResource(state, 300);

    expect(state.current).toBe(1000); // Original unchanged
  });
});

describe("tickRegeneration", () => {
  it("should regenerate mana based on spirit (out of combat)", () => {
    const state: ResourceState = {
      type: ResourceType.Mana,
      current: 1000,
      max: 2000,
    };

    const result = tickRegeneration(state, 100, 0, false);

    // Out of combat: spirit per tick
    expect(result.current).toBe(1100);
  });

  it("should regenerate mana slower in combat (spirit / 5)", () => {
    const state: ResourceState = {
      type: ResourceType.Mana,
      current: 1000,
      max: 2000,
    };

    const result = tickRegeneration(state, 100, 0, true);

    // In combat: spirit / 5 per tick
    expect(result.current).toBe(1020);
  });

  it("should regenerate energy at 20/tick", () => {
    const state: ResourceState = {
      type: ResourceType.Energy,
      current: 50,
      max: 100,
    };

    const result = tickRegeneration(state, 0, 0, true);

    expect(result.current).toBe(70);
  });

  it("should apply haste to energy regeneration", () => {
    const state: ResourceState = {
      type: ResourceType.Energy,
      current: 50,
      max: 100,
    };

    // 20% haste should increase regen
    const result = tickRegeneration(state, 0, 20, true);

    // Base 20 * (1 + 0.2) = 24
    expect(result.current).toBe(74);
  });

  it("should regenerate focus at 10/tick", () => {
    const state: ResourceState = {
      type: ResourceType.Focus,
      current: 40,
      max: 100,
    };

    const result = tickRegeneration(state, 0, 0, true);

    expect(result.current).toBe(50);
  });

  it("should decay rage by 1/tick out of combat", () => {
    const state: ResourceState = {
      type: ResourceType.Rage,
      current: 50,
      max: 100,
    };

    const result = tickRegeneration(state, 0, 0, false);

    expect(result.current).toBe(49);
  });

  it("should not decay rage in combat", () => {
    const state: ResourceState = {
      type: ResourceType.Rage,
      current: 50,
      max: 100,
    };

    const result = tickRegeneration(state, 0, 0, true);

    expect(result.current).toBe(50);
  });

  it("should not regenerate non-regenerating resources", () => {
    const state: ResourceState = {
      type: ResourceType.ComboPoints,
      current: 3,
      max: 5,
    };

    const result = tickRegeneration(state, 50, 10, true);

    expect(result.current).toBe(3); // No change
  });

  it("should clamp mana regen at max", () => {
    const state: ResourceState = {
      type: ResourceType.Mana,
      current: 1980,
      max: 2000,
    };

    const result = tickRegeneration(state, 100, 0, false);

    expect(result.current).toBe(2000); // Clamped
  });

  it("should not let rage decay below 0", () => {
    const state: ResourceState = {
      type: ResourceType.Rage,
      current: 0,
      max: 100,
    };

    const result = tickRegeneration(state, 0, 0, false);

    expect(result.current).toBe(0);
  });
});

describe("generateRage", () => {
  it("should generate rage from damage (damage / 230 * 7.5)", () => {
    const damage = 230;

    const rage = generateRage(damage);

    // 230 / 230 * 7.5 = 7.5
    expect(rage).toBeCloseTo(7.5, 4);
  });

  it("should generate rage proportionally for different damage values", () => {
    const damage = 460;

    const rage = generateRage(damage);

    // 460 / 230 * 7.5 = 15
    expect(rage).toBeCloseTo(15, 4);
  });

  it("should generate fractional rage for small damage", () => {
    const damage = 50;

    const rage = generateRage(damage);

    // 50 / 230 * 7.5 ≈ 1.63
    expect(rage).toBeCloseTo(1.63, 2);
  });

  it("should handle zero damage", () => {
    const damage = 0;

    const rage = generateRage(damage);

    expect(rage).toBe(0);
  });

  it("should generate large rage for high damage", () => {
    const damage = 2300;

    const rage = generateRage(damage);

    // 2300 / 230 * 7.5 = 75
    expect(rage).toBeCloseTo(75, 4);
  });
});

describe("calculateGCD", () => {
  it("should calculate base GCD at 1.5s with no haste", () => {
    const gcd = calculateGCD(0);

    expect(gcd).toBe(1.5);
  });

  it("should reduce GCD with haste", () => {
    const gcd = calculateGCD(20);

    // 1.5 / (1 + 0.2) = 1.25
    expect(gcd).toBeCloseTo(1.25, 4);
  });

  it("should clamp GCD at minimum 1.0s", () => {
    const gcd = calculateGCD(100);

    // 1.5 / (1 + 1.0) = 0.75, but clamped at 1.0
    expect(gcd).toBe(1.0);
  });

  it("should handle very high haste values", () => {
    const gcd = calculateGCD(500);

    expect(gcd).toBe(1.0);
  });

  it("should calculate GCD correctly at cap threshold", () => {
    // 1.5 / (1 + haste/100) = 1.0
    // 1 + haste/100 = 1.5
    // haste/100 = 0.5
    // haste = 50
    const gcd = calculateGCD(50);

    expect(gcd).toBe(1.0);
  });

  it("should handle moderate haste values", () => {
    const gcd = calculateGCD(15);

    // 1.5 / (1 + 0.15) = 1.304...
    expect(gcd).toBeCloseTo(1.304, 3);
  });
});
