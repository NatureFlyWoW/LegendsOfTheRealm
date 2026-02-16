// src/game/engine/ActivityManager.ts
import type { CharacterState, ZoneId, MobId } from "@shared/types";
import type { ISeededRng } from "@shared/combat-interfaces";
import type { CombatEvent } from "@shared/combat-interfaces";
import type { ItemInstance } from "@shared/types";
import { EventBus } from "./EventBus";
import { ProgressionService } from "./ProgressionService";
import { LootService, type LootResult } from "./LootService";
import { QuestTracker, type QuestRewards } from "./QuestTracker";
import { runSimpleEncounter, type SimpleEncounterResult } from "@game/combat/EncounterRunner";
import { buildPlayerEntity, buildMobEntity } from "@game/combat/CombatFactory";
import { getZone, getMob, getClass, getQuest, getAbilitiesByClass } from "@game/data";

/**
 * State of a character's current activity.
 */
export interface ActivityState {
  activity: "idle" | "zone_grinding";
  zoneId?: ZoneId;
  currentEncounter?: { mobId: string; ticksElapsed: number };
  restTicksRemaining?: number; // Ticks until character can re-engage after defeat
}

/**
 * Result of processing one tick for a character's activity.
 */
export interface ActivityTickResult {
  characterUpdates: Partial<CharacterState>;
  events: CombatEvent[];
  mobKilled?: string;
  loot?: LootResult;
  questUpdate?: { questCompleted: boolean; rewards?: QuestRewards };
}

/**
 * ActivityManager manages character activity states (idle vs zone_grinding).
 * Handles the per-tick zone grinding loop: pick mob → run encounter → award XP/loot → track quest progress.
 *
 * Key behavior:
 * - When zone_grinding: maintain in-progress encounter, run it to completion, process rewards, pick next mob
 * - When encounter ends (victory): award XP, roll loot, update quests, pick next mob
 * - When encounter ends (defeat): rest for a few ticks, heal to full, re-engage
 * - Character heals to full between encounters
 */
export class ActivityManager {
  private activityStates = new Map<number, ActivityState>();
  private restTicksDuration = 5; // Number of ticks to rest after defeat

  constructor(
    private eventBus: EventBus,
    private progressionService: ProgressionService,
    private lootService: LootService,
    private questTracker: QuestTracker,
  ) {}

  /**
   * Start zone grinding for a character.
   * Initializes quest chain for the zone if not already active.
   */
  startZoneGrinding(character: CharacterState, zoneId: ZoneId): void {
    const zone = getZone(zoneId);
    if (!zone) {
      throw new Error(`Zone not found: ${zoneId}`);
    }

    // Initialize quest chain for this zone
    this.questTracker.initializeForZone(character.id, zoneId);

    // Set activity state
    this.activityStates.set(character.id, {
      activity: "zone_grinding",
      zoneId,
    });

    // Emit event
    this.eventBus.emit({
      type: "GOLD_CHANGED",
      characterId: character.id,
      amount: 0,
      reason: `Started grinding in ${zone.name}`,
      timestamp: Date.now(),
    });
  }

  /**
   * Stop grinding and return character to idle.
   */
  stopGrinding(characterId: number): void {
    this.activityStates.set(characterId, {
      activity: "idle",
    });
  }

  /**
   * Process one tick of activity for a character.
   *
   * Logic:
   * 1. If idle: return empty result
   * 2. If resting: decrement rest ticks, return empty result
   * 3. If no current encounter: pick next mob and start encounter
   * 4. If in encounter: run encounter to completion, process rewards
   * 5. On victory: award XP, roll loot, update quests, pick next mob
   * 6. On defeat: enter rest state
   */
  onTick(character: CharacterState, rng: ISeededRng, tick: number): ActivityTickResult {
    const state = this.activityStates.get(character.id);

    // Idle - no activity
    if (!state || state.activity === "idle") {
      return {
        characterUpdates: {},
        events: [],
      };
    }

    // Resting after defeat
    if (state.restTicksRemaining !== undefined && state.restTicksRemaining > 0) {
      state.restTicksRemaining--;

      // If rest is complete, heal to full
      if (state.restTicksRemaining === 0) {
        delete state.restTicksRemaining;
        // Character will pick next mob on next tick
      }

      return {
        characterUpdates: {},
        events: [],
      };
    }

    // No current encounter - pick next mob
    if (!state.currentEncounter) {
      const mobId = this.pickNextMob(character, state.zoneId!, rng);
      state.currentEncounter = {
        mobId,
        ticksElapsed: 0,
      };

      // We'll start the encounter on the next section (run it immediately)
    }

    // Run encounter to completion
    const mobId = state.currentEncounter!.mobId;
    const encounterResult = this.runEncounter(character, mobId, rng);

    // Clear current encounter
    delete state.currentEncounter;

    // Process outcome
    if (encounterResult.outcome === "victory") {
      return this.handleVictory(character, mobId, encounterResult, rng);
    } else if (encounterResult.outcome === "defeat") {
      return this.handleDefeat(character, state, encounterResult);
    } else {
      // Timeout - treat as defeat
      return this.handleDefeat(character, state, encounterResult);
    }
  }

