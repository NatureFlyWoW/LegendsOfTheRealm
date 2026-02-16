// tests/game/engine/ProgressionService.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { ProgressionService } from "@game/engine/ProgressionService";
import { EventBus } from "@game/engine/EventBus";
import type { CharacterState } from "@shared/types";
import type { GameEvent } from "@shared/events";
import { ClassName } from "@shared/enums";
import { makeZoneId } from "@shared/types";
import { getXpForLevel } from "@game/data";

function makeTestCharacter(level: number, xp: number): CharacterState {
  return {
    id: 1,
    name: "TestChar",
    race: "human",
    className: ClassName.Warrior,
    level,
    xp,
    restedXp: 0,
    gold: 0,
    currentZone: makeZoneId("zone_1"),
    activity: "idle",
    activeSpec: "protection",
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
      ring1: null,
      ring2: null,
      trinket1: null,
      trinket2: null,
      mainhand: null,
      offhand: null,
      ranged: null,
    },
    stats: {
      strength: 20,
      agility: 10,
      intellect: 10,
      stamina: 15,
      spirit: 10,
      maxHp: 100,
      maxMana: 50,
      attackPower: 40,
      spellPower: 10,
      armor: 50,
      critChance: 5,
      hitChance: 95,
      hastePercent: 0,
      dodgeChance: 5,
      parryChance: 5,
      blockChance: 10,
      blockValue: 20,
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
  };
}

