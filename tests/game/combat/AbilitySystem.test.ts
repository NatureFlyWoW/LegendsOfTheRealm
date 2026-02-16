// tests/game/combat/AbilitySystem.test.ts
import { describe, it, expect } from "vitest";
import { executeAbility } from "@game/combat/AbilitySystem";
import { SeededRng } from "@game/combat/rng";
import type { CombatEntity, AbilityInstance } from "@shared/combat-interfaces";
import { DamageType, ResourceType } from "@shared/enums";
import { makeAbilityId } from "@shared/types";

describe("executeAbility", () => {
  // Helper to create a basic combat entity
  function createEntity(id: number, name: string, level: number = 60): CombatEntity {
    return {
      id,
      name,
      entityType: "player",
      role: "dps",
      classId: "warrior",
      specId: "arms",
      level,
      effectiveStats: {
        strength: 300,
        agility: 100,
        intellect: 50,
        stamina: 200,
        spirit: 50,
        maxHp: 2000,
        maxMana: 500,
        attackPower: 500,
        spellPower: 100,
        armor: 3000,
        critChance: 20,
        hitChance: 5,
        hastePercent: 0,
        dodgeChance: 5,
        parryChance: 5,
        blockChance: 0,
        blockValue: 0,
        defenseSkill: 300,
        resilience: 0,
        mp5: 10,
        weaponDamageMin: 100,
        weaponDamageMax: 150,
        weaponSpeed: 2.6,
      },
      abilities: [],
      rotation: [],
      resources: {
        type: ResourceType.Rage,
        current: 100,
        max: 100,
      },
      equipment: {
        weaponSpeed: 2.6,
        weaponDps: 100,
      },
    };
  }

  // Helper to create a basic physical ability
  function createPhysicalAbility(): AbilityInstance {
    return {
      id: makeAbilityId("mortal_strike"),
      name: "Mortal Strike",
      resourceCost: 30,
      resourceType: ResourceType.Rage,
      cooldownMs: 6000,
      castTimeMs: 0,
      coefficient: 1.1,
      damageType: DamageType.Physical,
    };
  }

  // Helper to create a basic spell ability
  function createSpellAbility(): AbilityInstance {
    return {
      id: makeAbilityId("fireball"),
      name: "Fireball",
      resourceCost: 50,
      resourceType: ResourceType.Mana,
      cooldownMs: 0,
      castTimeMs: 2500,
      coefficient: 1.0,
      baseDamage: 200,
      damageType: DamageType.Fire,
    };
  }

  it("should fail if ability is on cooldown", () => {
    const caster = createEntity(1, "Warrior");
    const target = createEntity(2, "Target");
    const ability = createPhysicalAbility();
    const rng = new SeededRng(12345);
    const cooldowns = new Map<string, number>();
    const tick = 10;

    // Set cooldown to expire at tick 20
    cooldowns.set(ability.id, 20);

    const result = executeAbility(
      caster,
      ability,
      target,
      caster.effectiveStats.maxHp,
      target.effectiveStats.maxHp,
      rng,
      tick,
      cooldowns,
      { current: 100, max: 100 },
    );

    expect(result.success).toBe(false);
    expect(result.failReason).toBe("on_cooldown");
    expect(result.events).toHaveLength(0);
    expect(result.resourceSpent).toBe(0);
    expect(result.cooldownStarted).toBe(0);
  });

  it("should fail if caster has insufficient resource", () => {
    const caster = createEntity(1, "Warrior");
    const target = createEntity(2, "Target");
    const ability = createPhysicalAbility();
    const rng = new SeededRng(12345);
    const cooldowns = new Map<string, number>();
    const tick = 10;

    const result = executeAbility(
      caster,
      ability,
      target,
      caster.effectiveStats.maxHp,
      target.effectiveStats.maxHp,
      rng,
      tick,
      cooldowns,
      { current: 20, max: 100 }, // Not enough for 30 resource cost
    );

    expect(result.success).toBe(false);
    expect(result.failReason).toBe("insufficient_resource");
    expect(result.events).toHaveLength(0);
    expect(result.resourceSpent).toBe(0);
    expect(result.cooldownStarted).toBe(0);
  });

  it("should successfully execute a physical ability that hits", () => {
    const caster = createEntity(1, "Warrior");
    const target = createEntity(2, "Target");
    const ability = createPhysicalAbility();

    // Use a seed that results in a hit (not miss/dodge/parry/block/crit)
    const rng = new SeededRng(9999);
    const cooldowns = new Map<string, number>();
    const tick = 10;

    const result = executeAbility(
      caster,
      ability,
      target,
      caster.effectiveStats.maxHp,
      target.effectiveStats.maxHp,
      rng,
      tick,
      cooldowns,
      { current: 100, max: 100 },
    );

    expect(result.success).toBe(true);
    expect(result.failReason).toBeUndefined();
    expect(result.resourceSpent).toBe(30);
    expect(result.cooldownStarted).toBe(16); // tick 10 + 6 ticks (6000ms / 1000)
    expect(result.events).toHaveLength(1);

    const event = result.events[0];
    expect(event.type).toBe("damage");
    if (event.type === "damage") {
      expect(event.abilityName).toBe("Mortal Strike");
      expect(event.sourceId).toBe(1);
      expect(event.targetId).toBe(2);
      expect(event.amount).toBeGreaterThan(0);
      expect(event.damageType).toBe(DamageType.Physical);
      expect(event.isBlocked).toBe(false);
      expect(event.blockAmount).toBe(0);
    }
  });

  it("should successfully execute a spell ability that hits", () => {
    const caster = createEntity(1, "Mage");
    caster.effectiveStats.spellPower = 500;
    const target = createEntity(2, "Target");
    const ability = createSpellAbility();

    const rng = new SeededRng(8888);
    const cooldowns = new Map<string, number>();
    const tick = 10;

    const result = executeAbility(
      caster,
      ability,
      target,
      caster.effectiveStats.maxHp,
      target.effectiveStats.maxHp,
      rng,
      tick,
      cooldowns,
      { current: 100, max: 100 },
    );

    expect(result.success).toBe(true);
    expect(result.resourceSpent).toBe(50);
    expect(result.cooldownStarted).toBe(0); // No cooldown for instant spell
    expect(result.events).toHaveLength(1);

    const event = result.events[0];
    expect(event.type).toBe("damage");
    if (event.type === "damage") {
      expect(event.abilityName).toBe("Fireball");
      expect(event.damageType).toBe(DamageType.Fire);
      expect(event.amount).toBeGreaterThan(0);
      expect(event.isCrit).toBeDefined();
    }
  });

  it("should generate miss event when attack misses", () => {
    const caster = createEntity(1, "Warrior");
    caster.effectiveStats.hitChance = 0; // No hit chance
    const target = createEntity(2, "Target");
    target.effectiveStats.dodgeChance = 100; // Force avoidance
    target.effectiveStats.parryChance = 0;
    target.effectiveStats.blockChance = 0;
    const ability = createPhysicalAbility();

    // With 100% dodge, this will always result in a miss/dodge event
    const rng = new SeededRng(1111);
    const cooldowns = new Map<string, number>();
    const tick = 10;

    const result = executeAbility(
      caster,
      ability,
      target,
      caster.effectiveStats.maxHp,
      target.effectiveStats.maxHp,
      rng,
      tick,
      cooldowns,
      { current: 100, max: 100 },
    );

    expect(result.success).toBe(true);
    expect(result.resourceSpent).toBe(30); // Resource spent even on miss
    expect(result.cooldownStarted).toBe(16); // Cooldown started even on miss
    expect(result.events).toHaveLength(1);

    const event = result.events[0];
    expect(event.type).toBe("miss");
    if (event.type === "miss") {
      expect(event.missType).toMatch(/^(miss|dodge|parry)$/);
      expect(event.abilityName).toBe("Mortal Strike");
    }
  });

  it("should generate crit event when attack crits", () => {
    const caster = createEntity(1, "Warrior");
    caster.effectiveStats.critChance = 100; // Guaranteed crit
    caster.effectiveStats.hitChance = 100; // Guaranteed hit
    const target = createEntity(2, "Target");
    target.effectiveStats.dodgeChance = 0;
    target.effectiveStats.parryChance = 0;
    target.effectiveStats.blockChance = 0;
    const ability = createPhysicalAbility();

    const rng = new SeededRng(7777);
    const cooldowns = new Map<string, number>();
    const tick = 10;

    const result = executeAbility(
      caster,
      ability,
      target,
      caster.effectiveStats.maxHp,
      target.effectiveStats.maxHp,
      rng,
      tick,
      cooldowns,
      { current: 100, max: 100 },
    );

    expect(result.success).toBe(true);
    expect(result.events).toHaveLength(1);

    const event = result.events[0];
    expect(event.type).toBe("damage");
    if (event.type === "damage") {
      expect(event.isCrit).toBe(true);
      expect(event.amount).toBeGreaterThan(0);
    }
  });

  it("should calculate overkill correctly when damage exceeds target HP", () => {
    const caster = createEntity(1, "Warrior");
    caster.effectiveStats.attackPower = 5000; // Very high attack power
    caster.effectiveStats.hitChance = 100;
    caster.effectiveStats.critChance = 100;
    const target = createEntity(2, "Target");
    target.effectiveStats.dodgeChance = 0;
    target.effectiveStats.parryChance = 0;
    target.effectiveStats.blockChance = 0;
    target.effectiveStats.armor = 0;
    const ability = createPhysicalAbility();

    const targetHp = 100; // Very low HP
    const rng = new SeededRng(5555);
    const cooldowns = new Map<string, number>();
    const tick = 10;

    const result = executeAbility(
      caster,
      ability,
      target,
      caster.effectiveStats.maxHp,
      targetHp,
      rng,
      tick,
      cooldowns,
      { current: 100, max: 100 },
    );

    expect(result.success).toBe(true);
    expect(result.events).toHaveLength(1);

    const event = result.events[0];
    expect(event.type).toBe("damage");
    if (event.type === "damage") {
      expect(event.amount).toBe(targetHp); // Damage capped at target HP
      expect(event.overkill).toBeGreaterThan(0); // Overkill recorded
    }
  });

  it("should handle blocked attacks correctly", () => {
    const caster = createEntity(1, "Warrior");
    caster.effectiveStats.hitChance = 50;
    const target = createEntity(2, "Tank");
    target.effectiveStats.blockChance = 100; // Guaranteed block
    target.effectiveStats.blockValue = 100;
    target.effectiveStats.dodgeChance = 0;
    target.effectiveStats.parryChance = 0;
    const ability = createPhysicalAbility();

    const rng = new SeededRng(3333);
    const cooldowns = new Map<string, number>();
    const tick = 10;

    const result = executeAbility(
      caster,
      ability,
      target,
      caster.effectiveStats.maxHp,
      target.effectiveStats.maxHp,
      rng,
      tick,
      cooldowns,
      { current: 100, max: 100 },
    );

    expect(result.success).toBe(true);
    expect(result.events).toHaveLength(1);

    const event = result.events[0];
    if (event.type === "damage") {
      expect(event.isBlocked).toBe(true);
      expect(event.blockAmount).toBe(100);
      // Damage should be reduced by block value (but not negative)
      expect(event.amount).toBeGreaterThanOrEqual(0);
    }
  });

  it("should use deterministic RNG for reproducible results", () => {
    const caster = createEntity(1, "Warrior");
    const target = createEntity(2, "Target");
    const ability = createPhysicalAbility();
    const tick = 10;
    const cooldowns = new Map<string, number>();

    // Execute ability twice with same seed
    const rng1 = new SeededRng(42);
    const result1 = executeAbility(
      caster,
      ability,
      target,
      caster.effectiveStats.maxHp,
      target.effectiveStats.maxHp,
      rng1,
      tick,
      cooldowns,
      { current: 100, max: 100 },
    );

    const rng2 = new SeededRng(42);
    const result2 = executeAbility(
      caster,
      ability,
      target,
      caster.effectiveStats.maxHp,
      target.effectiveStats.maxHp,
      rng2,
      tick,
      new Map(cooldowns),
      { current: 100, max: 100 },
    );

    // Results should be identical
    expect(result1.success).toBe(result2.success);
    expect(result1.events.length).toBe(result2.events.length);

    if (result1.events[0].type === "damage" && result2.events[0].type === "damage") {
      expect(result1.events[0].amount).toBeCloseTo(result2.events[0].amount, 10);
      expect(result1.events[0].isCrit).toBe(result2.events[0].isCrit);
    }
  });

  it("should allow ability execution when cooldown has expired", () => {
    const caster = createEntity(1, "Warrior");
    const target = createEntity(2, "Target");
    const ability = createPhysicalAbility();
    const rng = new SeededRng(12345);
    const cooldowns = new Map<string, number>();
    const tick = 20;

    // Set cooldown to expire at tick 15 (before current tick)
    cooldowns.set(ability.id, 15);

    const result = executeAbility(
      caster,
      ability,
      target,
      caster.effectiveStats.maxHp,
      target.effectiveStats.maxHp,
      rng,
      tick,
      cooldowns,
      { current: 100, max: 100 },
    );

    expect(result.success).toBe(true);
    expect(result.failReason).toBeUndefined();
    expect(result.events.length).toBeGreaterThan(0);
  });

  it("should handle abilities with zero cooldown", () => {
    const caster = createEntity(1, "Mage");
    const target = createEntity(2, "Target");
    const ability = createSpellAbility();
    ability.cooldownMs = 0; // No cooldown

    const rng = new SeededRng(6666);
    const cooldowns = new Map<string, number>();
    const tick = 10;

    const result = executeAbility(
      caster,
      ability,
      target,
      caster.effectiveStats.maxHp,
      target.effectiveStats.maxHp,
      rng,
      tick,
      cooldowns,
      { current: 100, max: 100 },
    );

    expect(result.success).toBe(true);
    expect(result.cooldownStarted).toBe(0); // No cooldown set
  });
});
