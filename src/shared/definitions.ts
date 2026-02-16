// src/shared/definitions.ts
// Data definition types — shapes of JSON content files consumed by all domains.
// These describe static game content (templates), not runtime state (instances).

import type {
  ClassName, RaceName, QualityTier, GearSlot, ResourceType,
  CompanionQuality, PrimaryStat, DamageType,
  WeaponType, ArmorType, TalentSpec,
  AbilityEffectType, TalentEffectType,
} from "./enums";
import type {
  ItemId, QuestId, ZoneId, DungeonId, RaidId,
  AbilityId, TalentId, MobId, LootTableId, RecipeId,
  BossId, AchievementId, AsciiIcon,
} from "./types";

// ============================================================
// Race Definition
// ============================================================

export interface RacialBonus {
  stat: PrimaryStat | "xp_gain" | "crit_chance" | "dodge_chance" | "melee_damage"
    | "shadow_resist" | "regen" | "armor" | "block_chance" | "nature_resist"
    | "pet_damage" | "crit_from_behind" | "fishing";
  value: number;
  isPercentage: boolean;
}

export interface RaceDefinition {
  id: RaceName;
  name: string;
  lore: string;
  primaryBonus: RacialBonus;
  secondaryBonus: RacialBonus;
  professionBonuses: Array<{ profession: string; value: number }>;
  icon: string;
}

// ============================================================
// Class Definition
// ============================================================

export interface ClassDefinition {
  id: ClassName;
  name: string;
  description: string;
  resourceType: ResourceType;
  armorProficiency: ArmorType[];
  weaponProficiency: WeaponType[];
  baseStats: Record<PrimaryStat, number>;
  perLevelGains: Record<PrimaryStat, number>;
  classBaseHp: number;
  classBaseMana: number;
  specs: [TalentSpec, TalentSpec, TalentSpec];
}

// ============================================================
// Stat Formulas
// ============================================================

export interface RatingConversion {
  stat: string;
  ratingPerPercent: number;
}

export interface StatCap {
  stat: string;
  softCap?: number;
  hardCap?: number;
  description: string;
}

export interface StatFormulas {
  health: { staminaMultiplier: number };
  mana: { intellectMultiplier: number };
  armorReduction: { constantBase: number; levelMultiplier: number };
  critChance: { agilityDivisor: number; intDivisor: number; baseCritSuppression: number };
  dodge: { agilityDivisor: number; diminishingReturnThreshold: number };
  parry: { basePercent: number };
  block: { basePercent: number; strengthDivisor: number };
  ratingConversions: RatingConversion[];
  caps: StatCap[];
}

// ============================================================
// Ability Definition
// ============================================================

export interface AbilityEffect {
  type: AbilityEffectType;
  damageType?: DamageType;
  baseDamageMin?: number;
  baseDamageMax?: number;
  coefficient: number;
  scalingStat: PrimaryStat | "attack_power" | "spell_power" | "weapon_dps";
  duration?: number;
  tickInterval?: number;
  stacks?: number;
  threatMultiplier?: number;
  dispellable?: boolean;
  procChance?: number;
}

export interface AbilityDefinition {
  id: AbilityId;
  name: string;
  className: ClassName;
  spec: TalentSpec | null;
  description: string;
  icon: AsciiIcon;
  castTime: number;
  cooldown: number;
  globalCooldown: boolean;
  channeled: boolean;
  channelDuration?: number;
  resourceCost: number;
  resourceType: ResourceType;
  targetType: "self" | "enemy" | "friendly" | "aoe_ground" | "aoe_self" | "cone";
  range: number;
  aoeRadius?: number;
  maxTargets?: number;
  effects: AbilityEffect[];
  aiPriority: number;
  aiCondition?: string;
}

// ============================================================
// Talent Definitions
// ============================================================

export interface TalentEffect {
  type: TalentEffectType;
  stat?: string;
  value: number;
  isPercentage: boolean;
  affectedAbility?: AbilityId;
  description: string;
}

