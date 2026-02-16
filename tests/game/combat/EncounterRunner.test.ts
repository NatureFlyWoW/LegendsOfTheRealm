// tests/game/combat/EncounterRunner.test.ts
import { describe, it, expect } from "vitest";
import { runSimpleEncounter } from "@game/combat/EncounterRunner";
import { buildPlayerEntity, buildMobEntity } from "@game/combat/CombatFactory";
import { SeededRng } from "@game/combat/rng";
import type { CharacterState } from "@shared/types";
import type { ClassDefinition, AbilityDefinition, MobDefinition } from "@shared/definitions";
import { ResourceType, DamageType, ClassName, RaceName, ActivityType } from "@shared/enums";
import { makeAbilityId, makeZoneId } from "@shared/types";

describe("runSimpleEncounter", () => {
  // ============================================================
  // Test Fixtures
  // ============================================================

  function createLevel1WarriorCharacter(): CharacterState {
    return {
      id: 1,
      name: "TestWarrior",
      race: RaceName.Human,
      className: ClassName.Warrior,
      level: 1,
      xp: 0,
      restedXp: 0,
      gold: 0,
      currentZone: makeZoneId("zone_greenhollow_vale"),
      activity: ActivityType.Idle,
      activeSpec: "arms",
      talentPoints: {},
      equipment: {},
      stats: {
        strength: 25,
        agility: 15,
        intellect: 8,
        stamina: 22,
        spirit: 10,
        maxHp: 150,
        maxMana: 0,
        attackPower: 50,
        spellPower: 0,
        armor: 0,
        critChance: 5,
        hitChance: 95,
        hastePercent: 0,
        dodgeChance: 5,
        parryChance: 0,
        blockChance: 0,
        blockValue: 0,
        defenseSkill: 0,
        resilience: 0,
        mp5: 0,
        weaponDamageMin: 5,
        weaponDamageMax: 10,
        weaponSpeed: 2.0,
      },
      companionClears: {},
      createdAt: Date.now(),
      lastPlayedAt: Date.now(),
    };
  }

  function createLevel1MageCharacter(): CharacterState {
    return {
      id: 2,
      name: "TestMage",
      race: RaceName.Human,
      className: ClassName.Mage,
      level: 1,
      xp: 0,
      restedXp: 0,
      gold: 0,
      currentZone: makeZoneId("zone_greenhollow_vale"),
      activity: ActivityType.Idle,
      activeSpec: "fire",
      talentPoints: {},
      equipment: {},
      stats: {
        strength: 5,
        agility: 10,
        intellect: 28,
        stamina: 12,
        spirit: 20,
        maxHp: 80,
        maxMana: 250,
        attackPower: 10,
        spellPower: 50,
        armor: 0,
        critChance: 5,
        hitChance: 94,
        hastePercent: 0,
        dodgeChance: 5,
        parryChance: 0,
        blockChance: 0,
        blockValue: 0,
        defenseSkill: 0,
        resilience: 0,
        mp5: 5,
        weaponDamageMin: 2,
        weaponDamageMax: 4,
        weaponSpeed: 1.5,
      },
      companionClears: {},
      createdAt: Date.now(),
      lastPlayedAt: Date.now(),
    };
  }

  function createWarriorClassDef(): ClassDefinition {
    return {
      id: ClassName.Warrior,
      name: "Warrior",
      description: "A mighty melee combatant",
      resourceType: ResourceType.Rage,
      armorProficiency: ["plate"],
      weaponProficiency: ["sword_1h", "sword_2h"],
      baseStats: {
        strength: 25,
        agility: 15,
        intellect: 8,
        stamina: 22,
        spirit: 10,
      },
      perLevelGains: {
        strength: 2.5,
        agility: 1.0,
        intellect: 0.5,
        stamina: 2.0,
        spirit: 0.8,
      },
      classBaseHp: 100,
      classBaseMana: 0,
      specs: ["protection", "arms", "fury"],
    };
  }

  function createMageClassDef(): ClassDefinition {
    return {
      id: ClassName.Mage,
      name: "Mage",
      description: "A master of arcane magic",
      resourceType: ResourceType.Mana,
      armorProficiency: ["cloth"],
      weaponProficiency: ["staff", "wand"],
      baseStats: {
        strength: 5,
        agility: 10,
        intellect: 28,
        stamina: 12,
        spirit: 20,
      },
      perLevelGains: {
        strength: 0.3,
        agility: 0.5,
        intellect: 2.8,
        stamina: 1.0,
        spirit: 1.8,
      },
      classBaseHp: 50,
      classBaseMana: 200,
      specs: ["fire", "frost", "arcane"],
    };
  }

  function createHeroicStrikeAbility(): AbilityDefinition {
    return {
      id: makeAbilityId("warrior_heroic_strike"),
      name: "Heroic Strike",
      className: ClassName.Warrior,
      spec: null,
      description: "A powerful melee strike",
      icon: { char: "H", fg: 9, bg: 0 },
      castTime: 0,
      cooldown: 0,
      globalCooldown: true,
      channeled: false,
      resourceCost: 15,
      resourceType: ResourceType.Rage,
      targetType: "enemy",
      range: 5,
      effects: [
        {
          type: "damage",
          damageType: DamageType.Physical,
          baseDamageMin: 10,
          baseDamageMax: 15,
          coefficient: 1.0,
          scalingStat: "attack_power",
        },
      ],
      aiPriority: 1,
    };
  }

  function createFireboltAbility(): AbilityDefinition {
    return {
      id: makeAbilityId("mage_firebolt"),
      name: "Firebolt",
      className: ClassName.Mage,
      spec: null,
      description: "Hurl a bolt of fire",
      icon: { char: "F", fg: 1, bg: 0 },
      castTime: 1.5,
      cooldown: 0,
      globalCooldown: true,
      channeled: false,
      resourceCost: 30,
      resourceType: ResourceType.Mana,
      targetType: "enemy",
      range: 30,
      effects: [
        {
          type: "damage",
          damageType: DamageType.Fire,
          baseDamageMin: 15,
          baseDamageMax: 20,
          coefficient: 0.8,
          scalingStat: "spell_power",
        },
      ],
      aiPriority: 1,
    };
  }

  function createCellarRatMob(): MobDefinition {
    return {
      id: "mob_cellar_rat",
      name: "Cellar Rat",
      level: 1,
      isElite: false,
      isBoss: false,
      isRareSpawn: false,
      health: 50,
      armor: 5,
      meleeDamageMin: 3,
      meleeDamageMax: 5,
      attackSpeed: 2.0,
      abilities: [],
      zoneId: makeZoneId("zone_greenhollow_vale"),
      lootTableId: "loot_cellar_rat",
      xpReward: 45,
      icon: { char: "r", fg: 8, bg: 0 },
    };
  }

  function createKraggMob(): MobDefinition {
    return {
      id: "mob_kragg",
      name: "Bandit Leader Kragg",
      level: 5,
      isElite: true,
      isBoss: true,
      isRareSpawn: false,
      health: 800,
      armor: 80,
      meleeDamageMin: 25,
      meleeDamageMax: 35,
      attackSpeed: 3.0,
      abilities: [
        {
          id: "kragg_cleave",
          name: "Cleave",
          damageType: DamageType.Physical,
          castTime: 0,
          cooldown: 6,
          damage: 40,
          targetType: "cone_frontal",
        },
      ],
      zoneId: makeZoneId("zone_greenhollow_vale"),
      lootTableId: "loot_kragg",
      xpReward: 800,
      icon: { char: "K", fg: 9, bg: 0 },
    };
  }

  // ============================================================
  // Tests
  // ============================================================

  it("should result in victory when level 1 Warrior defeats Cellar Rat", () => {
    const character = createLevel1WarriorCharacter();
    const classDef = createWarriorClassDef();
    const ability = createHeroicStrikeAbility();
    const mob = createCellarRatMob();

    const player = buildPlayerEntity(character, classDef, [ability], []);
    const enemy = buildMobEntity(mob);

    // Give player some starting rage
    player.resources.current = 50;

    const rng = new SeededRng(12345);
    const result = runSimpleEncounter(
      {
        player,
        enemy,
        tickLimit: 50,
      },
      rng,
    );

    expect(result.outcome).toBe("victory");
    expect(result.durationTicks).toBeLessThan(30);
    expect(result.playerHpRemaining).toBeGreaterThan(0);
    expect(result.xpAwarded).toBeGreaterThan(0);
    expect(result.events.length).toBeGreaterThan(0);

    // Verify death event is present
    const deathEvent = result.events.find((e) => e.type === "death");
    expect(deathEvent).toBeDefined();
    if (deathEvent && deathEvent.type === "death") {
      expect(deathEvent.targetName).toBe("Cellar Rat");
    }
  });

  it("should result in victory when level 1 Mage defeats Cellar Rat", () => {
    const character = createLevel1MageCharacter();
    const classDef = createMageClassDef();
    const ability = createFireboltAbility();
    const mob = createCellarRatMob();

    const player = buildPlayerEntity(character, classDef, [ability], []);
    const enemy = buildMobEntity(mob);

    // Mage starts with full mana
    player.resources.current = player.resources.max;

    const rng = new SeededRng(54321);
    const result = runSimpleEncounter(
      {
        player,
        enemy,
        tickLimit: 50,
      },
      rng,
    );

    expect(result.outcome).toBe("victory");
    expect(result.durationTicks).toBeLessThan(30);
    expect(result.playerHpRemaining).toBeGreaterThan(0);
    expect(result.xpAwarded).toBeGreaterThan(0);

    // Verify death event
    const deathEvent = result.events.find((e) => e.type === "death");
    expect(deathEvent).toBeDefined();
  });

  it("should generate damage events during combat", () => {
    const character = createLevel1WarriorCharacter();
    const classDef = createWarriorClassDef();
    const ability = createHeroicStrikeAbility();
    const mob = createCellarRatMob();

    const player = buildPlayerEntity(character, classDef, [ability], []);
    const enemy = buildMobEntity(mob);
    player.resources.current = 50;

    const rng = new SeededRng(99999);
    const result = runSimpleEncounter(
      {
        player,
        enemy,
        tickLimit: 50,
      },
      rng,
    );

    // Verify damage events are present
    const damageEvents = result.events.filter((e) => e.type === "damage");
    expect(damageEvents.length).toBeGreaterThan(0);

    // Verify at least one damage event has positive damage
    const hasPositiveDamage = damageEvents.some(
      (e) => e.type === "damage" && e.amount > 0
    );
    expect(hasPositiveDamage).toBe(true);
  });

  it("should award correct XP on victory", () => {
    const character = createLevel1WarriorCharacter();
    const classDef = createWarriorClassDef();
    const ability = createHeroicStrikeAbility();
    const mob = createCellarRatMob();

    const player = buildPlayerEntity(character, classDef, [ability], []);
    const enemy = buildMobEntity(mob);
    player.resources.current = 50;

    const rng = new SeededRng(11111);
    const result = runSimpleEncounter(
      {
        player,
        enemy,
        tickLimit: 50,
      },
      rng,
    );

    expect(result.outcome).toBe("victory");
    // XP should be level * 45 (level 1 * 45 = 45)
    expect(result.xpAwarded).toBe(45);
  });

  it("should verify defeat scenario with weak character", () => {
    // Create a very weak character with minimal stats
    const character = createLevel1WarriorCharacter();

    const classDef = createWarriorClassDef();
    const ability = createHeroicStrikeAbility();
    const mob = createKraggMob();

    const player = buildPlayerEntity(character, classDef, [ability], []);

    // Make player very weak by reducing HP to ensure defeat
    player.effectiveStats.maxHp = 20;

    const enemy = buildMobEntity(mob);
    player.resources.current = 50;

    const rng = new SeededRng(77777);
    const result = runSimpleEncounter(
      {
        player,
        enemy,
        tickLimit: 100,
      },
      rng,
    );

    // With very low HP (20) vs Kragg (800 HP, 25-35 damage), player should be defeated
    expect(result.outcome).toBe("defeat");
    expect(result.playerHpRemaining).toBe(0);
    expect(result.xpAwarded).toBe(0);

    // Verify player death event
    const deathEvent = result.events.find((e) => e.type === "death");
    expect(deathEvent).toBeDefined();
    if (deathEvent && deathEvent.type === "death") {
      expect(deathEvent.targetName).toBe("TestWarrior");
    }
  });

  it("should result in timeout when tick limit is reached", () => {
    const character = createLevel1WarriorCharacter();
    const classDef = createWarriorClassDef();
    const ability = createHeroicStrikeAbility();
    const mob = createCellarRatMob();

    const player = buildPlayerEntity(character, classDef, [ability], []);
    const enemy = buildMobEntity(mob);

    // Give player no rage - can't use abilities
    player.resources.current = 0;

    // Use very short tick limit
    const rng = new SeededRng(33333);
    const result = runSimpleEncounter(
      {
        player,
        enemy,
        tickLimit: 2,
      },
      rng,
    );

    expect(result.outcome).toBe("timeout");
    expect(result.durationTicks).toBe(2);
    expect(result.xpAwarded).toBe(0);
    expect(result.playerHpRemaining).toBeGreaterThan(0);
  });

  it("should be deterministic with same RNG seed", () => {
    const character = createLevel1WarriorCharacter();
    const classDef = createWarriorClassDef();
    const ability = createHeroicStrikeAbility();
    const mob = createCellarRatMob();

    // Run encounter twice with same seed
    const rng1 = new SeededRng(42);
    const player1 = buildPlayerEntity(character, classDef, [ability], []);
    const enemy1 = buildMobEntity(mob);
    player1.resources.current = 50;

    const result1 = runSimpleEncounter(
      {
        player: player1,
        enemy: enemy1,
        tickLimit: 50,
      },
      rng1,
    );

    const rng2 = new SeededRng(42);
    const player2 = buildPlayerEntity(character, classDef, [ability], []);
    const enemy2 = buildMobEntity(mob);
    player2.resources.current = 50;

    const result2 = runSimpleEncounter(
      {
        player: player2,
        enemy: enemy2,
        tickLimit: 50,
      },
      rng2,
    );

    // Results should be identical
    expect(result1.outcome).toBe(result2.outcome);
    expect(result1.durationTicks).toBe(result2.durationTicks);
    expect(result1.playerHpRemaining).toBeCloseTo(result2.playerHpRemaining, 5);
    expect(result1.xpAwarded).toBe(result2.xpAwarded);
    expect(result1.events.length).toBe(result2.events.length);
  });

  it("should complete combat in reasonable tick count for Cellar Rat", () => {
    const character = createLevel1WarriorCharacter();
    const classDef = createWarriorClassDef();
    const ability = createHeroicStrikeAbility();
    const mob = createCellarRatMob();

    const player = buildPlayerEntity(character, classDef, [ability], []);
    const enemy = buildMobEntity(mob);
    player.resources.current = 50;

    const rng = new SeededRng(55555);
    const result = runSimpleEncounter(
      {
        player,
        enemy,
        tickLimit: 50,
      },
      rng,
    );

    // Combat should complete in less than 30 ticks
    expect(result.durationTicks).toBeLessThan(30);
    expect(result.outcome).not.toBe("timeout");
  });

  it("should accumulate events in chronological order", () => {
    const character = createLevel1WarriorCharacter();
    const classDef = createWarriorClassDef();
    const ability = createHeroicStrikeAbility();
    const mob = createCellarRatMob();

    const player = buildPlayerEntity(character, classDef, [ability], []);
    const enemy = buildMobEntity(mob);
    player.resources.current = 50;

    const rng = new SeededRng(66666);
    const result = runSimpleEncounter(
      {
        player,
        enemy,
        tickLimit: 50,
      },
      rng,
    );

    // Verify events are in chronological order
    let lastTick = 0;
    for (const event of result.events) {
      expect(event.tick).toBeGreaterThanOrEqual(lastTick);
      lastTick = event.tick;
    }

    // Death event should be last
    const lastEvent = result.events[result.events.length - 1];
    expect(lastEvent.type).toBe("death");
  });

  it("should handle combat with no abilities (auto-attack only)", () => {
    const character = createLevel1WarriorCharacter();
    const classDef = createWarriorClassDef();
    const mob = createCellarRatMob();

    // Build player with no abilities
    const player = buildPlayerEntity(character, classDef, [], []);
    const enemy = buildMobEntity(mob);

    const rng = new SeededRng(88888);
    const result = runSimpleEncounter(
      {
        player,
        enemy,
        tickLimit: 100,
      },
      rng,
    );

    // Should complete via auto-attack
    expect(result.outcome).toBe("victory");
    expect(result.playerHpRemaining).toBeGreaterThan(0);

    // Verify auto-attack damage events
    const autoAttackEvents = result.events.filter(
      (e) => e.type === "damage" && e.abilityName === "Auto Attack"
    );
    expect(autoAttackEvents.length).toBeGreaterThan(0);
  });
});
