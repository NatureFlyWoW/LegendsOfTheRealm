// src/game/engine/QuestTracker.ts
import { EventBus } from "./EventBus";
import { getQuestsByZone, getQuestChain, getQuest } from "../data/index";
import type { QuestId, ZoneId } from "@shared/types";
import type { QuestDefinition } from "@shared/definitions";

export interface QuestState {
  questId: QuestId;
  objectives: Record<string, number>;
  status: "active" | "complete";
}

export interface QuestRewards {
  xp: number;
  gold: number;
  itemIds: string[];
  nextQuestId?: string;
}

/**
 * QuestTracker manages quest progress per character.
 * Auto-accepts sequential chain quests, tracks kill objectives, and auto-turns-in on completion.
 */
export class QuestTracker {
  private eventBus: EventBus;
  private characterQuests: Map<number, QuestState[]> = new Map();

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  /**
   * Initialize quest chain for a character entering a zone.
   * Auto-accepts the first quest in the chain.
   */
  initializeForZone(characterId: number, zoneId: ZoneId): QuestState[] {
    const zoneQuests = getQuestsByZone(zoneId);

    if (zoneQuests.length === 0) {
      return [];
    }

    // Find the first quest in the chain (chainOrder === 1 or no prerequisites)
    const firstQuest = zoneQuests.find(q =>
      (q.chainOrder === 1) ||
      (q.prerequisites.length === 0 && q.type === "main_chain")
    );

    if (!firstQuest) {
      return [];
    }

    // Initialize quest state with empty objective counters
    const questState: QuestState = {
      questId: firstQuest.id,
      objectives: {},
      status: "active"
    };

    // Initialize all objectives to 0
    firstQuest.objectives.forEach((obj, index) => {
      questState.objectives[`obj_${index}`] = 0;
    });

    // Store the active quest
    this.characterQuests.set(characterId, [questState]);

    // Emit QUEST_ACCEPTED event
    this.eventBus.emit({
      type: "QUEST_ACCEPTED",
      characterId,
      questId: firstQuest.id,
      timestamp: Date.now()
    });

    return [questState];
  }

  /**
   * Handle mob kill — update quest objectives and auto-turn-in if complete.
   */
  onMobKill(characterId: number, mobId: string): { questCompleted: boolean; rewards?: QuestRewards } {
    const activeQuests = this.characterQuests.get(characterId) || [];

    for (const questState of activeQuests) {
      if (questState.status !== "active") {
        continue;
      }

      const questDef = getQuest(questState.questId);
      if (!questDef) {
        continue;
      }

      // Check if this mob matches any objective
      let objectiveUpdated = false;
      questDef.objectives.forEach((objective, index) => {
        const objKey = `obj_${index}`;

        if (objective.type === "kill" && objective.targetId === mobId) {
          const currentCount = questState.objectives[objKey] || 0;

          if (currentCount < objective.requiredCount) {
            questState.objectives[objKey] = currentCount + 1;
            objectiveUpdated = true;

            // Emit progress event
            this.eventBus.emit({
              type: "QUEST_OBJECTIVE_PROGRESS",
              characterId,
              questId: questState.questId,
              objectiveId: objKey,
              progress: questState.objectives[objKey],
              timestamp: Date.now()
            });
          }
        }
      });

      // Check if quest is complete
      if (objectiveUpdated && this.isQuestComplete(questState, questDef)) {
        return this.completeQuest(characterId, questState, questDef);
      }
    }

    return { questCompleted: false };
  }

  /**
   * Get all active quests for a character.
   */
  getActiveQuests(characterId: number): QuestState[] {
    return this.characterQuests.get(characterId) || [];
  }

  /**
   * Check if all objectives are complete.
   */
  private isQuestComplete(questState: QuestState, questDef: QuestDefinition): boolean {
    return questDef.objectives.every((objective, index) => {
      const objKey = `obj_${index}`;
      const current = questState.objectives[objKey] || 0;
      return current >= objective.requiredCount;
    });
  }

  /**
   * Complete a quest — mark complete, emit event, auto-accept next in chain.
   */
  private completeQuest(
    characterId: number,
    questState: QuestState,
    questDef: QuestDefinition
  ): { questCompleted: boolean; rewards: QuestRewards } {
    // Mark quest as complete
    questState.status = "complete";

    // Emit QUEST_COMPLETED event
    this.eventBus.emit({
      type: "QUEST_COMPLETED",
      characterId,
      questId: questState.questId,
      timestamp: Date.now()
    });

    // Build rewards
    const rewards: QuestRewards = {
      xp: questDef.rewards.xp,
      gold: questDef.rewards.gold,
      itemIds: questDef.rewards.guaranteedItems || [],
      nextQuestId: questDef.followUp
    };

    // Auto-accept next quest in chain
    if (questDef.followUp) {
      const nextQuest = getQuest(questDef.followUp);
      if (nextQuest) {
        const nextQuestState: QuestState = {
          questId: nextQuest.id,
          objectives: {},
          status: "active"
        };

        // Initialize objectives for next quest
        nextQuest.objectives.forEach((obj, index) => {
          nextQuestState.objectives[`obj_${index}`] = 0;
        });

        // Add to active quests
        const quests = this.characterQuests.get(characterId) || [];
        quests.push(nextQuestState);
        this.characterQuests.set(characterId, quests);

        // Emit QUEST_ACCEPTED event
        this.eventBus.emit({
          type: "QUEST_ACCEPTED",
          characterId,
          questId: nextQuest.id,
          timestamp: Date.now()
        });
      }
    }

    return { questCompleted: true, rewards };
  }

  /**
   * Clear all quest data (for testing).
   */
  clear(): void {
    this.characterQuests.clear();
  }
}