export interface TalentNode {
  id: TalentId;
  name: string;
  description: string;
  maxRanks: number;
  tier: number;
  position: number;
  prerequisites: TalentId[];
  tierPointRequirement: number;
  perRankEffects: TalentEffect[];
  grantsAbility?: AbilityId;
}

export interface TalentTree {
  id: string;
  className: ClassName;
  spec: TalentSpec;
  name: string;
  description: string;
  role: "tank" | "melee_dps" | "ranged_dps" | "healer";
  iconChar: string;
  nodes: TalentNode[];
  totalPossiblePoints: number;
  capstoneNodeId: TalentId;
}

// ============================================================
// Item Definition
// ============================================================

export interface ItemSource {
  type: "boss_drop" | "world_drop" | "quest_reward" | "vendor" | "crafted"
      | "rare_spawn" | "fishing" | "gathering" | "achievement" | "reputation";
  sourceId: string;
  dropRate?: number;
  context?: string;
}

export interface ItemDefinition {
  id: ItemId;
  name: string;
  quality: QualityTier;
  itemLevel: number;
  requiredLevel: number;
  description: string;
  icon: AsciiIcon;
  slot: GearSlot | "bag" | "consumable" | "material" | "quest" | "recipe" | "gem" | "mount";
  armorType?: ArmorType;
  weaponType?: WeaponType;
  stats: Partial<Record<string, number>>;
  weaponDamageMin?: number;
  weaponDamageMax?: number;
  weaponSpeed?: number;
  armorValue?: number;
  blockValue?: number;
  sockets?: Array<"red" | "yellow" | "blue" | "meta">;
  socketBonus?: Partial<Record<string, number>>;
  setId?: string;
  bindOnPickup: boolean;
  bindOnEquip: boolean;
  unique: boolean;
  stackSize: number;
  vendorSellPrice: number;
  bagSlots?: number;
  sources: ItemSource[];
}

// ============================================================
// Zone Definition
// ============================================================

export interface ZoneDefinition {
  id: ZoneId;
  name: string;
  levelRange: { min: number; max: number };
  theme: string;
  loreDescription: string;
  mobIds: MobId[];
  questIds: QuestId[];
  dungeonUnlock?: DungeonId;
  gatheringNodes: Array<{
    profession: string;
    nodeType: string;
    skillRange: { min: number; max: number };
    spawnRate: number;
    loot: LootTableId;
  }>;
  rareSpawns: Array<{ mobId: MobId; respawnHoursMin: number; respawnHoursMax: number }>;
  worldDropTable: LootTableId;
  breadcrumbQuestTo?: ZoneId;
}

// ============================================================
// Mob Definition
// ============================================================

export interface MobAbility {
  id: string;
  name: string;
  damageType: DamageType;
  castTime: number;
  cooldown: number;
  damage: number;
  targetType: "tank" | "random" | "all" | "cone_frontal" | "aoe_ground" | "self";
}

export interface MobDefinition {
  id: MobId;
  name: string;
  level: number;
  isElite: boolean;
  isBoss: boolean;
  isRareSpawn: boolean;
  health: number;
  mana?: number;
  armor: number;
  meleeDamageMin: number;
  meleeDamageMax: number;
  attackSpeed: number;
  abilities: MobAbility[];
  zoneId: ZoneId;
  lootTableId: LootTableId;
  xpReward: number;
  icon: AsciiIcon;
}

// ============================================================
// Dungeon & Raid Definitions
// ============================================================

export interface BossAbilityDef {
  id: string;
  name: string;
  description: string;
  damageType: DamageType;
  castTime: number;
  cooldown: number;
  interruptible: boolean;
  dispellable: boolean;
  damageLeveling: number;
  damageScaled: number;
  targetType: "tank" | "random" | "all" | "cone_frontal" | "aoe_ground" | "self";
  aoeRadius?: number;
  activeInPhases?: number[];
}

export interface BossPhase {
  phaseNumber: number;
  healthThreshold: number;
  description: string;
  addedAbilities: string[];
  removedAbilities?: string[];
}

export interface DungeonBoss {
  bossId: BossId;
  name: string;
  order: number;
  isFinalBoss: boolean;
  healthLeveling: number;
  healthScaled: number;
  abilities: BossAbilityDef[];
  phases: BossPhase[];
  enrageTimer?: number;
  strategyText: string;
  lootTableId: LootTableId;
}

