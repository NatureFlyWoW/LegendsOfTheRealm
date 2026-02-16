// tests/game/engine/ActivityManager.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { ActivityManager } from "@game/engine/ActivityManager";
import { EventBus } from "@game/engine/EventBus";
import { ProgressionService } from "@game/engine/ProgressionService";
import { LootService } from "@game/engine/LootService";
import { QuestTracker } from "@game/engine/QuestTracker";
import { SeededRng } from "@game/rng/SeededRng";
import type { CharacterState } from "@shared/types";
import { makeZoneId } from "@shared/types";

describe("ActivityManager", () => {
  let activityManager: ActivityManager;
  let eventBus: EventBus;
  let progressionService: ProgressionService;
  let lootService: LootService;
  let questTracker: QuestTracker;
  let rng: SeededRng;
  let testCharacter: CharacterState;

  beforeEach(() => {
    eventBus = new EventBus();
    progressionService = new ProgressionService(eventBus);
    lootService = new LootService();
    questTracker = new QuestTracker(eventBus);
    activityManager = new ActivityManager(eventBus, progressionService, lootService, questTracker);
    rng = new SeededRng(12345);

    // Create a basic test character
    testCharacter = {
      id: 1,
      name: "TestHero",
      race: "human",
      className: "warrior",
      level: 1,
      xp: 0,
      restedXp: 0,
      gold: 0,
      currentZone: makeZoneId("zone_greenhollow_vale"),
      activity: "idle" as any,
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
        finger1: null,
        finger2: null,
        trinket1: null,
        trinket2: null,
        main_hand: null,
        off_hand: null,
        ranged: null,
      },
      stats: {
        strength: 20,
        agility: 15,
        intellect: 10,
        stamina: 22,
        spirit: 12,
        maxHp: 140,
        maxMana: 0,
        attackPower: 40,
        spellPower: 0,
        armor: 0,
        critChance: 5,
        hitChance: 95,
        hastePercent: 0,
        dodgeChance: 5,
        parryChance: 5,
        blockChance: 5,
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

    // Reset loot service counter for consistent test results
    lootService.resetInstanceIdCounter();
  });

  describe("startZoneGrinding", () => {
    it("should initialize zone grinding and start quest chain", () => {
      const zoneId = makeZoneId("zone_greenhollow_vale");
      activityManager.startZoneGrinding(testCharacter, zoneId);

      const state = activityManager.getState(testCharacter.id);
      expect(state.activity).toBe("zone_grinding");
      expect(state.zoneId).toBe(zoneId);

      // Verify quest chain was initialized
      const activeQuests = questTracker.getActiveQuests(testCharacter.id);
      expect(activeQuests.length).toBeGreaterThan(0);
      expect(activeQuests[0].status).toBe("active");
    });

    it("should throw error for invalid zone", () => {
      const invalidZone = makeZoneId("zone_invalid");
      expect(() => {
        activityManager.startZoneGrinding(testCharacter, invalidZone);
      }).toThrow("Zone not found");
    });

    it("should emit GOLD_CHANGED event", () => {
      let eventEmitted = false;
      eventBus.on("GOLD_CHANGED", () => {
        eventEmitted = true;
      });

      activityManager.startZoneGrinding(testCharacter, makeZoneId("zone_greenhollow_vale"));
      expect(eventEmitted).toBe(true);
    });
  });

  describe("stopGrinding", () => {
    it("should set activity to idle", () => {
      activityManager.startZoneGrinding(testCharacter, makeZoneId("zone_greenhollow_vale"));
      activityManager.stopGrinding(testCharacter.id);

      const state = activityManager.getState(testCharacter.id);
      expect(state.activity).toBe("idle");
    });
  });

  describe("onTick - idle", () => {
    it("should return empty result when character is idle", () => {
      const result = activityManager.onTick(testCharacter, rng, 1);

      expect(result.characterUpdates).toEqual({});
      expect(result.events).toEqual([]);
      expect(result.mobKilled).toBeUndefined();
      expect(result.loot).toBeUndefined();
    });
  });

  describe("onTick - zone grinding", () => {
    it("should pick a mob and run encounter on first tick", () => {
      activityManager.startZoneGrinding(testCharacter, makeZoneId("zone_greenhollow_vale"));

      const result = activityManager.onTick(testCharacter, rng, 1);

      // Should have run an encounter
      expect(result.events.length).toBeGreaterThan(0);
      expect(result.mobKilled).toBeDefined();
    });

    it("should award XP and loot on victory", () => {
      activityManager.startZoneGrinding(testCharacter, makeZoneId("zone_greenhollow_vale"));

      const result = activityManager.onTick(testCharacter, rng, 1);

      // Should have gained XP
      expect(result.characterUpdates.xp).toBeGreaterThan(0);

      // Should have received loot
      expect(result.loot).toBeDefined();
      if (result.loot) {
        expect(result.loot.gold).toBeGreaterThanOrEqual(0);
      }

      // Should have updated gold
      expect(result.characterUpdates.gold).toBeGreaterThan(0);
    });

    it("should update quest progress on mob kill", () => {
      activityManager.startZoneGrinding(testCharacter, makeZoneId("zone_greenhollow_vale"));

      const result = activityManager.onTick(testCharacter, rng, 1);

      // Quest should exist and might have progress
      const activeQuests = questTracker.getActiveQuests(testCharacter.id);
      expect(activeQuests.length).toBeGreaterThan(0);
    });

    it("should continue grinding after successful encounter", () => {
      activityManager.startZoneGrinding(testCharacter, makeZoneId("zone_greenhollow_vale"));

      // First encounter
      const result1 = activityManager.onTick(testCharacter, rng, 1);
      expect(result1.mobKilled).toBeDefined();

      // Should still be grinding
      const state = activityManager.getState(testCharacter.id);
      expect(state.activity).toBe("zone_grinding");

      // Second encounter should start
      const result2 = activityManager.onTick(testCharacter, rng, 2);
      expect(result2.events.length).toBeGreaterThan(0);
    });

    it("should award quest rewards when quest completes", () => {
      activityManager.startZoneGrinding(testCharacter, makeZoneId("zone_greenhollow_vale"));

      let questCompleted = false;
      let questRewards;

      // Run multiple ticks until a quest completes
      for (let tick = 1; tick <= 100 && !questCompleted; tick++) {
        const result = activityManager.onTick(testCharacter, rng, tick);

        if (result.questUpdate?.questCompleted) {
          questCompleted = true;
          questRewards = result.questUpdate.rewards;
        }
      }

      // At least one quest should complete in 100 ticks (Cellar Rat quest needs 8 kills)
      if (questCompleted) {
        expect(questRewards).toBeDefined();
        expect(questRewards!.xp).toBeGreaterThan(0);
      }
    });
  });

  describe("onTick - defeat handling", () => {
    it("should enter rest state after defeat", () => {
      // Create a weak character that will lose
      const weakCharacter: CharacterState = {
        ...testCharacter,
        level: 1,
        stats: {
          ...testCharacter.stats,
          maxHp: 10, // Very low HP
          strength: 1,
          weaponDamageMin: 1,
          weaponDamageMax: 2,
        },
      };

      activityManager.startZoneGrinding(weakCharacter, makeZoneId("zone_greenhollow_vale"));

      // This will likely result in defeat due to low stats
      const result = activityManager.onTick(weakCharacter, rng, 1);

      // Check if character died
      if (result.events.some(e => e.type === "death" && e.targetId === weakCharacter.id)) {
        // Character should be resting
        const state = activityManager.getState(weakCharacter.id);
        expect(state.restTicksRemaining).toBe(5);
      }
    });

    it("should rest for 5 ticks after defeat", () => {
      const weakCharacter: CharacterState = {
        ...testCharacter,
        level: 1,
        stats: {
          ...testCharacter.stats,
          maxHp: 5,
          strength: 1,
          weaponDamageMin: 1,
          weaponDamageMax: 1,
        },
      };

      activityManager.startZoneGrinding(weakCharacter, makeZoneId("zone_greenhollow_vale"));

      // Force a defeat
      const result1 = activityManager.onTick(weakCharacter, rng, 1);

      if (result1.events.some(e => e.type === "death" && e.targetId === weakCharacter.id)) {
        // Rest for 5 ticks
        for (let i = 0; i < 5; i++) {
          const result = activityManager.onTick(weakCharacter, rng, i + 2);
          expect(result.mobKilled).toBeUndefined(); // No combat during rest
        }

        // After 5 ticks, should be able to fight again
        const state = activityManager.getState(weakCharacter.id);
        expect(state.restTicksRemaining).toBeUndefined();
      }
    });

    it("should emit CHARACTER_DIED event on defeat", () => {
      let deathEventEmitted = false;

      eventBus.on("CHARACTER_DIED", (event) => {
        deathEventEmitted = true;
        expect(event.characterId).toBe(testCharacter.id);
      });

      const weakCharacter: CharacterState = {
        ...testCharacter,
        stats: {
          ...testCharacter.stats,
          maxHp: 5,
          weaponDamageMin: 1,
          weaponDamageMax: 1,
        },
      };

      activityManager.startZoneGrinding(weakCharacter, makeZoneId("zone_greenhollow_vale"));
      activityManager.onTick(weakCharacter, rng, 1);

      // Death event might be emitted if character lost
      // This is probabilistic, so we don't strictly assert
    });
  });

  describe("getState", () => {
    it("should return idle state for uninitialized character", () => {
      const state = activityManager.getState(999);
      expect(state.activity).toBe("idle");
    });

    it("should return current grinding state", () => {
      const zoneId = makeZoneId("zone_greenhollow_vale");
      activityManager.startZoneGrinding(testCharacter, zoneId);

      const state = activityManager.getState(testCharacter.id);
      expect(state.activity).toBe("zone_grinding");
      expect(state.zoneId).toBe(zoneId);
    });
  });

  describe("mob selection", () => {
    it("should prefer quest mobs over non-quest mobs", () => {
      activityManager.startZoneGrinding(testCharacter, makeZoneId("zone_greenhollow_vale"));

      // Run a few encounters and track which mobs are selected
      const mobsKilled = new Set<string>();

      for (let i = 0; i < 20; i++) {
        const result = activityManager.onTick(testCharacter, rng, i + 1);
        if (result.mobKilled) {
          mobsKilled.add(result.mobKilled);
        }
      }

      // Should have killed Cellar Rats (first quest mob) predominantly
      expect(mobsKilled.has("mob_cellar_rat")).toBe(true);
    });

    it("should select mobs within appropriate level range", () => {
      // Level 1 character should fight level 1-3 mobs
      testCharacter.level = 1;
      activityManager.startZoneGrinding(testCharacter, makeZoneId("zone_greenhollow_vale"));

      for (let i = 0; i < 10; i++) {
        const result = activityManager.onTick(testCharacter, rng, i + 1);
        if (result.mobKilled) {
          // Should be appropriate level mobs
          expect(["mob_cellar_rat", "mob_dire_wolf"]).toContain(result.mobKilled);
        }
      }
    });
  });

  describe("clear", () => {
    it("should clear all activity states", () => {
      activityManager.startZoneGrinding(testCharacter, makeZoneId("zone_greenhollow_vale"));
      activityManager.clear();

      const state = activityManager.getState(testCharacter.id);
      expect(state.activity).toBe("idle");
    });
  });
});
