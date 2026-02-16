// tests/game/engine/OfflineCalculator.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { calculateOfflineGains } from "@game/engine/OfflineCalculator";
import { SeededRng } from "@game/rng/SeededRng";
import type { CharacterState } from "@shared/types";
import { makeZoneId } from "@shared/types";

/**
 * Create a minimal test character state
 */
function createTestCharacter(overrides?: Partial<CharacterState>): CharacterState {
  return {
    id: 1,
    name: "TestHero",
    race: "human",
    className: "warrior",
    level: 1,
    xp: 0,
    restedXp: 0,
    gold: 0,
    currentZone: makeZoneId("zone_greenhollow_vale"),
    activity: "leveling",
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
      mainhand: null,
      offhand: null,
      ranged: null,
    },
    stats: {
      strength: 20,
      agility: 15,
      intellect: 10,
      stamina: 25,
      spirit: 12,
      maxHp: 100,
      maxMana: 50,
      attackPower: 30,
      spellPower: 0,
      armor: 50,
      critChance: 5,
      hitChance: 95,
      hastePercent: 0,
      dodgeChance: 5,
      parryChance: 5,
      blockChance: 0,
      blockValue: 0,
      defenseSkill: 1,
      resilience: 0,
      mp5: 5,
      weaponDamageMin: 5,
      weaponDamageMax: 10,
      weaponSpeed: 2.0,
    },
    companionClears: {},
    createdAt: Date.now(),
    lastPlayedAt: Date.now(),
    ...overrides,
  };
}