describe("ProgressionService", () => {
  let eventBus: EventBus;
  let service: ProgressionService;
  let emittedEvents: GameEvent[];

  beforeEach(() => {
    eventBus = new EventBus();
    service = new ProgressionService(eventBus);
    emittedEvents = [];
    eventBus.onAny((event) => emittedEvents.push(event));
  });

  describe("awardXp", () => {
    it("awards XP below threshold without leveling up", () => {
      const char = makeTestCharacter(1, 0);
      const result = service.awardXp(char, 500);

      expect(result.levelsGained).toBe(0);
      expect(result.oldLevel).toBe(1);
      expect(result.newLevel).toBe(1);
      expect(char.xp).toBe(500);
      expect(char.level).toBe(1);
      expect(result.events).toHaveLength(0);
      expect(emittedEvents).toHaveLength(0);
    });

    it("awards XP exactly at threshold and levels up", () => {
      const char = makeTestCharacter(1, 0);
      const initialStats = { ...char.stats };

      // Level 1 -> 2 requires 1000 XP
      const result = service.awardXp(char, 1000);

      expect(result.levelsGained).toBe(1);
      expect(result.oldLevel).toBe(1);
      expect(result.newLevel).toBe(2);
      expect(char.xp).toBe(0);
      expect(char.level).toBe(2);
      expect(result.events).toHaveLength(1);

      // Verify stat gains (Warrior gains: str 2.5, agi 1, int 0.5, sta 2, spi 0.8)
      expect(char.stats.strength).toBeCloseTo(initialStats.strength + 2.5);
      expect(char.stats.agility).toBeCloseTo(initialStats.agility + 1);
      expect(char.stats.intellect).toBeCloseTo(initialStats.intellect + 0.5);
      expect(char.stats.stamina).toBeCloseTo(initialStats.stamina + 2);
      expect(char.stats.spirit).toBeCloseTo(initialStats.spirit + 0.8);

      // Verify event
      expect(emittedEvents).toHaveLength(1);
      expect(emittedEvents[0]).toMatchObject({
        type: "CHARACTER_LEVELED",
        characterId: 1,
        newLevel: 2,
      });
      expect(emittedEvents[0].timestamp).toBeGreaterThan(0);
    });

    it("awards XP above threshold and levels up with leftover XP", () => {
      const char = makeTestCharacter(1, 0);

      // Level 1 -> 2 requires 1000 XP, give 1250
      const result = service.awardXp(char, 1250);

      expect(result.levelsGained).toBe(1);
      expect(result.oldLevel).toBe(1);
      expect(result.newLevel).toBe(2);
      expect(char.xp).toBe(250); // leftover
      expect(char.level).toBe(2);
      expect(result.events).toHaveLength(1);
    });

    it("awards large XP crossing multiple levels", () => {
      const char = makeTestCharacter(1, 0);
      const initialStats = { ...char.stats };

      // Level 1 -> 2: 1000 XP
      // Level 2 -> 3: 5278 XP
      // Total to reach level 3: 6278 XP
      // Give 7000 XP to cross two levels
      const result = service.awardXp(char, 7000);

      expect(result.levelsGained).toBe(2);
      expect(result.oldLevel).toBe(1);
      expect(result.newLevel).toBe(3);
      expect(char.xp).toBe(7000 - 1000 - 5278); // 722
      expect(char.level).toBe(3);
      expect(result.events).toHaveLength(2);

      // Verify stat gains applied twice (Warrior: str +2.5, agi +1, int +0.5, sta +2, spi +0.8 per level)
      expect(char.stats.strength).toBeCloseTo(initialStats.strength + 5); // +2.5 per level * 2 levels
      expect(char.stats.agility).toBeCloseTo(initialStats.agility + 2); // +1 per level * 2 levels
      expect(char.stats.intellect).toBeCloseTo(initialStats.intellect + 1); // +0.5 per level * 2 levels
      expect(char.stats.stamina).toBeCloseTo(initialStats.stamina + 4); // +2 per level * 2 levels
      expect(char.stats.spirit).toBeCloseTo(initialStats.spirit + 1.6); // +0.8 per level * 2 levels

      // Verify two events emitted
      expect(emittedEvents).toHaveLength(2);
      expect(emittedEvents[0].type).toBe("CHARACTER_LEVELED");
      expect(emittedEvents[0]).toMatchObject({ characterId: 1, newLevel: 2 });
      expect(emittedEvents[1].type).toBe("CHARACTER_LEVELED");
      expect(emittedEvents[1]).toMatchObject({ characterId: 1, newLevel: 3 });
    });

    it("awards XP to character already at higher level", () => {
      const char = makeTestCharacter(5, 100);

      // Level 5 -> 6 requires 47591 XP (from xp-curves.json)
      const result = service.awardXp(char, 50000);

      expect(result.levelsGained).toBe(1);
      expect(result.oldLevel).toBe(5);
      expect(result.newLevel).toBe(6);
      expect(char.xp).toBe(50000 + 100 - 47591); // 2509
      expect(char.level).toBe(6);
    });

    it("handles XP award that crosses many levels", () => {
      const char = makeTestCharacter(1, 0);

      // Award enough XP to go from level 1 to level 10
      // Sum XP for levels 1-9: 1000 + 5278 + 13967 + 27858 + 47591 + 73716 + 106717 + 147033 + 195066 = 618226
      // Let's give 700000 to ensure we cross many levels
      const result = service.awardXp(char, 700000);

      expect(result.levelsGained).toBeGreaterThanOrEqual(8);
      expect(char.level).toBeGreaterThanOrEqual(9);
      expect(result.oldLevel).toBe(1);
    });

    it("verifies events are emitted via EventBus for each level", () => {
      const char = makeTestCharacter(1, 0);
      const handler = vi.fn();

      eventBus.on("CHARACTER_LEVELED", handler);
      service.awardXp(char, 7000); // Should level to 3 (2 level-ups)

      expect(handler).toHaveBeenCalledTimes(2);
      expect(handler).toHaveBeenNthCalledWith(1, expect.objectContaining({
        type: "CHARACTER_LEVELED",
        characterId: 1,
        newLevel: 2,
      }));
      expect(handler).toHaveBeenNthCalledWith(2, expect.objectContaining({
        type: "CHARACTER_LEVELED",
        characterId: 1,
        newLevel: 3,
      }));
    });

    it("returns correct events in result", () => {
      const char = makeTestCharacter(1, 0);
      const result = service.awardXp(char, 7000);

      expect(result.events).toHaveLength(2);
      expect(result.events[0]).toMatchObject({
        type: "CHARACTER_LEVELED",
        characterId: 1,
        newLevel: 2,
      });
      expect(result.events[1]).toMatchObject({
        type: "CHARACTER_LEVELED",
        characterId: 1,
        newLevel: 3,
      });
    });

    it("handles XP award with existing XP pool", () => {
      const char = makeTestCharacter(1, 800);

      // Already has 800 XP, add 300 more = 1100 total
      // Should level up once (1000 threshold) with 100 leftover
      const result = service.awardXp(char, 300);

      expect(result.levelsGained).toBe(1);
      expect(char.level).toBe(2);
      expect(char.xp).toBe(100);
    });

    it("uses correct XP threshold for each level", () => {
      // Verify the service uses getXpForLevel correctly
      const char = makeTestCharacter(1, 0);

      // Level 1->2 threshold is 1000
      expect(getXpForLevel(1)).toBe(1000);
      service.awardXp(char, 1000);
      expect(char.level).toBe(2);
      expect(char.xp).toBe(0);

      // Level 2->3 threshold is 5278
      expect(getXpForLevel(2)).toBe(5278);
      service.awardXp(char, 5278);
      expect(char.level).toBe(3);
      expect(char.xp).toBe(0);
    });

    it("throws error for unknown class definition", () => {
      const char = makeTestCharacter(1, 0);
      char.className = "invalid_class" as any;

      expect(() => service.awardXp(char, 1000)).toThrow("Class definition not found: invalid_class");
    });
  });
});
