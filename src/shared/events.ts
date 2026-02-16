// src/shared/events.ts
import type { ItemId, QuestId, DungeonId, RaidId, AchievementId, BossId, ZoneId } from "./types";
import type { QualityTier, CompanionQuality } from "./enums";

/**
 * Typed event definitions for the engine EventBus.
 * These events flow within the main process between engine subsystems.
 * The UI does NOT subscribe to these directly — it receives GameStateDelta and GameNotification via IPC.
 */
export type GameEvent =
  | { type: "CHARACTER_LEVELED"; characterId: number; newLevel: number; timestamp: number }
  | { type: "CHARACTER_DIED"; characterId: number; zone: ZoneId; cause: string; timestamp: number }
  | { type: "ITEM_ACQUIRED"; characterId: number; itemId: ItemId; quality: QualityTier; timestamp: number }
  | { type: "ITEM_EQUIPPED"; characterId: number; itemId: ItemId; slot: string; timestamp: number }
  | { type: "QUEST_ACCEPTED"; characterId: number; questId: QuestId; timestamp: number }
  | { type: "QUEST_COMPLETED"; characterId: number; questId: QuestId; timestamp: number }
  | { type: "QUEST_OBJECTIVE_PROGRESS"; characterId: number; questId: QuestId; objectiveId: string; progress: number; timestamp: number }
  | { type: "BOSS_KILLED"; characterId: number; bossId: BossId; contentId: string; timestamp: number }
  | { type: "DUNGEON_CLEARED"; characterId: number; dungeonId: DungeonId; timestamp: number }
  | { type: "RAID_BOSS_KILLED"; characterId: number; raidId: RaidId; bossId: BossId; timestamp: number }
  | { type: "ACHIEVEMENT_EARNED"; achievementId: AchievementId; title: string; points: number; timestamp: number }
  | { type: "COMPANION_UPGRADED"; characterId: number; contentId: string; newQuality: CompanionQuality; timestamp: number }
  | { type: "PROFESSION_SKILLUP"; characterId: number; profession: string; newSkill: number; timestamp: number }
  | { type: "GOLD_CHANGED"; characterId: number; amount: number; reason: string; timestamp: number }
  | { type: "DAILY_RESET"; timestamp: number }
  | { type: "WEEKLY_RESET"; timestamp: number }
  | { type: "LOCKOUT_EXPIRED"; contentType: "dungeon" | "raid"; contentId: string; timestamp: number }
  | { type: "COOLDOWN_READY"; characterId: number; cooldownType: string; timestamp: number };

/** Extract the event type for a specific event kind */
export type GameEventOfType<T extends GameEvent["type"]> = Extract<GameEvent, { type: T }>;
