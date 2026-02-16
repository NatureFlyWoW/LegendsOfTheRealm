// tests/game/combat/CombatFactory.test.ts
import { describe, it, expect } from "vitest";
import { buildPlayerEntity, buildMobEntity } from "@game/combat/CombatFactory";
import { getClass, getMob, getAbilitiesByClass, getItem } from "@game/data";
import type { CharacterState, ItemId } from "@shared/types";
import type { ClassDefinition, AbilityDefinition, ItemDefinition, MobDefinition } from "@shared/definitions";
import type { GearSlot } from "@shared/enums";
import { makeItemId } from "@shared/types";

describe("CombatFactory", () => {
  describe("buildPlayerEntity", () => {
    it("should build a level 1 Warrior with no gear", () => {
      // Arrange
      const classDef = getClass("warrior")!;
      expect(classDef).toBeDefined();

      const character: CharacterState = {
        id: 1,
        name: "TestWarrior",
        race: "human",
        className: "warrior",
        level: 1,
        xp: 0,
        restedXp: 0,
        gold: 0,
        currentZone: "zone_greenhollow_vale" as any,
        activity: "idle",
        activeSpec: "arms",
        talentPoints: {},
        equipment: {
          head: null,
          neck: null,
          shoulders: null,
          back: null,
          chest: null,
          wrists: null,
          hands: null,
          waist: null,
          legs: null,
          feet: null,
          finger1: null,
          finger2: null,
          trinket1: null,
          trinket2: null,
          main_hand: null,
          off_hand: null,
          ranged: null,
        },
        stats: {} as any,
        companionClears: {},
        createdAt: Date.now(),
        lastPlayedAt: Date.now(),
      };

      const abilities = getAbilitiesByClass("warrior").slice(0, 2); // Get first 2 abilities
      const equippedItems: Array<{ slot: GearSlot; item: ItemDefinition }> = [];

      // Act
      const entity = buildPlayerEntity(character, classDef, abilities, equippedItems);

      // Assert
      expect(entity.id).toBe(1);
      expect(entity.name).toBe("TestWarrior");
      expect(entity.entityType).toBe("player");
      expect(entity.role).toBe("dps"); // Arms warrior is DPS
      expect(entity.classId).toBe("warrior");
      expect(entity.specId).toBe("arms");
      expect(entity.level).toBe(1);

      // Verify base stats match class definition at level 1
      expect(entity.effectiveStats.strength).toBe(classDef.baseStats.strength);
      expect(entity.effectiveStats.agility).toBe(classDef.baseStats.agility);
      expect(entity.effectiveStats.intellect).toBe(classDef.baseStats.intellect);
      expect(entity.effectiveStats.stamina).toBe(classDef.baseStats.stamina);
      expect(entity.effectiveStats.spirit).toBe(classDef.baseStats.spirit);

      // Verify derived stats
      const expectedHp = classDef.baseStats.stamina * 10 + classDef.classBaseHp;
      expect(entity.effectiveStats.maxHp).toBe(expectedHp);

      // Warriors use rage, not mana
      expect(entity.effectiveStats.maxMana).toBe(0);
      expect(entity.resources.type).toBe("rage");
      expect(entity.resources.max).toBe(100);
      expect(entity.resources.current).toBe(0);

      // Verify attack power (Warrior is strength-based)
      const expectedAP = classDef.baseStats.strength * 2;
      expect(entity.effectiveStats.attackPower).toBe(expectedAP);

      // Verify abilities were mapped
      expect(entity.abilities.length).toBe(2);
      expect(entity.rotation.length).toBe(2);

      // Verify weapon defaults (no weapon equipped)
      expect(entity.effectiveStats.weaponDamageMin).toBe(1);
      expect(entity.effectiveStats.weaponDamageMax).toBe(2);
      expect(entity.effectiveStats.weaponSpeed).toBe(2.0);
      expect(entity.equipment.weaponDps).toBe(0);
    });

    it("should build a level 1 Warrior with a weapon equipped", () => {
      // Arrange
      const classDef = getClass("warrior")!;
      const character: CharacterState = {
        id: 2,
        name: "ArmedWarrior",
        race: "human",
        className: "warrior",
        level: 1,
        xp: 0,
        restedXp: 0,
        gold: 0,
        currentZone: "zone_greenhollow_vale" as any,
        activity: "idle",
        activeSpec: "arms",
        talentPoints: {},
        equipment: {
          head: null,
          neck: null,
          shoulders: null,
          back: null,
          chest: null,
          wrists: null,
          hands: null,
          waist: null,
          legs: null,
          feet: null,
          finger1: null,
          finger2: null,
          trinket1: null,
          trinket2: null,
          main_hand: 1,
          off_hand: null,
          ranged: null,
        },
        stats: {} as any,
        companionClears: {},
        createdAt: Date.now(),
        lastPlayedAt: Date.now(),
      };

      const abilities = getAbilitiesByClass("warrior").slice(0, 2);

      // Get the Farmer's Pitchfork weapon
      const weapon = getItem(makeItemId("item_farmers_pitchfork"))!;
      expect(weapon).toBeDefined();

      const equippedItems: Array<{ slot: GearSlot; item: ItemDefinition }> = [
        { slot: "main_hand", item: weapon },
      ];

      // Act
      const entity = buildPlayerEntity(character, classDef, abilities, equippedItems);

      // Assert
      // Verify weapon stats were added
      expect(entity.effectiveStats.strength).toBe(classDef.baseStats.strength + (weapon.stats.strength ?? 0));
      expect(entity.effectiveStats.weaponDamageMin).toBe(weapon.weaponDamageMin);
      expect(entity.effectiveStats.weaponDamageMax).toBe(weapon.weaponDamageMax);
      expect(entity.effectiveStats.weaponSpeed).toBe(weapon.weaponSpeed);

      // Verify equipment summary
      const avgDamage = (weapon.weaponDamageMin! + weapon.weaponDamageMax!) / 2;
      const expectedDps = avgDamage / weapon.weaponSpeed!;
      expect(entity.equipment.weaponDps).toBeCloseTo(expectedDps, 2);
      expect(entity.equipment.weaponSpeed).toBe(weapon.weaponSpeed);
    });

    it("should calculate stats correctly for a level 5 Mage", () => {
      // Arrange
      const classDef = getClass("mage")!;
      const character: CharacterState = {
        id: 3,
        name: "TestMage",
        race: "elf",
        className: "mage",
        level: 5,
        xp: 0,
        restedXp: 0,
        gold: 0,
        currentZone: "zone_greenhollow_vale" as any,
        activity: "idle",
        activeSpec: "fire",
        talentPoints: {},
        equipment: {
          head: null,
          neck: null,
          shoulders: null,
          back: null,
          chest: null,
          wrists: null,
          hands: null,
          waist: null,
          legs: null,
          feet: null,
          finger1: null,
          finger2: null,
          trinket1: null,
          trinket2: null,
          main_hand: null,
          off_hand: null,
          ranged: null,
        },
        stats: {} as any,
        companionClears: {},
        createdAt: Date.now(),
        lastPlayedAt: Date.now(),
      };

      const abilities = getAbilitiesByClass("mage").slice(0, 2);
      const equippedItems: Array<{ slot: GearSlot; item: ItemDefinition }> = [];

      // Act
      const entity = buildPlayerEntity(character, classDef, abilities, equippedItems);

      // Assert
      expect(entity.level).toBe(5);

      // Verify level-scaled stats
      // Formula: baseStats + perLevelGains * (level - 1)
      const expectedInt = classDef.baseStats.intellect + classDef.perLevelGains.intellect * 4;
      expect(entity.effectiveStats.intellect).toBeCloseTo(expectedInt, 1);

      const expectedStam = classDef.baseStats.stamina + classDef.perLevelGains.stamina * 4;
      expect(entity.effectiveStats.stamina).toBeCloseTo(expectedStam, 1);

      // Verify mana calculation
      const expectedMana = expectedInt * 15 + classDef.classBaseMana;
      expect(entity.effectiveStats.maxMana).toBeCloseTo(expectedMana, 1);

      // Mages use mana
      expect(entity.resources.type).toBe("mana");
      expect(entity.resources.current).toBeCloseTo(expectedMana, 1);
      expect(entity.resources.max).toBeCloseTo(expectedMana, 1);
    });

    it("should include armor from equipped chest piece", () => {
      // Arrange
      const classDef = getClass("rogue")!;
      const character: CharacterState = {
        id: 4,
        name: "TestRogue",
        race: "human",
        className: "rogue",
        level: 2,
        xp: 0,
        restedXp: 0,
        gold: 0,
        currentZone: "zone_greenhollow_vale" as any,
        activity: "idle",
        activeSpec: "combat",
        talentPoints: {},
        equipment: {
          head: null,
          neck: null,
          shoulders: null,
          back: null,
          chest: 1,
          wrists: null,
          hands: null,
          waist: null,
          legs: null,
          feet: null,
          finger1: null,
          finger2: null,
          trinket1: null,
          trinket2: null,
          main_hand: null,
          off_hand: null,
          ranged: null,
        },
        stats: {} as any,
        companionClears: {},
        createdAt: Date.now(),
        lastPlayedAt: Date.now(),
      };

      const abilities = getAbilitiesByClass("rogue").slice(0, 1);

      // Get the Wolf Hide Vest
      const chest = getItem(makeItemId("item_wolf_hide_vest"))!;
      expect(chest).toBeDefined();

      const equippedItems: Array<{ slot: GearSlot; item: ItemDefinition }> = [
        { slot: "chest", item: chest },
      ];

      // Act
      const entity = buildPlayerEntity(character, classDef, abilities, equippedItems);

      // Assert
      expect(entity.effectiveStats.armor).toBe(chest.armorValue);
      expect(entity.effectiveStats.agility).toBe(
        classDef.baseStats.agility +
        classDef.perLevelGains.agility * (character.level - 1) +
        (chest.stats.agility ?? 0)
      );
      expect(entity.effectiveStats.stamina).toBeCloseTo(
        classDef.baseStats.stamina +
        classDef.perLevelGains.stamina * (character.level - 1) +
        (chest.stats.stamina ?? 0),
        1
      );
    });

    it("should correctly map abilities to AbilityInstances", () => {
      // Arrange
      const classDef = getClass("warrior")!;
      const character: CharacterState = {
        id: 5,
        name: "TestWarrior",
        race: "human",
        className: "warrior",
        level: 1,
        xp: 0,
        restedXp: 0,
        gold: 0,
        currentZone: "zone_greenhollow_vale" as any,
        activity: "idle",
        activeSpec: "arms",
        talentPoints: {},
        equipment: {} as any,
        stats: {} as any,
        companionClears: {},
        createdAt: Date.now(),
        lastPlayedAt: Date.now(),
      };

      const abilities = getAbilitiesByClass("warrior").slice(0, 2);
      expect(abilities.length).toBeGreaterThanOrEqual(2);

      // Act
      const entity = buildPlayerEntity(character, classDef, abilities, []);

      // Assert
      expect(entity.abilities.length).toBe(2);

      const firstAbility = entity.abilities[0];
      expect(firstAbility.id).toBe(abilities[0].id);
      expect(firstAbility.name).toBe(abilities[0].name);
      expect(firstAbility.resourceCost).toBe(abilities[0].resourceCost);
      expect(firstAbility.resourceType).toBe(abilities[0].resourceType);
      expect(firstAbility.cooldownMs).toBe(abilities[0].cooldown * 1000);
      expect(firstAbility.castTimeMs).toBe(abilities[0].castTime * 1000);
    });

    it("should build rotation ordered by priority", () => {
      // Arrange
      const classDef = getClass("warrior")!;
      const character: CharacterState = {
        id: 6,
        name: "TestWarrior",
        race: "human",
        className: "warrior",
        level: 1,
        xp: 0,
        restedXp: 0,
        gold: 0,
        currentZone: "zone_greenhollow_vale" as any,
        activity: "idle",
        activeSpec: "arms",
        talentPoints: {},
        equipment: {} as any,
        stats: {} as any,
        companionClears: {},
        createdAt: Date.now(),
        lastPlayedAt: Date.now(),
      };

      const abilities = getAbilitiesByClass("warrior").slice(0, 2);

      // Act
      const entity = buildPlayerEntity(character, classDef, abilities, []);

      // Assert
      expect(entity.rotation.length).toBe(2);

      // Rotation should be sorted by priority (lower number = higher priority)
      for (let i = 0; i < entity.rotation.length - 1; i++) {
        expect(entity.rotation[i].priority).toBeLessThanOrEqual(entity.rotation[i + 1].priority);
      }

      // Each rotation entry should have an abilityId and condition
      entity.rotation.forEach((entry) => {
        expect(entry.abilityId).toBeDefined();
        expect(entry.condition).toBeDefined();
      });
    });
  });

  describe("buildMobEntity", () => {
    it("should build a Cellar Rat mob entity", () => {
      // Arrange
      const mob = getMob("mob_cellar_rat" as any)!;
      expect(mob).toBeDefined();

      // Act
      const entity = buildMobEntity(mob);

      // Assert
      expect(entity.name).toBe("Cellar Rat");
      expect(entity.entityType).toBe("enemy");
      expect(entity.role).toBe("dps");
      expect(entity.classId).toBe("mob");
      expect(entity.specId).toBe(mob.id);
      expect(entity.level).toBe(1);

      // Verify HP from mob definition
      expect(entity.effectiveStats.maxHp).toBe(50);

      // Verify armor
      expect(entity.effectiveStats.armor).toBe(5);

      // Verify weapon stats
      expect(entity.effectiveStats.weaponDamageMin).toBe(3);
      expect(entity.effectiveStats.weaponDamageMax).toBe(5);
      expect(entity.effectiveStats.weaponSpeed).toBe(2.0);

      // Verify equipment summary
      const avgDamage = (3 + 5) / 2;
      const expectedDps = avgDamage / 2.0;
      expect(entity.equipment.weaponDps).toBe(expectedDps);

      // Cellar rat has no abilities
      expect(entity.abilities.length).toBe(0);
      expect(entity.rotation.length).toBe(0);

      // Verify resource (should default to rage for mobs without mana)
      expect(entity.resources.type).toBe("rage");
    });

    it("should build Bandit Leader Kragg with ability", () => {
      // Arrange
      const mob = getMob("mob_kragg" as any)!;
      expect(mob).toBeDefined();
      expect(mob.abilities.length).toBeGreaterThan(0);

      // Act
      const entity = buildMobEntity(mob);

      // Assert
      expect(entity.name).toBe("Bandit Leader Kragg");
      expect(entity.level).toBe(5);
      expect(entity.effectiveStats.maxHp).toBe(800);
      expect(entity.effectiveStats.armor).toBe(80);

      // Verify Kragg has an ability
      expect(entity.abilities.length).toBe(1);
      expect(entity.abilities[0].name).toBe("Cleave");
      expect(entity.abilities[0].baseDamage).toBe(40);
      expect(entity.abilities[0].damageType).toBe("physical");
      expect(entity.abilities[0].cooldownMs).toBe(6000); // 6 seconds in ms
      expect(entity.abilities[0].isAoE).toBe(true); // Cone frontal is AoE

      // Verify rotation
      expect(entity.rotation.length).toBe(1);
      expect(entity.rotation[0].abilityId).toBe("kragg_cleave");
      expect(entity.rotation[0].condition?.type).toBe("always");
    });

    it("should handle elite and boss flags", () => {
      // Arrange
      const regularMob = getMob("mob_cellar_rat" as any)!;
      const bossMob = getMob("mob_kragg" as any)!;

      // Act
      const regularEntity = buildMobEntity(regularMob);
      const bossEntity = buildMobEntity(bossMob);

      // Assert
      // Both should be DPS role for now
      expect(regularEntity.role).toBe("dps");
      expect(bossEntity.role).toBe("dps");
    });

    it("should set mob attack power based on damage", () => {
      // Arrange
      const mob = getMob("mob_kragg" as any)!;

      // Act
      const entity = buildMobEntity(mob);

      // Assert
      // Attack power is approximated from average melee damage
      const expectedAP = (mob.meleeDamageMin + mob.meleeDamageMax) / 2;
      expect(entity.effectiveStats.attackPower).toBe(expectedAP);
    });

    it("should handle mobs with multiple abilities", () => {
      // Arrange
      const mob = getMob("mob_kragg" as any)!;

      // Manually add a second ability for testing
      const modifiedMob: MobDefinition = {
        ...mob,
        abilities: [
          ...mob.abilities,
          {
            id: "kragg_rage",
            name: "Enrage",
            damageType: "physical",
            castTime: 0,
            cooldown: 15,
            damage: 0,
            targetType: "self",
          },
        ],
      };

      // Act
      const entity = buildMobEntity(modifiedMob);

      // Assert
      expect(entity.abilities.length).toBe(2);
      expect(entity.rotation.length).toBe(2);

      // Rotation should be sorted by cooldown (Cleave 6s before Enrage 15s)
      expect(entity.rotation[0].priority).toBeLessThan(entity.rotation[1].priority);
    });
  });
});