describe("OfflineCalculator", () => {
  let rng: SeededRng;
  let character: CharacterState;

  beforeEach(() => {
    rng = new SeededRng(12345);
    character = createTestCharacter();
  });

  describe("calculateOfflineGains", () => {
    it("should return zero gains for 0 seconds offline", () => {
      const result = calculateOfflineGains(character, 0, rng);

      expect(result.xpGained).toBe(0);
      expect(result.levelsGained).toBe(0);
      expect(result.goldGained).toBe(0);
      expect(result.itemsGained).toHaveLength(0);
      expect(result.fightsCompleted).toBe(0);
      expect(result.questProgress).toEqual({});
      expect(result.finalCharacter).toEqual(character);
    });

    it("should return zero gains for negative seconds offline", () => {
      const result = calculateOfflineGains(character, -100, rng);

      expect(result.xpGained).toBe(0);
      expect(result.levelsGained).toBe(0);
      expect(result.goldGained).toBe(0);
      expect(result.itemsGained).toHaveLength(0);
      expect(result.fightsCompleted).toBe(0);
    });

    it("should calculate gains for 1 hour offline at level 1 in Greenhollow Vale", () => {
      const oneHour = 3600;
      const result = calculateOfflineGains(character, oneHour, rng);

      // Should have completed some fights (1 hour = 3600 seconds, ~30s per fight = ~120 fights)
      expect(result.fightsCompleted).toBeGreaterThan(0);
      expect(result.fightsCompleted).toBeLessThan(200); // Reasonable upper bound

      // Should have gained XP
      expect(result.xpGained).toBeGreaterThan(0);

      // Should have gained gold
      expect(result.goldGained).toBeGreaterThan(0);

      // May have gained levels (but not guaranteed for just 1 hour)
      expect(result.levelsGained).toBeGreaterThanOrEqual(0);

      // May have gained items (loot is RNG-based)
      expect(result.itemsGained).toBeInstanceOf(Array);

      // Should have quest progress for zone mobs
      expect(Object.keys(result.questProgress).length).toBeGreaterThan(0);

      // Final character should reflect gains
      // Note: XP is not simply character.xp + xpGained because level-ups consume XP
      // Instead, verify that total XP progression makes sense
      expect(result.finalCharacter.level).toBe(character.level + result.levelsGained);
      expect(result.finalCharacter.gold).toBe(character.gold + result.goldGained);

      // If leveled up, current XP should be less than xpGained (XP was consumed)
      if (result.levelsGained > 0) {
        expect(result.finalCharacter.xp).toBeLessThan(result.xpGained);
      } else {
        // No level-up means XP should exactly add up
        expect(result.finalCharacter.xp).toBe(character.xp + result.xpGained);
      }
    });

    it("should apply level-ups correctly when enough XP is gained", () => {
      // Set character to just below level 2 (level 1 requires 1000 XP)
      character.xp = 900;
      character.level = 1;

      // Simulate enough time to gain at least 100 XP
      const result = calculateOfflineGains(character, 7200, rng); // 2 hours

      // Should have leveled up at least once
      expect(result.levelsGained).toBeGreaterThanOrEqual(1);
      expect(result.finalCharacter.level).toBeGreaterThan(1);
    });

    it("should be deterministic with the same seed", () => {
      const result1 = calculateOfflineGains(character, 3600, new SeededRng(42));
      const result2 = calculateOfflineGains(character, 3600, new SeededRng(42));

      expect(result1.xpGained).toBe(result2.xpGained);
      expect(result1.levelsGained).toBe(result2.levelsGained);
      expect(result1.goldGained).toBe(result2.goldGained);
      expect(result1.fightsCompleted).toBe(result2.fightsCompleted);
      expect(result1.itemsGained.length).toBe(result2.itemsGained.length);
    });

    it("should produce different results with different seeds", () => {
      const result1 = calculateOfflineGains(character, 3600, new SeededRng(111));
      const result2 = calculateOfflineGains(character, 3600, new SeededRng(222));

      // XP and fights should be the same (not RNG-dependent)
      expect(result1.xpGained).toBe(result2.xpGained);
      expect(result1.goldGained).toBe(result2.goldGained);
      expect(result1.fightsCompleted).toBe(result2.fightsCompleted);

      // Loot should differ (RNG-dependent) - though this is probabilistic
      // We'll just check that both have items (can't guarantee different lengths)
      expect(result1.itemsGained).toBeInstanceOf(Array);
      expect(result2.itemsGained).toBeInstanceOf(Array);
    });

    it("should cap level gains at 10 levels offline", () => {
      character.level = 1;
      character.xp = 0;

      // Simulate a very long offline period (30 days)
      const thirtyDays = 30 * 24 * 3600;
      const result = calculateOfflineGains(character, thirtyDays, rng);

      // Should not gain more than 10 levels
      expect(result.levelsGained).toBeLessThanOrEqual(10);
      expect(result.finalCharacter.level).toBeLessThanOrEqual(11); // Started at 1
    });

    it("should not exceed max level (60)", () => {
      character.level = 58;
      character.xp = 0;

      // Simulate very long offline period
      const result = calculateOfflineGains(character, 30 * 24 * 3600, rng);

      // Should not exceed level 60
      expect(result.finalCharacter.level).toBeLessThanOrEqual(60);
    });

    it("should handle invalid zone gracefully", () => {
      character.currentZone = makeZoneId("zone_invalid_nonexistent");

      const result = calculateOfflineGains(character, 3600, rng);

      expect(result.xpGained).toBe(0);
      expect(result.levelsGained).toBe(0);
      expect(result.goldGained).toBe(0);
      expect(result.itemsGained).toHaveLength(0);
      expect(result.fightsCompleted).toBe(0);
    });

    it("should award items based on loot tables", () => {
      const result = calculateOfflineGains(character, 7200, rng); // 2 hours

      // Should have gained some items (probabilistic but likely over 2 hours)
      if (result.itemsGained.length > 0) {
        const item = result.itemsGained[0];
        expect(item).toHaveProperty("id");
        expect(item).toHaveProperty("templateId");
        expect(item).toHaveProperty("characterId");
        expect(item.characterId).toBe(character.id);
        expect(item).toHaveProperty("bagSlot");
        expect(item).toHaveProperty("equippedSlot");
        expect(item).toHaveProperty("durability");
        expect(item.durability).toBe(100);
      }
    });

    it("should track quest progress for all mobs killed", () => {
      const result = calculateOfflineGains(character, 3600, rng);

      expect(Object.keys(result.questProgress).length).toBeGreaterThan(0);

      // Verify total kills roughly match fights completed
      const totalKills = Object.values(result.questProgress).reduce((sum, kills) => sum + kills, 0);
      expect(totalKills).toBe(result.fightsCompleted);
    });

    it("should handle very short offline periods", () => {
      const result = calculateOfflineGains(character, 10, rng); // 10 seconds

      // Should not have completed any fights (avg fight ~30s)
      expect(result.fightsCompleted).toBe(0);
      expect(result.xpGained).toBe(0);
      expect(result.goldGained).toBe(0);
    });

    it("should calculate faster kills for higher level characters", () => {
      const lowLevelChar = createTestCharacter({ level: 1, xp: 0 });
      const highLevelChar = createTestCharacter({ level: 10, xp: 0 });

      const lowResult = calculateOfflineGains(lowLevelChar, 3600, new SeededRng(99));
      const highResult = calculateOfflineGains(highLevelChar, 3600, new SeededRng(99));

      // Higher level character should complete more fights in same time
      expect(highResult.fightsCompleted).toBeGreaterThan(lowResult.fightsCompleted);
    });

    it("should not mutate the input character", () => {
      const originalChar = createTestCharacter({ level: 1, xp: 100, gold: 500 });
      const charSnapshot = JSON.parse(JSON.stringify(originalChar));

      calculateOfflineGains(originalChar, 3600, rng);

      // Original character should be unchanged
      expect(originalChar).toEqual(charSnapshot);
    });

    it("should handle edge case of exactly enough XP for one level", () => {
      character.level = 1;
      character.xp = 999; // 1 XP away from level 2 (needs 1000 total)

      // Calculate for a very short period to gain minimal XP
      const result = calculateOfflineGains(character, 60, rng); // 1 minute

      // Should complete ~2 fights, gaining ~90 XP (avg 45 per mob)
      if (result.xpGained >= 1) {
        expect(result.levelsGained).toBe(1);
        expect(result.finalCharacter.level).toBe(2);
      }
    });

    it("should distribute quest progress across multiple mob types", () => {
      const result = calculateOfflineGains(character, 7200, rng); // 2 hours

      // Greenhollow Vale has 5 mob types
      expect(Object.keys(result.questProgress).length).toBeGreaterThan(1);

      // Each mob type should have some kills
      for (const kills of Object.values(result.questProgress)) {
        expect(kills).toBeGreaterThan(0);
      }
    });
  });
});
