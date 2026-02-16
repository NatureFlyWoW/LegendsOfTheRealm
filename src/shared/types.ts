// src/shared/types.ts
import type {
  ClassName, RaceName, QualityTier, GearSlot, ResourceType,
  CompanionQuality, ActivityType, PrimaryStat, SecondaryStat,
  DamageType, AbilityEffectType, TalentEffectType,
} from "./enums";

// ============================================================
// Branded ID Types (compile-time safety, zero runtime cost)
// ============================================================

export type ItemId = string & { readonly __brand: "ItemId" };
export type QuestId = string & { readonly __brand: "QuestId" };
export type ZoneId = string & { readonly __brand: "ZoneId" };
export type DungeonId = string & { readonly __brand: "DungeonId" };
export type RaidId = string & { readonly __brand: "RaidId" };
export type AbilityId = string & { readonly __brand: "AbilityId" };
export type TalentId = string & { readonly __brand: "TalentId" };
export type MobId = string & { readonly __brand: "MobId" };
export type LootTableId = string & { readonly __brand: "LootTableId" };
export type RecipeId = string & { readonly __brand: "RecipeId" };
export type AchievementId = string & { readonly __brand: "AchievementId" };
export type BossId = string & { readonly __brand: "BossId" };

// ID factory functions (runtime casts)
export function makeItemId(s: string): ItemId { return s as ItemId; }
export function makeQuestId(s: string): QuestId { return s as QuestId; }
export function makeZoneId(s: string): ZoneId { return s as ZoneId; }
export function makeDungeonId(s: string): DungeonId { return s as DungeonId; }
export function makeRaidId(s: string): RaidId { return s as RaidId; }
export function makeAbilityId(s: string): AbilityId { return s as AbilityId; }
export function makeTalentId(s: string): TalentId { return s as TalentId; }
export function makeMobId(s: string): MobId { return s as MobId; }
export function makeLootTableId(s: string): LootTableId { return s as LootTableId; }
export function makeRecipeId(s: string): RecipeId { return s as RecipeId; }
export function makeAchievementId(s: string): AchievementId { return s as AchievementId; }
export function makeBossId(s: string): BossId { return s as BossId; }

// ============================================================
// Icon (used across data definitions for ASCII rendering)
// ============================================================

export interface AsciiIcon {
  char: string;
  fg: number;
  bg: number;
}

// ============================================================
// Loot Table (Decision 5 — 3-layer model)
// ============================================================

export interface LootEntry {
  itemId: ItemId;
  weight: number;
  minQuantity: number;
  maxQuantity: number;
}

export interface SmartLootConfig {
  classWeightBonus: number;
  specWeightBonus: number;
  upgradeWeightBonus: number;
}

export interface LootTable {
  id: LootTableId;
  guaranteedDrops: LootEntry[];
  rolledDrops: LootEntry[];
  rolledDropCount: number;
  goldRange: { min: number; max: number };
  bonusRolls?: LootEntry[];
  smartLoot?: SmartLootConfig;
}

// ============================================================
// Character State (runtime, mutable, stored in SQLite)
// ============================================================

export interface CharacterState {
  id: number;
  name: string;
  race: RaceName;
  className: ClassName;
  level: number;
  xp: number;
  restedXp: number;
  gold: number;
  currentZone: ZoneId;
  activity: ActivityType;
  activeSpec: string;
  talentPoints: Record<string, Record<TalentId, number>>;
  equipment: Record<GearSlot, number | null>;
  stats: EffectiveStats;
  bags: ItemInstance[];
  companionClears: Record<string, number>;
  createdAt: number;
  lastPlayedAt: number;
}

// ============================================================
// Effective Stats (computed by combat, cached by engine)
// ============================================================

export interface EffectiveStats {
  strength: number;
  agility: number;
  intellect: number;
  stamina: number;
  spirit: number;
  maxHp: number;
  maxMana: number;
  attackPower: number;
  spellPower: number;
  armor: number;
  critChance: number;
  hitChance: number;
  hastePercent: number;
  dodgeChance: number;
  parryChance: number;
  blockChance: number;
  blockValue: number;
  defenseSkill: number;
  resilience: number;
  mp5: number;
  weaponDamageMin: number;
  weaponDamageMax: number;
  weaponSpeed: number;
  offhandDamageMin?: number;
  offhandDamageMax?: number;
  offhandSpeed?: number;
}

// ============================================================
// Item Instance (runtime, stored in SQLite)
// ============================================================

export interface ItemInstance {
  id: number;
  templateId: ItemId;
  characterId: number;
  bagSlot: number | null;
  equippedSlot: GearSlot | null;
  durability: number;
  enchantId?: string;
  gemIds?: string[];
}

// ============================================================
// Quest Progress (runtime, stored in SQLite)
// ============================================================

export interface QuestProgressState {
  questId: QuestId;
  characterId: number;
  status: "accepted" | "in_progress" | "objectives_complete" | "turned_in";
  objectives: Record<string, number>;
  acceptedAt: number;
}

// ============================================================
// Account-wide Data
// ============================================================

export interface AccountData {
  heirloomUnlocks: ItemId[];
  transmogUnlocks: ItemId[];
  mountUnlocks: string[];
  titleUnlocks: string[];
  achievementPoints: number;
  guildHallLevel: number;
}

// ============================================================
// Notification (structured, not pre-formatted strings)
// ============================================================

export type GameNotification =
  | { type: "level_up"; characterId: number; newLevel: number }
  | { type: "item_acquired"; characterId: number; itemId: ItemId; quality: QualityTier }
  | { type: "quest_completed"; characterId: number; questId: QuestId }
  | { type: "achievement_earned"; achievementId: AchievementId; title: string; points: number }
  | { type: "companion_upgraded"; characterId: number; contentId: string; newQuality: CompanionQuality }
  | { type: "boss_killed"; characterId: number; bossId: BossId }
  | { type: "dungeon_cleared"; characterId: number; dungeonId: DungeonId }
  | { type: "lockout_expired"; contentType: "dungeon" | "raid"; contentId: string }
  | { type: "cooldown_ready"; characterId: number; cooldownType: string }
  | { type: "death"; characterId: number; zone: ZoneId };

// ============================================================
// Welcome Back Summary (structured data, UI formats)
// ============================================================

export interface WelcomeBackSummary {
  offlineSeconds: number;
  perCharacter: CharacterOfflineResult[];
  expiredLockouts: Array<{ contentType: "dungeon" | "raid"; contentId: string }>;
  cooldownsReady: Array<{ characterId: number; cooldownType: string }>;
}

export interface CharacterOfflineResult {
  characterId: number;
  characterName: string;
  activity: ActivityType;
  xpGained: number;
  levelsGained: number;
  goldEarned: number;
  itemsAcquired: Array<{ itemId: ItemId; quality: QualityTier; count: number }>;
  killCount?: number;
  questsCompleted?: QuestId[];
  dungeonClears?: number;
  professionSkillups?: Array<{ profession: string; gained: number }>;
  deaths?: number;
  restedXpGained: number;
}

// Re-export enums for convenience
export type {
  ClassName, RaceName, QualityTier, GearSlot, ResourceType,
  CompanionQuality, ActivityType, PrimaryStat, SecondaryStat,
  DamageType, AbilityEffectType, TalentEffectType,
} from "./enums";
