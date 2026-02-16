// tests/game/engine/QuestTracker.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { QuestTracker } from "../../../src/game/engine/QuestTracker";
import { EventBus } from "../../../src/game/engine/EventBus";
import type { GameEvent } from "@shared/events";

describe("QuestTracker", () => {
  let questTracker: QuestTracker;
  let eventBus: EventBus;
  let capturedEvents: GameEvent[];

  beforeEach(() => {
    eventBus = new EventBus();
    questTracker = new QuestTracker(eventBus);
    capturedEvents = [];

    // Capture all events for testing
    eventBus.onAny((event) => {
      capturedEvents.push(event);
    });
  });

  describe("initializeForZone", () => {
    it("should auto-accept first quest in zone chain", () => {
      const characterId = 1;
      const zoneId = "zone_greenhollow_vale";

      const quests = questTracker.initializeForZone(characterId, zoneId);

      expect(quests).toHaveLength(1);
      expect(quests[0].questId).toBe("quest_rat_problem");
      expect(quests[0].status).toBe("active");
      expect(quests[0].objectives).toEqual({ obj_0: 0 });
    });

    it("should emit QUEST_ACCEPTED event on initialization", () => {
      const characterId = 1;
      const zoneId = "zone_greenhollow_vale";

      questTracker.initializeForZone(characterId, zoneId);

      const questAcceptedEvents = capturedEvents.filter(e => e.type === "QUEST_ACCEPTED");
      expect(questAcceptedEvents).toHaveLength(1);
      expect(questAcceptedEvents[0]).toMatchObject({
        type: "QUEST_ACCEPTED",
        characterId: 1,
        questId: "quest_rat_problem"
      });
    });

    it("should return empty array for zone with no quests", () => {
      const characterId = 1;
      const zoneId = "zone_nonexistent";

      const quests = questTracker.initializeForZone(characterId, zoneId);

      expect(quests).toHaveLength(0);
    });

    it("should initialize multiple objectives to zero", () => {
      const characterId = 1;
      const zoneId = "zone_greenhollow_vale";

      const quests = questTracker.initializeForZone(characterId, zoneId);

      // First quest has 1 objective (kill 10 rats)
      expect(quests[0].objectives).toEqual({ obj_0: 0 });
    });
  });

  describe("onMobKill", () => {
    it("should increment quest objective on matching mob kill", () => {
      const characterId = 1;
      const zoneId = "zone_greenhollow_vale";

      questTracker.initializeForZone(characterId, zoneId);
      capturedEvents = []; // Clear initialization events

      const result = questTracker.onMobKill(characterId, "mob_cellar_rat");

      expect(result.questCompleted).toBe(false);

      const activeQuests = questTracker.getActiveQuests(characterId);
      expect(activeQuests[0].objectives.obj_0).toBe(1);
    });

    it("should emit QUEST_OBJECTIVE_PROGRESS event on mob kill", () => {
      const characterId = 1;
      const zoneId = "zone_greenhollow_vale";

      questTracker.initializeForZone(characterId, zoneId);
      capturedEvents = [];

      questTracker.onMobKill(characterId, "mob_cellar_rat");

      const progressEvents = capturedEvents.filter(e => e.type === "QUEST_OBJECTIVE_PROGRESS");
      expect(progressEvents).toHaveLength(1);
      expect(progressEvents[0]).toMatchObject({
        type: "QUEST_OBJECTIVE_PROGRESS",
        characterId: 1,
        questId: "quest_rat_problem",
        objectiveId: "obj_0",
        progress: 1
      });
    });

    it("should not increment beyond required count", () => {
      const characterId = 1;
      const zoneId = "zone_greenhollow_vale";

      questTracker.initializeForZone(characterId, zoneId);

      // Kill 15 rats (objective requires 10)
      for (let i = 0; i < 15; i++) {
        questTracker.onMobKill(characterId, "mob_cellar_rat");
      }

      const activeQuests = questTracker.getActiveQuests(characterId);
      // Should complete at 10, not increment to 15
      expect(activeQuests[0].objectives.obj_0).toBe(10);
      expect(activeQuests[0].status).toBe("complete");
    });

    it("should not update progress for non-matching mobs", () => {
      const characterId = 1;
      const zoneId = "zone_greenhollow_vale";

      questTracker.initializeForZone(characterId, zoneId);

      const result = questTracker.onMobKill(characterId, "mob_dire_wolf");

      expect(result.questCompleted).toBe(false);

      const activeQuests = questTracker.getActiveQuests(characterId);
      expect(activeQuests[0].objectives.obj_0).toBe(0);
    });

    it("should auto-complete quest when all objectives met", () => {
      const characterId = 1;
      const zoneId = "zone_greenhollow_vale";

      questTracker.initializeForZone(characterId, zoneId);
      capturedEvents = [];

      // Kill 10 rats to complete objective
      let result;
      for (let i = 0; i < 10; i++) {
        result = questTracker.onMobKill(characterId, "mob_cellar_rat");
      }

      expect(result!.questCompleted).toBe(true);
      expect(result!.rewards).toMatchObject({
        xp: 250,
        gold: 1500,
        itemIds: ["item_farmers_pitchfork"],
        nextQuestId: "quest_wolf_menace"
      });
    });

    it("should emit QUEST_COMPLETED event on completion", () => {
      const characterId = 1;
      const zoneId = "zone_greenhollow_vale";

      questTracker.initializeForZone(characterId, zoneId);
      capturedEvents = [];

      // Kill 10 rats
      for (let i = 0; i < 10; i++) {
        questTracker.onMobKill(characterId, "mob_cellar_rat");
      }

      const completedEvents = capturedEvents.filter(e => e.type === "QUEST_COMPLETED");
      expect(completedEvents).toHaveLength(1);
      expect(completedEvents[0]).toMatchObject({
        type: "QUEST_COMPLETED",
        characterId: 1,
        questId: "quest_rat_problem"
      });
    });

    it("should auto-accept next quest in chain on completion", () => {
      const characterId = 1;
      const zoneId = "zone_greenhollow_vale";

      questTracker.initializeForZone(characterId, zoneId);
      capturedEvents = [];

      // Complete first quest
      for (let i = 0; i < 10; i++) {
        questTracker.onMobKill(characterId, "mob_cellar_rat");
      }

      const activeQuests = questTracker.getActiveQuests(characterId);

      // Should have 2 quests: completed first + new active second
      expect(activeQuests).toHaveLength(2);
      expect(activeQuests[0].status).toBe("complete");
      expect(activeQuests[1].questId).toBe("quest_wolf_menace");
      expect(activeQuests[1].status).toBe("active");
      expect(activeQuests[1].objectives).toEqual({ obj_0: 0 });
    });

    it("should emit QUEST_ACCEPTED for auto-accepted next quest", () => {
      const characterId = 1;
      const zoneId = "zone_greenhollow_vale";

      questTracker.initializeForZone(characterId, zoneId);
      capturedEvents = [];

      // Complete first quest
      for (let i = 0; i < 10; i++) {
        questTracker.onMobKill(characterId, "mob_cellar_rat");
      }

      const acceptedEvents = capturedEvents.filter(e => e.type === "QUEST_ACCEPTED");
      expect(acceptedEvents).toHaveLength(1);
      expect(acceptedEvents[0]).toMatchObject({
        type: "QUEST_ACCEPTED",
        characterId: 1,
        questId: "quest_wolf_menace"
      });
    });
  });

  describe("quest chain progression", () => {
    it("should complete full 5-quest chain", () => {
      const characterId = 1;
      const zoneId = "zone_greenhollow_vale";

      // Quest 1: Kill 10 Cellar Rats
      questTracker.initializeForZone(characterId, zoneId);
      for (let i = 0; i < 10; i++) {
        questTracker.onMobKill(characterId, "mob_cellar_rat");
      }

      // Quest 2: Kill 15 Dire Wolves
      for (let i = 0; i < 15; i++) {
        questTracker.onMobKill(characterId, "mob_dire_wolf");
      }

      // Quest 3: Kill 12 Blackthorn Scouts
      for (let i = 0; i < 12; i++) {
        questTracker.onMobKill(characterId, "mob_blackthorn_scout");
      }

      // Quest 4: Kill 8 Blackthorn Bandits
      for (let i = 0; i < 8; i++) {
        questTracker.onMobKill(characterId, "mob_blackthorn_bandit");
      }

      // Quest 5: Kill 1 Kragg
      const finalResult = questTracker.onMobKill(characterId, "mob_kragg");

      expect(finalResult.questCompleted).toBe(true);
      expect(finalResult.rewards).toMatchObject({
        xp: 800,
        gold: 10000,
        itemIds: ["item_kraggs_head_trophy"]
      });
      expect(finalResult.rewards!.nextQuestId).toBeUndefined(); // Last quest in chain

      const activeQuests = questTracker.getActiveQuests(characterId);
      expect(activeQuests).toHaveLength(5); // All 5 quests completed
      expect(activeQuests.every(q => q.status === "complete")).toBe(true);
    });

    it("should track progress on correct quest in multi-quest state", () => {
      const characterId = 1;
      const zoneId = "zone_greenhollow_vale";

      // Complete first quest
      questTracker.initializeForZone(characterId, zoneId);
      for (let i = 0; i < 10; i++) {
        questTracker.onMobKill(characterId, "mob_cellar_rat");
      }

      // Now we have 2 quests: completed rat quest + active wolf quest
      // Kill a wolf — should update second quest
      questTracker.onMobKill(characterId, "mob_dire_wolf");

      const activeQuests = questTracker.getActiveQuests(characterId);
      expect(activeQuests[0].objectives.obj_0).toBe(10); // First quest complete
      expect(activeQuests[1].objectives.obj_0).toBe(1);  // Second quest progressing
    });

    it("should emit correct sequence of events for full chain", () => {
      const characterId = 1;
      const zoneId = "zone_greenhollow_vale";

      questTracker.initializeForZone(characterId, zoneId);
      capturedEvents = [];

      // Complete first 2 quests
      for (let i = 0; i < 10; i++) {
        questTracker.onMobKill(characterId, "mob_cellar_rat");
      }
      for (let i = 0; i < 15; i++) {
        questTracker.onMobKill(characterId, "mob_dire_wolf");
      }

      const completed = capturedEvents.filter(e => e.type === "QUEST_COMPLETED");
      const accepted = capturedEvents.filter(e => e.type === "QUEST_ACCEPTED");

      expect(completed).toHaveLength(2);
      expect(accepted).toHaveLength(2);

      expect(completed[0]).toMatchObject({ questId: "quest_rat_problem" });
      expect(accepted[0]).toMatchObject({ questId: "quest_wolf_menace" });
      expect(completed[1]).toMatchObject({ questId: "quest_wolf_menace" });
      expect(accepted[1]).toMatchObject({ questId: "quest_bandit_scouts" });
    });
  });

  describe("getActiveQuests", () => {
    it("should return empty array for character with no quests", () => {
      const characterId = 999;
      const quests = questTracker.getActiveQuests(characterId);
      expect(quests).toEqual([]);
    });

    it("should return all quests for character (active and complete)", () => {
      const characterId = 1;
      const zoneId = "zone_greenhollow_vale";

      questTracker.initializeForZone(characterId, zoneId);

      // Complete first quest
      for (let i = 0; i < 10; i++) {
        questTracker.onMobKill(characterId, "mob_cellar_rat");
      }

      const quests = questTracker.getActiveQuests(characterId);
      expect(quests).toHaveLength(2);
      expect(quests[0].status).toBe("complete");
      expect(quests[1].status).toBe("active");
    });
  });

  describe("multiple characters", () => {
    it("should track quests independently per character", () => {
      const char1 = 1;
      const char2 = 2;
      const zoneId = "zone_greenhollow_vale";

      // Initialize both characters
      questTracker.initializeForZone(char1, zoneId);
      questTracker.initializeForZone(char2, zoneId);

      // Progress char1
      for (let i = 0; i < 5; i++) {
        questTracker.onMobKill(char1, "mob_cellar_rat");
      }

      // Progress char2 to completion
      for (let i = 0; i < 10; i++) {
        questTracker.onMobKill(char2, "mob_cellar_rat");
      }

      const char1Quests = questTracker.getActiveQuests(char1);
      const char2Quests = questTracker.getActiveQuests(char2);

      expect(char1Quests[0].objectives.obj_0).toBe(5);
      expect(char1Quests[0].status).toBe("active");

      expect(char2Quests[0].objectives.obj_0).toBe(10);
      expect(char2Quests[0].status).toBe("complete");
      expect(char2Quests).toHaveLength(2); // Completed first + auto-accepted second
    });
  });
});