  /**
   * Get current activity state for a character.
   */
  getState(characterId: number): ActivityState {
    return this.activityStates.get(characterId) ?? { activity: "idle" };
  }

  /**
   * Pick the next mob to fight in the zone.
   * Uses weighted random based on quest objectives and character level.
   */
  private pickNextMob(character: CharacterState, zoneId: ZoneId, rng: ISeededRng): string {
    const zone = getZone(zoneId);
    if (!zone) {
      throw new Error(`Zone not found: ${zoneId}`);
    }

    // Get active quests and their objectives
    const activeQuests = this.questTracker.getActiveQuests(character.id);
    const questMobIds = new Set<string>();

    for (const quest of activeQuests) {
      if (quest.status !== "active") continue;

      // Find quest definition and extract kill objectives
      const questDef = getQuest(quest.questId);
      if (!questDef) continue;

      for (const objective of questDef.objectives) {
        if (objective.type === "kill") {
          questMobIds.add(objective.targetId);
        }
      }
    }

    // Filter mobs by level appropriateness (within +/- 2 levels)
    const appropriateMobs = zone.mobIds.filter((mobId) => {
      const mob = getMob(mobId as MobId);
      if (!mob) return false;
      const levelDiff = Math.abs(mob.level - character.level);
      return levelDiff <= 2;
    });

    if (appropriateMobs.length === 0) {
      // Fall back to all zone mobs if no appropriate ones
      return zone.mobIds[rng.nextInt(0, zone.mobIds.length - 1)];
    }

    // Weighted selection: quest mobs get 3x weight, non-quest mobs get 1x weight
    const weights = appropriateMobs.map((mobId) =>
      questMobIds.has(mobId) ? 3 : 1
    );

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    const roll = rng.nextFloat(0, totalWeight);
    let accumulated = 0;

    for (let i = 0; i < appropriateMobs.length; i++) {
      accumulated += weights[i];
      if (roll < accumulated) {
        return appropriateMobs[i];
      }
    }

    // Fallback
    return appropriateMobs[appropriateMobs.length - 1];
  }

  /**
   * Run a full encounter between character and mob.
   */
  private runEncounter(character: CharacterState, mobId: string, rng: ISeededRng): SimpleEncounterResult {
    // Build combat entities
    const classDef = getClass(character.className);
    if (!classDef) {
      throw new Error(`Class definition not found: ${character.className}`);
    }

    const abilities = getAbilitiesByClass(character.className);
    const equippedItems: Array<{ slot: any; item: any }> = []; // Simplified for Phase 2

    const playerEntity = buildPlayerEntity(character, classDef, abilities, equippedItems);

    const mobDef = getMob(mobId as MobId);
    if (!mobDef) {
      throw new Error(`Mob definition not found: ${mobId}`);
    }

    const enemyEntity = buildMobEntity(mobDef);

    // Run encounter with tick limit
    const tickLimit = 300; // 5 minutes max
    return runSimpleEncounter(
      {
        player: playerEntity,
        enemy: enemyEntity,
        tickLimit,
      },
      rng,
    );
  }

  /**
   * Handle victory outcome.
   */
  private handleVictory(
    character: CharacterState,
    mobId: string,
    encounterResult: SimpleEncounterResult,
    rng: ISeededRng,
  ): ActivityTickResult {

    const mobDef = getMob(mobId as MobId);
    if (!mobDef) {
      throw new Error(`Mob definition not found: ${mobId}`);
    }

    // Award XP
    const levelUpResult = this.progressionService.awardXp(character, mobDef.xpReward);

    // Roll loot
    const loot = this.lootService.rollLoot(mobDef.lootTableId, character.id, rng);

    // Update quest progress
    const questUpdate = this.questTracker.onMobKill(character.id, mobId);

    // Award quest rewards if quest completed
    if (questUpdate.questCompleted && questUpdate.rewards) {
      this.progressionService.awardXp(character, questUpdate.rewards.xp);
      character.gold += questUpdate.rewards.gold;
    }

    // Award gold from loot
    character.gold += loot.gold;

    return {
      characterUpdates: {
        xp: character.xp,
        level: character.level,
        gold: character.gold,
        stats: character.stats,
      },
      events: encounterResult.events,
      mobKilled: mobId,
      loot,
      questUpdate,
    };
  }

  /**
   * Handle defeat outcome.
   */
  private handleDefeat(
    character: CharacterState,
    state: ActivityState,
    encounterResult: SimpleEncounterResult,
  ): ActivityTickResult {
    // Enter rest state
    state.restTicksRemaining = this.restTicksDuration;

    // Emit death event
    this.eventBus.emit({
      type: "CHARACTER_DIED",
      characterId: character.id,
      zone: state.zoneId!,
      cause: "Defeated in combat",
      timestamp: Date.now(),
    });

    return {
      characterUpdates: {},
      events: encounterResult.events,
    };
  }

  /**
   * Clear all activity states (for testing).
   */
  clear(): void {
    this.activityStates.clear();
  }
}