export interface TrashPack {
  id: string;
  mobs: Array<{ mobId: MobId; count: number }>;
  description: string;
}

export interface DungeonDefinition {
  id: DungeonId;
  name: string;
  levelRange: { min: number; max: number };
  zoneId: ZoneId;
  theme: string;
  estimatedClearTimeMinutes: { min: number; max: number };
  unlockQuestId?: QuestId;
  partySize: 5;
  trashPacks: TrashPack[];
  bosses: DungeonBoss[];
  companionThresholds: { veteran: number; elite: number; champion: number };
  lockoutType: "daily";
  completionXp: number;
  completionGold: number;
  recommendedIlvl: number;
}

export interface RaidDefinition {
  id: RaidId;
  name: string;
  tier: number;
  raidSize: 10 | 20;
  bossCount: number;
  requiredIlvl: number;
  theme: string;
  bosses: DungeonBoss[];
  companionThresholds: { veteran: number; elite: number; champion: number };
  lockoutType: "weekly";
}

// ============================================================
// Quest Definition
// ============================================================

export interface QuestObjective {
  type: "kill" | "collect" | "deliver" | "explore" | "interact" | "escort"
      | "survive" | "craft" | "gather" | "fish" | "use_item";
  targetId?: string;
  description: string;
  requiredCount: number;
  dropRate?: number;
  baseRate?: number;
}

export interface QuestDefinition {
  id: QuestId;
  name: string;
  questText: string;
  turnInText: string;
  level: number;
  zoneId: ZoneId;
  prerequisites: QuestId[];
  followUp?: QuestId;
  chainName?: string;
  chainOrder?: number;
  objectives: QuestObjective[];
  rewards: {
    xp: number;
    gold: number;
    choiceItems?: ItemId[];
    guaranteedItems?: ItemId[];
    unlocksContent?: string;
  };
  type: "main_chain" | "side" | "daily" | "profession" | "dungeon_unlock"
      | "legendary" | "hidden" | "breadcrumb";
  repeatable: boolean;
  dailyReset: boolean;
}

// ============================================================
// Profession & Recipe Definitions
// ============================================================

export interface ProfessionDefinition {
  id: string;
  name: string;
  type: "gathering" | "crafting" | "secondary";
  maxSkill: 300;
  skillTiers: Array<{
    name: string;
    skillRange: { min: number; max: number };
    trainerCost: number;
    requiredLevel: number;
  }>;
}

export interface RecipeDefinition {
  id: RecipeId;
  name: string;
  profession: string;
  requiredSkill: number;
  materials: Array<{ itemId: ItemId; quantity: number }>;
  resultItemId: ItemId;
  resultQuantity: number;
  craftTime: number;
  cooldownHours?: number;
  orangeSkill: number;
  yellowSkill: number;
  greenSkill: number;
  greySkill: number;
  source: "trainer" | "drop" | "vendor" | "quest" | "discovery";
}

// ============================================================
// Achievement Definition
// ============================================================

export interface AchievementCondition {
  type: "kill_count" | "level_reached" | "dungeon_clear" | "raid_clear"
      | "profession_skill" | "gold_earned" | "item_collected" | "quest_complete"
      | "boss_kill" | "custom";
  targetId?: string;
  requiredCount: number;
  description: string;
}

export interface AchievementDefinition {
  id: AchievementId;
  name: string;
  description: string;
  category: "leveling" | "dungeons_raids" | "professions" | "pve_combat"
           | "collections" | "character" | "meta" | "feats_of_strength";
  points: number;
  hidden: boolean;
  conditions: AchievementCondition[];
  conditionLogic: "all" | "any";
  rewards: {
    gold?: number;
    title?: string;
    mountId?: ItemId;
    itemId?: ItemId;
  };
  isAccountWide: boolean;
}

// ============================================================
// Loot Table Definition (re-export from types.ts for naming consistency)
// ============================================================

export type { LootTable as LootTableDefinition } from "./types";
