# Data Implementation Plan -- Draft v1

# DATA LAYER IMPLEMENTATION PLAN

## Legends of the Shattered Realm -- Comprehensive Data Architecture

---

## 1. IMPLEMENTATION PHASES

The data layer must be built bottom-up: foundational schemas first, then content that depends on those schemas, then cross-cutting validation. Each phase produces testable, self-contained deliverables.

### Phase 0: Foundation -- Shared Types and Enums (PREREQUISITE)
**Goal:** Establish the canonical TypeScript type system that all data files and all consumer agents rely on.

- File: `src/shared/types.ts` -- all enum types, ID branded types, common interfaces
- File: `src/shared/constants.ts` -- numeric constants from the design doc (XP formula exponent, stat rating conversions, iLvl budget multiplier)
- File: `src/shared/enums.ts` -- if separated: `ClassName`, `RaceName`, `StatName`, `QualityTier`, `GearSlot`, `DamageType`, `ResourceType`, `CompanionQuality`, `ProfessionName`, `ZoneId`, `DungeonId`, `RaidId`
- Zod validation schemas: `src/game/data/schemas/` directory with per-domain schema files

**Dependency:** None. This is the root of the dependency graph.

### Phase 1: Character Foundation Data [Size: L]
**Goal:** Classes, races, stats, talents, abilities -- the core character definition layer.

**Order within phase:**
1. `races.json` + schema (6 entries, self-contained)
2. `stats.json` + schema (stat formulas, rating conversions, diminishing return curves)
3. `classes.json` + schema (8 entries, references races for armor proficiencies)
4. `abilities.json` + schema (all abilities per class per spec, references stats)
5. `talents.json` + schema (24 trees, references abilities, forms prerequisite DAGs)

**Validation tests:** Talent DAG validity, ability coefficient sanity, stat formula round-trips, class base stat consistency with design doc per-level gains.

### Phase 2: Item and Economy Foundation [Size: XL]
**Goal:** The item system that every other content system depends on for rewards.

**Order within phase:**
1. `stats.json` budget curve function (iLvl -> total stat budget)
2. `items.json` + schema (all items from all dungeons, raids, quests, world drops, crafted)
3. `gems.json` + schema (gem cuts, socket colors, stat values)
4. `enchants.json` + schema (enchantment definitions, material costs)
5. `item_sets.json` + schema (Tier 1-4 set definitions, 2/4/6 piece bonuses)
6. `vendors.json` + schema (NPC vendor inventories and prices)
7. `gold_sinks.json` + schema (repair costs, mount prices, guild hall costs)

**Validation tests:** Every item's stat budget matches `iLvl * 2` formula. Set bonuses reference valid items. All vendor items have valid item IDs. Enchant material costs are obtainable.

### Phase 3: World Content Data [Size: L]
**Goal:** Zones, mobs, quests -- the world the player moves through.

**Order within phase:**
1. `zones.json` + schema (12 zones with level ranges, themes, gathering node types)
2. `mobs.json` + schema (all enemies per zone, stats scaled by level, abilities)
3. `quests.json` + schema (200+ quests, objectives, prerequisites, rewards referencing items.json)
4. `world_bosses.json` + schema (3 world bosses with mechanics and loot)

**Validation tests:** Quest prerequisites form valid DAGs. Quest rewards reference valid items. Mobs exist in their declared zones. Zone level ranges are contiguous 1-60. XP totals per zone match design doc.

### Phase 4: Instanced Content Data [Size: XL]
**Goal:** Dungeons and raids -- the core endgame content.

**Order within phase:**
1. `dungeons.json` + schema (6 dungeons, trash packs, boss sequences, mechanics)
2. `raids.json` + schema (4 raid tiers, all 36 boss encounters, phase data, enrage timers)
3. `loot_tables.json` + schema (per-boss drop tables for all 25+ dungeon bosses and 36 raid bosses)

**Validation tests:** Every boss has a loot table. Loot table weights are valid (<=1.0 total, or exactly 1.0 for guaranteed drops). Boss HP/damage numbers match design doc. Dungeon iLvl drops match the progression path.

### Phase 5: Profession and Crafting Data [Size: M]
**Goal:** Professions, recipes, transmutes, gathering.

**Order within phase:**
1. `professions.json` + schema (12 professions, skill tiers, gathering node mappings)
2. `recipes.json` + schema (all crafting recipes, material requirements, cooldowns)
3. `transmutes.json` + schema (alchemy transmutes with daily cooldowns)

**Validation tests:** Recipe materials are obtainable at declared skill level. Recipe products are valid items. Transmute cooldowns are reasonable. Profession specialization prerequisites are valid.

### Phase 6: Meta, Chase, and Collection Data [Size: L]
**Goal:** Achievements, legendaries, chase items, mounts, titles, cosmetics.

**Order within phase:**
1. `achievements.json` + schema (600+ achievements, conditions, rewards)
2. `titles.json` + schema (50+ titles)
3. `mounts.json` + schema (all mounts with sources and speeds)
4. `legendaries.json` + schema (5 legendary questlines, chapters, materials)
5. `chase_items.json` + schema (ultra-rares, rare spawns, hidden items, bad luck protection)
6. `auction_house.json` + schema (simulated AH price ranges, supply/demand curves)

**Validation tests:** Achievement conditions reference valid game events. Legendary quest materials reference valid items. Chase item drop sources reference valid bosses/zones. Mount sources reference valid content.

### Phase 7: Balance Test Harness [Size: L]
**Goal:** Automated verification that data produces sane gameplay.

1. Stat budget verification suite
2. Encounter simulation scenarios (party vs. boss)
3. Progression path validation (gear enables next content tier)
4. Spec balance verification (no spec >15% below mean DPS)
5. Economy balance verification (gold sources vs sinks)
6. XP curve verification (leveling time within design doc targets)

---

## 2. SCHEMA DESIGN -- Every JSON Schema with TypeScript Types

### 2.1 Foundational Enums and Branded Types

```typescript
// src/shared/enums.ts

export enum ClassName {
  Warrior = "warrior",
  Mage = "mage",
  Cleric = "cleric",
  Rogue = "rogue",
  Ranger = "ranger",
  Druid = "druid",
  Necromancer = "necromancer",
  Shaman = "shaman",
}

export enum RaceName {
  Human = "human",
  Dwarf = "dwarf",
  HighElf = "high_elf",
  Orc = "orc",
  Darkfolk = "darkfolk",
  Halfling = "halfling",
}

export enum StatName {
  Strength = "strength",
  Agility = "agility",
  Intellect = "intellect",
  Stamina = "stamina",
  Spirit = "spirit",
  Armor = "armor",
  SpellPower = "spell_power",
  AttackPower = "attack_power",
}

export enum SecondaryStat {
  CritRating = "crit_rating",
  HitRating = "hit_rating",
  HasteRating = "haste_rating",
  DefenseRating = "defense_rating",
  DodgeRating = "dodge_rating",
  ParryRating = "parry_rating",
  BlockRating = "block_rating",
  Resilience = "resilience",
  Mp5 = "mp5",
}

export enum QualityTier {
  Common = "common",       // white
  Uncommon = "uncommon",   // green
  Rare = "rare",           // blue
  Epic = "epic",           // purple
  Legendary = "legendary", // orange
}

export enum GearSlot {
  Head = "head",
  Shoulder = "shoulder",
  Chest = "chest",
  Wrist = "wrist",
  Hands = "hands",
  Waist = "waist",
  Legs = "legs",
  Feet = "feet",
  Neck = "neck",
  Ring = "ring",
  Trinket = "trinket",
  Weapon = "weapon",
  OffHand = "offhand",
  Back = "back",
}

export enum WeaponType {
  Sword1H = "sword_1h",
  Sword2H = "sword_2h",
  Mace1H = "mace_1h",
  Mace2H = "mace_2h",
  Axe1H = "axe_1h",
  Axe2H = "axe_2h",
  Dagger = "dagger",
  Staff = "staff",
  Polearm = "polearm",
  Wand = "wand",
  Shield = "shield",
  OffHandFrill = "offhand_frill",
  Bow = "bow",
}

export enum ArmorType {
  Cloth = "cloth",
  Leather = "leather",
  Mail = "mail",
  Plate = "plate",
}

export enum DamageType {
  Physical = "physical",
  Fire = "fire",
  Frost = "frost",
  Shadow = "shadow",
  Nature = "nature",
  Arcane = "arcane",
  Holy = "holy",
}

export enum ResourceType {
  Mana = "mana",
  Rage = "rage",
  Energy = "energy",
}

export enum TalentSpec {
  // Warrior
  Protection = "protection",
  Arms = "arms",
  Fury = "fury",
  // Mage
  Fire = "fire",
  Frost = "frost",
  Arcane = "arcane",
  // Cleric
  Holy = "holy",
  Discipline = "discipline",
  Retribution = "retribution",
  // Rogue
  Assassination = "assassination",
  Combat = "combat",
  Subtlety = "subtlety",
  // Ranger
  Marksmanship = "marksmanship",
  BeastMastery = "beast_mastery",
  Survival = "survival",
  // Druid
  Restoration = "restoration",
  Feral = "feral",
  Balance = "balance",
  // Necromancer
  Affliction = "affliction",
  Demonology = "demonology",
  Destruction = "destruction",
  // Shaman
  Elemental = "elemental",
  Enhancement = "enhancement",
  RestorationShaman = "restoration_shaman",
}

export enum CompanionQuality {
  Recruit = "recruit",   // 70% efficiency, default
  Veteran = "veteran",   // 85% efficiency, 1 clear
  Elite = "elite",       // 100% efficiency, 10 dungeon / 5 raid clears
  Champion = "champion", // 115% efficiency, 25 dungeon / 15 raid clears
}

export enum ProfessionName {
  Mining = "mining",
  Herbalism = "herbalism",
  Skinning = "skinning",
  Blacksmithing = "blacksmithing",
  Leatherworking = "leatherworking",
  Tailoring = "tailoring",
  Alchemy = "alchemy",
  Enchanting = "enchanting",
  Jewelcrafting = "jewelcrafting",
  Cooking = "cooking",
  FirstAid = "first_aid",
  Fishing = "fishing",
}

// Branded ID types for type-safe cross-references
export type ItemId = string & { readonly __brand: "ItemId" };
export type ZoneId = string & { readonly __brand: "ZoneId" };
export type QuestId = string & { readonly __brand: "QuestId" };
export type MobId = string & { readonly __brand: "MobId" };
export type AbilityId = string & { readonly __brand: "AbilityId" };
export type TalentNodeId = string & { readonly __brand: "TalentNodeId" };
export type DungeonId = string & { readonly __brand: "DungeonId" };
export type RaidId = string & { readonly __brand: "RaidId" };
export type BossId = string & { readonly __brand: "BossId" };
export type RecipeId = string & { readonly __brand: "RecipeId" };
export type AchievementId = string & { readonly __brand: "AchievementId" };
export type LootTableId = string & { readonly __brand: "LootTableId" };
export type SetId = string & { readonly __brand: "SetId" };
```

### 2.2 Race Schema

```typescript
// src/game/data/schemas/race.schema.ts
export interface RaceDefinition {
  id: RaceName;
  name: string;                       // Display name: "High Elf"
  lore: string;                       // Flavor text
  primaryBonus: {
    stat: StatName | "xp_gain" | "crit_chance" | "dodge_chance";
    value: number;                    // 0.05 = 5%
    type: "percentage" | "flat";
  };
  secondaryBonus: {
    stat: string;
    value: number;
    type: "percentage" | "flat";
  };
  professionBonuses: Array<{
    profession: ProfessionName;
    value: number;                    // 0.10 = +10%
  }>;
  asciiChar: string;                  // Default character representation
  defaultColors: {
    foreground: number;               // ANSI color index 0-15
    background: number;
  };
}

export type RacesData = Record<RaceName, RaceDefinition>;
```

### 2.3 Class Schema

```typescript
// src/game/data/schemas/class.schema.ts
export interface ClassDefinition {
  id: ClassName;
  name: string;
  description: string;
  resourceType: ResourceType;
  armorProficiency: ArmorType[];      // Warrior: [cloth, leather, mail, plate]
  weaponProficiency: WeaponType[];
  baseStats: Record<StatName, number>; // Level 1 values
  perLevelGains: Record<StatName, number>; // Per-level stat gains (float ok)
  classBaseHp: number;                // Added to Stamina * 10
  classBaseMana: number;              // Added to Intellect * 15 (if mana user)
  specs: [TalentSpec, TalentSpec, TalentSpec]; // Exactly 3 specs per class
  availableRaces: RaceName[];         // All races by default
}

export type ClassesData = Record<ClassName, ClassDefinition>;
```

### 2.4 Stat Formula Schema

```typescript
// src/game/data/schemas/stats.schema.ts
export interface StatRatingConversion {
  stat: SecondaryStat;
  ratingPerPercent: number;         // e.g., 22 crit rating = 1% crit
  levelScaling?: boolean;           // If conversion changes with level
}

export interface StatCap {
  stat: SecondaryStat;
  softCap?: number;                 // Percentage where DR starts
  hardCap?: number;                 // Absolute maximum percentage
  description: string;              // "9% hit to never miss bosses"
}

export interface StatFormulas {
  health: {
    staminaMultiplier: number;      // 10
  };
  mana: {
    intellectMultiplier: number;    // 15
  };
  armorReduction: {
    constantBase: number;           // 400
    levelMultiplier: number;        // 85
  };
  critChance: {
    agilityDivisor: number;         // 20 (Agility / 20)
    intDivisor: number;             // 20 (Intellect / 20 for spell crit)
    baseCritSuppression: number;    // 4.8% vs bosses
  };
  dodge: {
    agilityDivisor: number;         // 15
    diminishingReturnThreshold: number; // 20%
  };
  parry: {
    basePercent: number;            // 5
  };
  block: {
    basePercent: number;            // 5
    strengthDivisor: number;        // 20 (for block value)
  };
  ratingConversions: StatRatingConversion[];
  caps: StatCap[];
}
```

### 2.5 Ability Schema

```typescript
// src/game/data/schemas/ability.schema.ts
export interface AbilityDefinition {
  id: AbilityId;
  name: string;
  className: ClassName;
  spec: TalentSpec | null;           // null = baseline ability, not spec-specific
  description: string;
  icon: { char: string; fg: number; bg: number }; // ASCII representation
  
  // Casting
  castTime: number;                  // seconds, 0 = instant
  cooldown: number;                  // seconds, 0 = no cooldown
  globalCooldown: boolean;           // triggers GCD (usually true)
  channeled: boolean;
  channelDuration?: number;
  
  // Cost
  resourceCost: number;
  resourceType: ResourceType;
  reagent?: ItemId;                  // Consumable item required
  
  // Targeting
  targetType: "self" | "enemy" | "friendly" | "aoe_ground" | "aoe_self" | "cone";
  range: number;                     // 0 = melee, 30 = ranged standard
  aoeRadius?: number;
  maxTargets?: number;
  
  // Effects
  effects: AbilityEffect[];
  
  // Talent modifications (applied at runtime by talent system)
  talentModifiable: boolean;
  
  // Priority for auto-combat AI
  aiPriority: number;               // Higher = use first in rotation
  aiCondition?: string;             // e.g., "target.hp_percent < 0.2" for execute
}

export interface AbilityEffect {
  type: "damage" | "heal" | "dot" | "hot" | "buff" | "debuff" | "summon"
      | "absorb" | "dispel" | "interrupt" | "taunt" | "stun" | "root"
      | "silence" | "knockback" | "threat_mod";
  damageType?: DamageType;
  baseDamageMin?: number;
  baseDamageMax?: number;
  coefficient: number;               // Spell power / attack power coefficient
  scalingStat: StatName | "attack_power" | "spell_power" | "weapon_dps";
  duration?: number;                 // For DoTs/HoTs/buffs, seconds
  tickInterval?: number;             // For DoTs/HoTs, seconds per tick
  stacks?: number;                   // Max stacks for stackable effects
  threatMultiplier?: number;         // Overrides default threat (1.0)
  dispellable?: boolean;
  procChance?: number;               // For proc-based effects
  procEffect?: AbilityEffect;        // Recursive: the triggered effect
}

export type AbilitiesData = Record<AbilityId, AbilityDefinition>;
```

### 2.6 Talent Schema

```typescript
// src/game/data/schemas/talent.schema.ts
export interface TalentNode {
  id: TalentNodeId;
  name: string;
  description: string;               // Per-point description template
  maxRanks: number;                  // 1-5
  tier: number;                      // 1-6 (corresponds to level brackets)
  position: number;                  // Column position in tree (for UI)
  prerequisites: TalentNodeId[];     // Must have maxRanks in these before unlocking
  tierPointRequirement: number;      // Total points in this tree needed to reach tier
  
  // What each rank does
  perRankEffects: TalentEffect[];
  
  // If this talent unlocks an ability (capstones, key abilities)
  grantsAbility?: AbilityId;         // At max rank, grants this ability
}

export interface TalentEffect {
  type: "stat_bonus" | "ability_modifier" | "passive_proc" | "grant_ability"
      | "resource_modifier" | "cooldown_reduction" | "cost_reduction"
      | "damage_increase" | "healing_increase" | "crit_bonus";
  stat?: StatName | SecondaryStat;
  value: number;                     // Per rank value
  isPercentage: boolean;
  affectedAbility?: AbilityId;       // Which ability this modifies
  description: string;               // Human-readable per-rank effect
}

export interface TalentTree {
  id: string;                        // e.g., "warrior_protection"
  className: ClassName;
  spec: TalentSpec;
  name: string;                      // "Protection"
  description: string;
  role: "tank" | "melee_dps" | "ranged_dps" | "healer";
  iconChar: string;
  nodes: TalentNode[];
  
  // Validation metadata
  totalPossiblePoints: number;       // Sum of all maxRanks
  capstoneNodeId: TalentNodeId;
}

export type TalentsData = Record<string, TalentTree>; // Keyed by tree ID
```

### 2.7 Item Schema

```typescript
// src/game/data/schemas/item.schema.ts
export interface ItemDefinition {
  id: ItemId;
  name: string;
  quality: QualityTier;
  itemLevel: number;                  // 1-145
  requiredLevel: number;
  description: string;                // Flavor text / lore
  icon: { char: string; fg: number; bg: number };
  
  // Classification
  slot: GearSlot | "bag" | "consumable" | "material" | "quest" | "recipe"
      | "gem" | "mount" | "pet" | "tabard" | "trinket_use";
  armorType?: ArmorType;
  weaponType?: WeaponType;
  
  // Stats
  stats: Partial<Record<StatName | SecondaryStat, number>>;
  
  // Weapon-specific
  weaponDamageMin?: number;
  weaponDamageMax?: number;
  weaponSpeed?: number;              // seconds per swing
  
  // Armor-specific
  armorValue?: number;
  blockValue?: number;
  
  // Socket
  sockets?: Array<"red" | "yellow" | "blue" | "meta">;
  socketBonus?: Partial<Record<StatName | SecondaryStat, number>>;
  
  // Durability
  maxDurability?: number;
  
  // Set membership
  setId?: SetId;
  
  // Special
  bindOnPickup: boolean;
  bindOnEquip: boolean;
  unique: boolean;                    // Only 1 equippable
  stackSize: number;                  // 1 for gear, 20 for mats, 200 for herbs
  vendorSellPrice: number;           // Copper value
  
  // Bags
  bagSlots?: number;                  // If slot = "bag"
  
  // Consumable
  useEffect?: AbilityEffect;
  cooldownGroup?: string;            // Shared cooldowns
  useCooldown?: number;
  
  // Recipe
  teachesRecipe?: RecipeId;
  
  // Proc / On-equip
  equipEffect?: {
    description: string;
    procChance?: number;
    procEffect?: AbilityEffect;
    cooldown?: number;
  };
  
  // Source tracking (for UI "where does this drop")
  sources: ItemSource[];
  
  // Chase item metadata
  isChaseItem?: boolean;
  badLuckProtection?: {
    baseDropRate: number;
    escalationKills: number[];      // [10, 20, 30] = escalation breakpoints
    escalationRates: number[];      // [0.20, 0.30, 0.50] = rates at breakpoints
  };
}

export interface ItemSource {
  type: "boss_drop" | "world_drop" | "quest_reward" | "vendor" | "crafted"
      | "rare_spawn" | "fishing" | "gathering" | "achievement" | "reputation";
  sourceId: string;                  // BossId, ZoneId, QuestId, etc.
  dropRate?: number;                 // 0.0-1.0
  context?: string;                  // Human-readable: "Bjornskar the Frost King"
}

export type ItemsData = Record<ItemId, ItemDefinition>;
```

### 2.8 Item Set Schema

```typescript
// src/game/data/schemas/item_set.schema.ts
export interface ItemSetDefinition {
  id: SetId;
  name: string;                       // "Dreadnaught"
  className?: ClassName;              // Class restriction (null = universal)
  tier?: number;                      // 1-4 for raid tier sets
  pieces: ItemId[];                   // All items in set
  setBonuses: SetBonus[];
}

export interface SetBonus {
  requiredPieces: number;            // 2, 4, 6, or 8
  description: string;
  effects: TalentEffect[];          // Reuse TalentEffect for stat/ability modifications
}

export type ItemSetsData = Record<SetId, ItemSetDefinition>;
```

### 2.9 Loot Table Schema

```typescript
// src/game/data/schemas/loot_table.schema.ts
export interface LootTableEntry {
  itemId: ItemId;
  weight: number;                    // 0.0-1.0. Not required to sum to 1.0
  minQuantity: number;
  maxQuantity: number;
  conditions?: {
    classRestriction?: ClassName[];  // Smart loot: only rolls for these classes
    specRestriction?: TalentSpec[];
  };
}

export interface LootTable {
  id: LootTableId;
  sourceType: "boss" | "trash" | "world_mob" | "rare_spawn" | "chest"
            | "fishing_pool" | "gathering_node";
  sourceId: string;                   // BossId, MobId, ZoneId
  
  // Guaranteed drops (always awarded)
  guaranteedDrops: LootTableEntry[];
  
  // Rolled drops (each independently rolled)
  rolledDrops: LootTableEntry[];
  
  // Number of items to award from rolled pool
  rolledDropCount: number;           // e.g., 2-3 items per boss
  
  // Gold reward range
  goldMin: number;
  goldMax: number;
  
  // Tier token drops (raids)
  tierTokens?: {
    tokenId: ItemId;
    dropRate: number;
  }[];
  
  // Ultra-rare bonus rolls (independent from normal loot)
  bonusRolls?: LootTableEntry[];     // Mounts, recipes, legendaries
}

export type LootTablesData = Record<LootTableId, LootTable>;
```

### 2.10 Zone Schema

```typescript
// src/game/data/schemas/zone.schema.ts
export interface ZoneDefinition {
  id: ZoneId;
  name: string;
  levelRange: { min: number; max: number };
  theme: string;
  loreDescription: string;
  asciiMapData?: string;             // ASCII map representation for UI
  
  // Content references
  mobIds: MobId[];
  questIds: QuestId[];
  dungeonUnlock?: DungeonId;
  
  // Gathering nodes
  gatheringNodes: Array<{
    profession: ProfessionName;
    nodeType: string;               // "Copper Ore", "Silverleaf"
    skillRange: { min: number; max: number };
    spawnRate: number;              // Nodes per hour
    loot: LootTableId;
  }>;
  
  // Rare spawns in this zone
  rareSpawns: Array<{
    mobId: MobId;
    respawnHoursMin: number;
    respawnHoursMax: number;
  }>;
  
  // World drops available in this zone
  worldDropTable: LootTableId;
  
  // Progression
  breadcrumbQuestTo?: ZoneId;       // Quest that leads to next zone
  totalDesignXp: number;            // Design doc target XP from all quests
}

export type ZonesData = Record<ZoneId, ZoneDefinition>;
```

### 2.11 Mob Schema

```typescript
// src/game/data/schemas/mob.schema.ts
export interface MobDefinition {
  id: MobId;
  name: string;
  level: number;
  isElite: boolean;
  isBoss: boolean;
  isRareSpawn: boolean;
  
  // Combat stats
  health: number;
  mana?: number;
  armor: number;
  resistances?: Partial<Record<DamageType, number>>;
  
  // Damage
  meleeDamageMin: number;
  meleeDamageMax: number;
  attackSpeed: number;               // seconds per swing
  abilities: MobAbility[];
  
  // Scaling for level 60 versions of dungeons
  scaledStats?: {
    health: number;
    meleeDamageMin: number;
    meleeDamageMax: number;
  };
  
  // Location
  zoneId: ZoneId;
  
  // Loot
  lootTableId: LootTableId;
  
  // XP
  xpReward: number;                  // Base XP at mob's level
  
  // AI behavior
  aggroRadius: number;               // How close to pull
  leashDistance: number;              // How far before evading
  socialAggro: boolean;              // Pulls nearby allies
  
  // ASCII representation
  icon: { char: string; fg: number; bg: number };
}

export type MobsData = Record<MobId, MobDefinition>;
```

### 2.12 Quest Schema

```typescript
// src/game/data/schemas/quest.schema.ts
export interface QuestDefinition {
  id: QuestId;
  name: string;
  questText: string;                  // Full quest description (90s flavor!)
  turnInText: string;
  level: number;                      // Recommended level
  zoneId: ZoneId;
  
  // Chain
  prerequisites: QuestId[];
  followUp?: QuestId;
  chainName?: string;                 // e.g., "Defense of Greenhollow"
  chainOrder?: number;
  
  // Objectives
  objectives: QuestObjective[];
  
  // Rewards
  rewards: {
    xp: number;
    gold: number;                     // In copper (1g = 10000 copper)
    reputation?: Array<{ factionId: string; amount: number }>;
    choiceItems?: ItemId[];           // Pick one
    guaranteedItems?: ItemId[];       // Always received
    unlocksContent?: string;          // DungeonId, ZoneId, etc.
    grantsTitle?: string;
  };
  
  // Quest type
  type: "main_chain" | "side" | "daily" | "profession" | "dungeon_unlock"
      | "legendary" | "hidden" | "breadcrumb";
  repeatable: boolean;
  dailyReset: boolean;
}

export interface QuestObjective {
  type: "kill" | "collect" | "deliver" | "explore" | "interact" | "escort"
      | "survive" | "craft" | "gather" | "fish" | "use_item";
  targetId?: MobId | ItemId | ZoneId;
  description: string;               // "Kill 10 Cellar Rats"
  requiredCount: number;
  dropRate?: number;                  // For "collect" with <100% drop
  baseRate?: number;                  // Progress per hour for idle simulation
}

export type QuestsData = Record<QuestId, QuestDefinition>;
```

### 2.13 Dungeon Schema

```typescript
// src/game/data/schemas/dungeon.schema.ts
export interface DungeonDefinition {
  id: DungeonId;
  name: string;
  levelRange: { min: number; max: number };
  zoneId: ZoneId;
  theme: string;
  estimatedClearTimeMinutes: { min: number; max: number };
  unlockQuestId?: QuestId;
  
  // Party composition
  partySize: 5;                       // Always 5 for dungeons
  
  // Trash packs (ordered sequence)
  trashPacks: TrashPack[];
  
  // Bosses (ordered sequence)
  bosses: DungeonBoss[];
  
  // Level 60 scaling
  scaledToLevel60: boolean;           // True after player reaches 60
  
  // Companion quality unlock thresholds
  companionThresholds: {
    veteran: number;    // 1
    elite: number;      // 10
    champion: number;   // 25
  };
  
  // Lockout
  lockoutType: "daily";
  
  // Rewards
  completionXp: number;
  completionGold: number;
  
  // Level 60 required average iLvl for comfortable clear
  recommendedIlvl: number;
}

export interface TrashPack {
  id: string;
  mobs: Array<{ mobId: MobId; count: number }>;
  description: string;
}

export interface DungeonBoss {
  bossId: BossId;
  name: string;
  order: number;                      // Boss sequence number
  isFinalBoss: boolean;
  
  // Stats (leveling)
  healthLeveling: number;
  healthScaled: number;              // Level 60
  
  // Boss abilities
  abilities: BossAbility[];
  
  // Phases
  phases: BossPhase[];
  
  // Enrage
  enrageTimer?: number;             // seconds, null = no hard enrage
  
  // Strategy notes (for UI tooltip)
  strategyText: string;
  
  // Loot
  lootTableId: LootTableId;
}

export interface BossAbility {
  id: string;
  name: string;
  description: string;
  damageType: DamageType;
  castTime: number;
  cooldown: number;
  interruptible: boolean;
  dispellable: boolean;
  
  // Damage values
  damageLeveling: number;
  damageScaled: number;
  
  // Targeting
  targetType: "tank" | "random" | "all" | "cone_frontal" | "cone_rear"
            | "aoe_ground" | "self";
  aoeRadius?: number;
  
  // Special effects
  effects: Array<{
    type: string;                    // "dot", "stun", "root", "summon_adds", etc.
    duration?: number;
    value?: number;
    description: string;
  }>;
  
  // Phase restriction
  activeInPhases?: number[];         // Which phases this ability is active in
}

export interface BossPhase {
  phaseNumber: number;
  healthThreshold: number;           // Percentage (1.0, 0.75, 0.50, etc.)
  description: string;
  addedAbilities: string[];          // BossAbility IDs activated in this phase
  removedAbilities?: string[];       // BossAbility IDs deactivated
  specialMechanics?: string;         // Freeform description of unique phase behavior
}

export type DungeonsData = Record<DungeonId, DungeonDefinition>;
```

### 2.14 Raid Schema

```typescript
// src/game/data/schemas/raid.schema.ts
export interface RaidDefinition {
  id: RaidId;
  name: string;
  tier: number;                       // 1-4
  raidSize: 10 | 20;
  bossCount: number;
  requiredIlvl: number;
  estimatedClearTimeHours: { min: number; max: number };
  theme: string;
  
  // Composition
  composition: {
    tanks: { min: number; max: number };
    healers: { min: number; max: number };
    dps: { min: number; max: number };
  };
  
  // Boss encounters in order
  bosses: RaidBoss[];
  
  // Companion quality unlock thresholds
  companionThresholds: {
    veteran: number;    // 1
    elite: number;      // 5
    champion: number;   // 15
  };
  
  // Lockout
  lockoutType: "weekly";
  resetDay: "tuesday";
  resetHour: 3;                      // 3:00 AM local
  
  // Tier tokens
  tierTokenSlots: GearSlot[];        // Which slots have tier tokens
  
  // Hard mode bosses
  hardModes?: Array<{
    bossId: BossId;
    condition: string;
    bonusLoot: LootTableId;
  }>;
}

// RaidBoss extends DungeonBoss with raid-specific fields
export interface RaidBoss extends DungeonBoss {
  raidId: RaidId;
  
  // Raid-specific
  tankSwapRequired: boolean;
  requiredInterrupts: number;
  requiredDispels: number;
  hardModeAvailable: boolean;
}

export type RaidsData = Record<RaidId, RaidDefinition>;
```

### 2.15 Profession and Recipe Schemas

```typescript
// src/game/data/schemas/profession.schema.ts
export interface ProfessionDefinition {
  id: ProfessionName;
  name: string;
  type: "gathering" | "crafting" | "secondary";
  maxSkill: 300;
  
  // Skill tiers
  skillTiers: Array<{
    name: string;                    // "Apprentice", "Journeyman", etc.
    skillRange: { min: number; max: number };
    trainerCost: number;             // Gold to learn
    requiredLevel: number;
  }>;
  
  // Specializations (crafting only)
  specializations?: Array<{
    id: string;
    name: string;
    requiredSkill: number;
    description: string;
    benefit: string;
  }>;
  
  // Gathering nodes by zone (gathering only)
  gatheringProgression?: Array<{
    skillRange: { min: number; max: number };
    zones: ZoneId[];
    nodeType: string;
    resultItems: Array<{ itemId: ItemId; weight: number }>;
  }>;
}

// src/game/data/schemas/recipe.schema.ts
export interface RecipeDefinition {
  id: RecipeId;
  name: string;
  profession: ProfessionName;
  requiredSkill: number;
  specialization?: string;
  
  // Materials
  materials: Array<{
    itemId: ItemId;
    quantity: number;
  }>;
  
  // Result
  resultItemId: ItemId;
  resultQuantity: number;
  
  // Crafting
  craftTime: number;                  // seconds
  cooldownHours?: number;             // Daily/weekly cooldown
  
  // Skill gains
  skillUpChance: number;              // 0.0-1.0 at current skill
  orangeSkill: number;               // Guaranteed skill-up below this
  yellowSkill: number;               // 50% skill-up below this
  greenSkill: number;                // 25% skill-up below this
  greySkill: number;                 // No skill-up at or above this
  
  // Source (how player learns this recipe)
  source: "trainer" | "drop" | "vendor" | "quest" | "discovery";
  sourceDetails?: string;
  dropSource?: { sourceId: string; dropRate: number };
}

export type RecipesData = Record<RecipeId, RecipeDefinition>;
```

### 2.16 Gem and Enchant Schemas

```typescript
// src/game/data/schemas/gem.schema.ts
export interface GemDefinition {
  id: ItemId;
  name: string;
  color: "red" | "yellow" | "blue" | "meta";
  quality: QualityTier;
  stats: Partial<Record<StatName | SecondaryStat, number>>;
  metaRequirement?: {                 // Meta gems only
    minRed?: number;
    minYellow?: number;
    minBlue?: number;
  };
  recipeId: RecipeId;
  requiredJcSkill: number;
}

// src/game/data/schemas/enchant.schema.ts
export interface EnchantDefinition {
  id: string;
  name: string;
  slot: GearSlot;
  requiredEnchantingSkill: number;
  stats: Partial<Record<StatName | SecondaryStat, number>>;
  procEffect?: AbilityEffect;        // For weapon enchants with procs (Crusader)
  materials: Array<{ itemId: ItemId; quantity: number }>;
  source: "trainer" | "drop" | "vendor" | "reputation";
  sourceDetails?: string;
}
```

### 2.17 Achievement Schema

```typescript
// src/game/data/schemas/achievement.schema.ts
export interface AchievementDefinition {
  id: AchievementId;
  name: string;
  description: string;
  category: "leveling" | "dungeons_raids" | "professions" | "pve_combat"
           | "collections" | "character" | "meta" | "feats_of_strength";
  points: number;                     // 0 for Feats of Strength
  hidden: boolean;                    // Hidden until earned
  
  // Completion conditions
  conditions: AchievementCondition[];
  conditionLogic: "all" | "any";     // Must meet all conditions or any one
  
  // Rewards
  rewards: {
    gold?: number;
    title?: string;
    mountId?: ItemId;
    itemId?: ItemId;
    transmogIds?: ItemId[];
  };
  
  // Meta-achievement
  subAchievements?: AchievementId[];  // If this is a meta-achievement
  
  // Tracking
  isAccountWide: boolean;
}

export interface AchievementCondition {
  type: "kill_count" | "level_reached" | "dungeon_clear" | "raid_clear"
      | "profession_skill" | "gold_earned" | "item_collected" | "quest_complete"
      | "death_count" | "crit_count" | "mount_count" | "achievement_count"
      | "boss_kill" | "custom";
  targetId?: string;                 // BossId, DungeonId, etc.
  requiredCount: number;
  description: string;
}
```

### 2.18 Legendary Questline Schema

```typescript
// src/game/data/schemas/legendary.schema.ts
export interface LegendaryQuestline {
  id: string;
  weaponName: string;
  weaponItemId: ItemId;
  description: string;
  requiredLevel: number;
  estimatedWeeks: { min: number; max: number };
  estimatedGoldCost: number;
  
  chapters: LegendaryChapter[];
}

export interface LegendaryChapter {
  chapterNumber: number;
  name: string;
  description: string;
  objectives: QuestObjective[];      // Reuses quest objective format
  requiredMaterials?: Array<{ itemId: ItemId; quantity: number }>;
  completionText: string;
}
```

### 2.19 Chase Item Schema

```typescript
// src/game/data/schemas/chase_item.schema.ts
export interface ChaseItemCategory {
  id: string;
  name: string;                       // "Ultra-Rare World Drops"
  description: string;
  items: ChaseItemEntry[];
}

export interface ChaseItemEntry {
  itemId: ItemId;
  category: "world_drop" | "rare_spawn" | "dungeon_ultra_rare" | "raid_ultra_rare"
          | "fishing" | "profession" | "hidden" | "cosmetic" | "reputation"
          | "crafting_material" | "trophy";
  sourceDescription: string;
  acquisitionSteps?: string[];        // For multi-step hidden items
  badLuckProtection?: {
    enabled: boolean;
    killBreakpoints: number[];
    rateAtBreakpoint: number[];
  };
}
```

### 2.20 Auction House Schema

```typescript
// src/game/data/schemas/auction_house.schema.ts
export interface AuctionHouseConfig {
  listingFeePercent: number;         // 0.05 = 5%
  saleCutPercent: number;            // 0.10 = 10%
  auctionDurations: number[];        // [12, 24, 48] hours
  
  // Simulated NPC listings
  npcListings: Array<{
    itemId: ItemId;
    priceRangeMin: number;
    priceRangeMax: number;
    supplyPerDay: number;            // How many appear per day
    demandMultiplier: number;        // 1.0 = normal, >1 = popular
  }>;
  
  // Price fluctuation rules
  fluctuation: {
    dailyVariancePercent: number;     // e.g., 0.15 = +/-15% daily
    weeklyTrendChance: number;        // Chance of sustained price trend
  };
}
```

---

## 3. MODULE BREAKDOWN -- Every File Under `src/`

### Directory Structure

```
src/game/data/
  schemas/                            # Zod validation schemas
    race.schema.ts
    class.schema.ts
    stats.schema.ts
    ability.schema.ts
    talent.schema.ts
    item.schema.ts
    item_set.schema.ts
    loot_table.schema.ts
    zone.schema.ts
    mob.schema.ts
    quest.schema.ts
    dungeon.schema.ts
    raid.schema.ts
    profession.schema.ts
    recipe.schema.ts
    gem.schema.ts
    enchant.schema.ts
    achievement.schema.ts
    legendary.schema.ts
    chase_item.schema.ts
    auction_house.schema.ts
    index.ts                          # Re-exports all schemas
  
  content/                            # JSON data files
    races.json
    classes.json
    stats.json
    abilities/                        # Split by class to keep files manageable
      warrior.json
      mage.json
      cleric.json
      rogue.json
      ranger.json
      druid.json
      necromancer.json
      shaman.json
    talents/                          # Split by class
      warrior.json
      mage.json
      ...
    items/                            # Split by source
      quest_rewards.json
      dungeon_loot.json
      raid_loot.json
      crafted.json
      world_drops.json
      consumables.json
      materials.json
      gems.json
      mounts.json
    item_sets.json
    loot_tables/                      # Split by content type
      zone_loot.json
      dungeon_loot.json
      raid_loot.json
      world_bosses.json
      rare_spawns.json
      gathering.json
      fishing.json
    zones.json
    mobs/                             # Split by zone
      greenhollow_vale.json
      thornwood_forest.json
      ...
    quests/                           # Split by zone
      greenhollow_vale.json
      thornwood_forest.json
      ...
      dailies.json
    dungeons/                         # One file per dungeon
      deadhollow_crypt.json
      irondeep_forge.json
      tides_end_grotto.json
      emberpeak_caldera.json
      the_dreamspire.json
      hall_of_frost_king.json
    raids/                            # One file per raid
      molten_sanctum.json
      tomb_of_ancients.json
      shattered_citadel.json
      throne_of_void_king.json
    professions.json
    recipes/                          # Split by profession
      blacksmithing.json
      leatherworking.json
      tailoring.json
      alchemy.json
      enchanting.json
      jewelcrafting.json
      cooking.json
      first_aid.json
    achievements.json
    titles.json
    legendaries.json
    chase_items.json
    auction_house.json
    vendors.json
    gold_sinks.json
  
  loader.ts                           # Data loading and validation at startup
  registry.ts                         # Central registry for all loaded data
  index.ts                            # Public API for other agents

src/shared/
  types.ts                            # Re-exports all data types for other agents
  enums.ts                            # All game enums
  constants.ts                        # Numeric constants from design doc
  id-helpers.ts                       # Type-safe ID creation functions

tests/
  data/
    schema-validation.test.ts         # All JSON validates against schemas
    stat-budget.test.ts               # iLvl -> stat budget verification
    loot-table-integrity.test.ts      # Weights, references, completeness
    xp-curve.test.ts                  # XP formula and totals
    talent-dag.test.ts                # Talent prerequisite DAG validity
    quest-dag.test.ts                 # Quest prerequisite DAG validity
    content-completeness.test.ts      # Every zone has mobs, every boss has loot
    cross-reference.test.ts           # All IDs referenced exist
    economy-balance.test.ts           # Gold sources vs sinks
    balance/
      encounter-simulation.test.ts    # Party vs boss simulations
      spec-balance.test.ts            # DPS spread across specs
      progression-path.test.ts        # Gear enables content progression
```

### Validation Layer Design

The validation layer uses Zod schemas mirroring every TypeScript interface. Every JSON file is validated at application startup.

```typescript
// src/game/data/loader.ts
import { z } from "zod";
import * as schemas from "./schemas";

export interface GameData {
  races: RacesData;
  classes: ClassesData;
  stats: StatFormulas;
  abilities: AbilitiesData;
  talents: TalentsData;
  items: ItemsData;
  itemSets: ItemSetsData;
  lootTables: LootTablesData;
  zones: ZonesData;
  mobs: MobsData;
  quests: QuestsData;
  dungeons: DungeonsData;
  raids: RaidsData;
  professions: ProfessionDefinition[];
  recipes: RecipesData;
  achievements: AchievementDefinition[];
  legendaries: LegendaryQuestline[];
  chaseItems: ChaseItemCategory[];
  auctionHouse: AuctionHouseConfig;
  vendors: VendorsData;
  goldSinks: GoldSinksData;
}

export async function loadGameData(): Promise<GameData> {
  // Load all JSON files
  // Validate each against Zod schema
  // Build cross-reference index
  // Validate all cross-references resolve
  // Return frozen, immutable GameData object
}
```

The `registry.ts` file provides a singleton access pattern:

```typescript
// src/game/data/registry.ts
let _data: GameData | null = null;

export function getGameData(): GameData {
  if (!_data) throw new Error("Game data not loaded. Call loadGameData() first.");
  return _data;
}

export function setGameData(data: GameData): void {
  _data = Object.freeze(data);
}

// Convenience accessors
export function getItem(id: ItemId): ItemDefinition { ... }
export function getZone(id: ZoneId): ZoneDefinition { ... }
export function getMob(id: MobId): MobDefinition { ... }
export function getLootTable(id: LootTableId): LootTable { ... }
// ... etc.
```

---

## 4. STAT BUDGET SYSTEM

### 4.1 Core Formula

From the design doc:
```
Total Stat Points = iLvl * 2
```

This is the **budget** for an item. Quality tier adds a multiplier:

| Quality    | Budget Multiplier |
|-----------|-------------------|
| Common     | 1.00              |
| Uncommon   | 1.05              |
| Rare       | 1.10              |
| Epic       | 1.20              |
| Legendary  | 1.35              |

Effective budget formula:
```
effectiveBudget = floor(iLvl * 2 * qualityMultiplier)
```

Examples:
- iLvl 70 Rare: `floor(70 * 2 * 1.10) = 154` stat points
- iLvl 100 Epic: `floor(100 * 2 * 1.20) = 240` stat points
- iLvl 140 Legendary: `floor(140 * 2 * 1.35) = 378` stat points

### 4.2 Stat Distribution by Role Template

```typescript
// src/shared/constants.ts
export const STAT_BUDGET_TEMPLATES: Record<string, Record<string, number>> = {
  plate_dps: {
    strength: 0.40,
    stamina: 0.30,
    crit_rating: 0.20,
    hit_rating: 0.10,
  },
  cloth_caster: {
    intellect: 0.40,
    stamina: 0.30,
    spell_power: 0.20,
    haste_rating: 0.10,
  },
  leather_tank: {
    agility: 0.40,
    stamina: 0.40,
    dodge_rating: 0.10,
    armor: 0.10,            // bonus armor
  },
  plate_tank: {
    strength: 0.20,
    stamina: 0.45,
    defense_rating: 0.20,
    block_rating: 0.15,
  },
  healer_cloth: {
    intellect: 0.35,
    spirit: 0.25,
    stamina: 0.20,
    spell_power: 0.15,
    mp5: 0.05,
  },
  // ... more templates for every armor/role combination
};
```

### 4.3 Weapon DPS Scaling

Weapon DPS scales linearly with iLvl. Speed varies by weapon type.

```typescript
export function calculateWeaponDps(ilvl: number, quality: QualityTier): number {
  const baseDps = ilvl * 0.8;  // Linear scaling
  const qualityBonus = qualityMultipliers[quality];
  return Math.round(baseDps * qualityBonus * 10) / 10;
}

export const WEAPON_SPEEDS: Record<WeaponType, number> = {
  dagger: 1.4,
  sword_1h: 2.0,
  mace_1h: 2.2,
  axe_1h: 2.4,
  sword_2h: 3.4,
  mace_2h: 3.5,
  axe_2h: 3.6,
  polearm: 3.4,
  staff: 3.2,
  wand: 1.5,
  bow: 2.8,
  // shield, offhand_frill: N/A
};

// Damage range from DPS and speed:
// damageMin = floor(dps * speed * 0.85)
// damageMax = ceil(dps * speed * 1.15)
```

### 4.4 iLvl Progression Through Content

| Content Tier            | iLvl Range  | Budget Range (Epic) |
|------------------------|-------------|---------------------|
| Fresh 60 (quests)       | 40-55       | 96-132              |
| Dungeon gear            | 55-70 (to 98 for final boss drops) | 132-235 |
| Pre-raid BiS            | 85-98       | 204-235             |
| Raid Tier 1             | 95-105      | 228-252             |
| Raid Tier 2             | 102-115     | 245-276             |
| Raid Tier 3             | 116-130     | 278-312             |
| Raid Tier 4             | 125-145     | 300-391             |

### 4.5 Set Bonus Budget

Set bonuses are "free" stat budget -- they do not count against the item's stat budget. However, set items may have slightly lower individual stats (5% less budget) to compensate for set bonus power.

```typescript
export const SET_BONUS_BUDGET_PENALTY = 0.95; // Set items have 95% of normal budget
```

### 4.6 Gem Socket Budget

Each gem socket "costs" 8 stat budget points from the item. The gem itself provides 10-30 stats, so socketed items have a higher ceiling but lower floor.

```typescript
export const SOCKET_BUDGET_COST = 8;
// Item with 1 socket at iLvl 100 Epic:
// Budget = floor(100 * 2 * 1.20) - 8 = 232 from stats + gem stats
```

---

## 5. LOOT TABLE ARCHITECTURE

### 5.1 Design Principles

Every source of items in the game resolves through a `LootTable`. The engine calls `rollLoot(lootTableId, rng)` and receives a list of items. The data layer defines WHAT can drop; the engine defines HOW the roll happens.

### 5.2 Three-Layer Loot Model

```
Layer 1: Guaranteed Drops (always awarded)
  - Quest completion items
  - Boss kill gold
  - Tier tokens from specific bosses
  
Layer 2: Rolled Drops (N items from weighted pool)
  - Standard boss loot (2-3 items per boss)
  - Smart loot weighting by class/spec
  - Each item is independently eligible
  
Layer 3: Bonus Rolls (independent ultra-rare checks)
  - Mount drops (0.5-2%)
  - Legendary crafting materials (3-10%)
  - Recipe drops (0.5-5%)
  - Ultra-rare world drops (0.01-0.05%)
```

### 5.3 Smart Loot System

The smart loot system does NOT change drop rates -- it biases item selection toward upgrades for the player's class and spec.

```typescript
export interface SmartLootConfig {
  // When rolling from a pool, prefer items the player can equip
  classWeightBonus: number;     // 2.0 = 2x weight for class-appropriate items
  specWeightBonus: number;      // 1.5 = 1.5x weight for spec-appropriate items
  upgradeWeightBonus: number;   // 1.3 = 1.3x weight for items with higher iLvl
}
```

### 5.4 Bad Luck Protection

For chase items with bad luck protection, the data stores escalation breakpoints:

```json
{
  "itemId": "pristine_hide_of_beast",
  "badLuckProtection": {
    "baseDropRate": 0.15,
    "escalationKills": [10, 20, 30],
    "escalationRates": [0.20, 0.30, 0.50]
  }
}
```

The engine tracks kill counts per character per source and uses the appropriate rate from the escalation table.

### 5.5 Loot Table Composition Example (Bjornskar the Frost King)

```json
{
  "id": "lt_bjornskar_frost_king",
  "sourceType": "boss",
  "sourceId": "boss_bjornskar",
  "guaranteedDrops": [],
  "rolledDrops": [
    { "itemId": "bjornskars_icebreaker", "weight": 0.20, "minQuantity": 1, "maxQuantity": 1 },
    { "itemId": "frost_kings_crown", "weight": 0.20, "minQuantity": 1, "maxQuantity": 1 },
    { "itemId": "frozen_throne_legguards", "weight": 0.20, "minQuantity": 1, "maxQuantity": 1 },
    { "itemId": "cloak_eternal_winter", "weight": 0.20, "minQuantity": 1, "maxQuantity": 1 },
    { "itemId": "pattern_glacial_armor_kit", "weight": 0.10, "minQuantity": 1, "maxQuantity": 1 }
  ],
  "rolledDropCount": 3,
  "goldMin": 15000,
  "goldMax": 25000,
  "bonusRolls": [
    { "itemId": "frozen_deathcharger", "weight": 0.012, "minQuantity": 1, "maxQuantity": 1 }
  ]
}
```

### 5.6 World Drop Tables

Zone-level world drop tables are separate from mob-specific loot. Every mob kill in a zone ALSO rolls against the zone's world drop table for ultra-rares.

```json
{
  "id": "lt_world_drop_emberpeak",
  "sourceType": "world_mob",
  "sourceId": "zone_emberpeak",
  "guaranteedDrops": [],
  "rolledDrops": [],
  "rolledDropCount": 0,
  "goldMin": 0,
  "goldMax": 0,
  "bonusRolls": [
    { "itemId": "pendulum_of_doom", "weight": 0.0001, "minQuantity": 1, "maxQuantity": 1 }
  ]
}
```

---

## 6. CROSS-DOMAIN INTERFACES

### 6.1 Types Exported for Combat Agent (`realm-combat`)

The combat agent needs:
- `AbilityDefinition` -- all ability data including coefficients, cooldowns, cast times
- `TalentTree` and `TalentNode` -- to calculate talent-modified ability values
- `StatFormulas` -- rating conversions, caps, diminishing returns
- `MobDefinition` -- enemy stats and abilities for encounter simulation
- `BossAbility` / `BossPhase` -- boss mechanics for encounter AI
- `ItemDefinition` -- gear stats to compute character effective stats
- `ItemSetDefinition` -- set bonuses that modify combat behavior
- `EnchantDefinition` / `GemDefinition` -- additional stat sources

The combat agent NEVER modifies data. It reads from the frozen `GameData` singleton.

### 6.2 Types Exported for Engine Agent (`realm-engine`)

The engine agent needs:
- `LootTable` / `LootTableEntry` -- for rolling loot through the seeded RNG
- `QuestDefinition` / `QuestObjective` -- for quest state machine progression
- `DungeonDefinition` / `RaidDefinition` -- for content state machines
- `ZoneDefinition` -- for zone activity management
- `RecipeDefinition` -- for crafting queue processing
- `ProfessionDefinition` -- for gathering simulation
- `AchievementDefinition` -- for achievement condition checking
- `AuctionHouseConfig` -- for simulated AH
- `CompanionQuality` thresholds from dungeons/raids

The engine owns the item_template_id foreign key in the SQLite items table. It references `ItemId` from data to hydrate item instances.

### 6.3 Types Exported for UI Agent (`realm-ui`)

The UI agent needs essentially everything, but read-only:
- `ItemDefinition` -- for tooltips (stat display, flavor text, source info)
- `QualityTier` -> color mapping (grey/green/blue/purple/orange)
- `TalentTree` -- for talent tree UI rendering
- `ZoneDefinition` -- for zone map display
- `DungeonDefinition` / `RaidDefinition` -- for content panels
- `AchievementDefinition` -- for achievement panel
- `RecipeDefinition` -- for profession UI
- All `icon` fields (char + fg + bg) for ASCII rendering

### 6.4 Runtime Loading API

```typescript
// src/game/data/index.ts -- Public API for all consumers

export { getGameData, getItem, getZone, getMob, getLootTable } from "./registry";
export { loadGameData } from "./loader";

// Convenience functions for common lookups
export function getItemsBySlot(slot: GearSlot): ItemDefinition[];
export function getItemsByQuality(quality: QualityTier): ItemDefinition[];
export function getItemsByIlvlRange(min: number, max: number): ItemDefinition[];
export function getMobsByZone(zoneId: ZoneId): MobDefinition[];
export function getQuestsByZone(zoneId: ZoneId): QuestDefinition[];
export function getRecipesByProfession(prof: ProfessionName): RecipeDefinition[];
export function getAchievementsByCategory(cat: string): AchievementDefinition[];
export function getDungeonBossLoot(bossId: BossId): ItemDefinition[];
export function getSetPieces(setId: SetId): ItemDefinition[];
```

---

## 7. DEPENDENCIES ON OTHER DOMAINS

### 7.1 From Engine (`realm-engine`)

**I need:**
- Seeded RNG interface -- loot rolls must use the engine's deterministic RNG, not `Math.random()`. The data layer defines probabilities; the engine rolls dice.
- Save schema compatibility -- the engine's SQLite `items` table stores `item_template_id` as an integer FK. My `ItemId` branded strings must have a mapping to integer IDs, or the engine schema must use string IDs. This is a critical coordination point.
- Tick dispatch timing -- to know when data is loaded (must complete before first tick).
- IPC bridge -- if data files are loaded in the main process, the renderer needs an IPC channel to access `GameData`. Alternatively, data loads in both processes.

**Coordination needed:**
- Agree on ID format: I recommend string IDs (`"iron_sword_01"`) stored in SQLite as TEXT. This avoids a brittle integer-to-string mapping layer. The engine's `item_template_id INTEGER` in the design doc schema should become `item_template_id TEXT`.
- Agree on data loading timing: Data should load synchronously (or with blocking await) before the game loop starts.

### 7.2 From Combat (`realm-combat`)

**I need:**
- `simulateEncounter(party, boss, config)` API -- for balance testing. I define test scenarios, combat executes them.
- `calculateCharacterStats(character, gear)` function -- to verify stat budgets produce expected effective stats.
- Confirmation that my `AbilityEffect` schema captures everything combat needs. If combat discovers a missing effect type, we add it.

**Coordination needed:**
- Agree on the `AbilityEffect.type` enum -- it must be exhaustive for all combat effects.
- Agree on coefficient interpretation -- does `coefficient: 0.714` mean "multiply by spell power and then by 0.714"? Yes, per design doc, but we need a shared constant for the formula.

### 7.3 From UI (`realm-ui`)

**I need:**
- Nothing directly. UI consumes my data, never produces it.
- Feedback on data format for tooltip rendering -- does the UI need pre-formatted stat strings, or does it format from raw numbers? I recommend raw numbers; UI owns formatting.

**Coordination needed:**
- Agree on `icon` field format -- `{ char: string; fg: number; bg: number }` using ANSI 16-color indices. UI maps these to actual colors.
- Agree on `description` vs `loreText` vs `tooltipOverride` -- items have multiple text fields; the UI needs to know which to display where.

---

## 8. BALANCE TEST HARNESS

### 8.1 Architecture

The balance test harness is a Vitest test suite that:
1. Loads all game data
2. Validates data integrity (schema, budget, references)
3. Constructs simulated characters with specific gear sets
4. Calls `realm-combat`'s `simulateEncounter()` API
5. Asserts outcomes fall within expected ranges

### 8.2 Test Categories

**Category A: Data Integrity Tests (Pure Data, No Combat)**

```typescript
// tests/data/stat-budget.test.ts
describe("Stat Budget System", () => {
  test.each(allItems)("item %s has correct stat budget", (item) => {
    const expectedBudget = Math.floor(item.itemLevel * 2 * qualityMultiplier(item.quality));
    const sockets = (item.sockets?.length ?? 0) * SOCKET_BUDGET_COST;
    const setPenalty = item.setId ? SET_BONUS_BUDGET_PENALTY : 1.0;
    const adjustedBudget = Math.floor(expectedBudget * setPenalty) - sockets;
    
    const actualBudget = sumStats(item.stats);
    expect(actualBudget).toBeCloseTo(adjustedBudget, /*tolerance*/ 5);
  });
});
```

```typescript
// tests/data/xp-curve.test.ts
describe("XP Curve", () => {
  test("total XP 1-60 equals 4,827,000", () => {
    let total = 0;
    for (let level = 1; level < 60; level++) {
      total += Math.round(1000 * Math.pow(level, 2.4));
    }
    expect(total).toBe(4_827_000);
  });
  
  test("individual level thresholds match design doc samples", () => {
    expect(xpRequired(1)).toBeCloseTo(400, -1);
    expect(xpRequired(10)).toBeCloseTo(7900, -2);
    expect(xpRequired(30)).toBeCloseTo(48200, -2);
    expect(xpRequired(50)).toBeCloseTo(162800, -2);
    expect(xpRequired(59)).toBeCloseTo(220000, -2);
  });
});
```

```typescript
// tests/data/loot-table-integrity.test.ts
describe("Loot Table Integrity", () => {
  test.each(allLootTables)("table %s has valid item references", (table) => {
    for (const entry of [...table.guaranteedDrops, ...table.rolledDrops, ...(table.bonusRolls ?? [])]) {
      expect(getItem(entry.itemId)).toBeDefined();
    }
  });
  
  test.each(allLootTables)("table %s rolled drop weights are <= 1.0 total", (table) => {
    const totalWeight = table.rolledDrops.reduce((sum, e) => sum + e.weight, 0);
    expect(totalWeight).toBeLessThanOrEqual(1.0);
  });
  
  test("every dungeon boss has a loot table", () => {
    for (const dungeon of Object.values(dungeons)) {
      for (const boss of dungeon.bosses) {
        expect(lootTables[boss.lootTableId]).toBeDefined();
      }
    }
  });
  
  test("every raid boss has a loot table", () => {
    // Similar for raids
  });
});
```

```typescript
// tests/data/talent-dag.test.ts
describe("Talent Tree DAG Validity", () => {
  test.each(allTalentTrees)("tree %s has no circular prerequisites", (tree) => {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    function hasCycle(nodeId: string): boolean {
      visited.add(nodeId);
      recursionStack.add(nodeId);
      const node = tree.nodes.find(n => n.id === nodeId);
      for (const prereq of node.prerequisites) {
        if (!visited.has(prereq)) {
          if (hasCycle(prereq)) return true;
        } else if (recursionStack.has(prereq)) {
          return true;
        }
      }
      recursionStack.delete(nodeId);
      return false;
    }
    
    for (const node of tree.nodes) {
      if (!visited.has(node.id)) {
        expect(hasCycle(node.id)).toBe(false);
      }
    }
  });
  
  test.each(allTalentTrees)("tree %s tier requirements are achievable", (tree) => {
    for (const node of tree.nodes) {
      const pointsInLowerTiers = tree.nodes
        .filter(n => n.tier < node.tier)
        .reduce((sum, n) => sum + n.maxRanks, 0);
      expect(pointsInLowerTiers).toBeGreaterThanOrEqual(node.tierPointRequirement);
    }
  });
});
```

**Category B: Balance Simulation Tests (Requires Combat Agent)**

```typescript
// tests/data/balance/encounter-simulation.test.ts
describe("Encounter Balance", () => {
  test("Tier 1 geared party can clear Molten Sanctum Emberwing", async () => {
    const party = createTestParty({
      tank: { class: "warrior", spec: "protection", avgIlvl: 85 },
      healer: { class: "cleric", spec: "holy", avgIlvl: 85 },
      dps: [
        { class: "mage", spec: "fire", avgIlvl: 85 },
        { class: "rogue", spec: "combat", avgIlvl: 85 },
        { class: "ranger", spec: "marksmanship", avgIlvl: 85 },
      ],
    });
    
    const results = await simulateEncounterNTimes(party, "boss_emberwing", 1000);
    
    expect(results.winRate).toBeGreaterThan(0.6);   // At least 60% clearable
    expect(results.winRate).toBeLessThan(0.95);       // Not trivial
    expect(results.avgClearTimeSeconds).toBeLessThan(480); // Under 8 minutes
  });
  
  test("Dungeon-geared party cannot skip to Tier 2 raids", async () => {
    const party = createTestParty({ avgIlvl: 70 }); // Dungeon gear
    const results = await simulateEncounterNTimes(party, "boss_high_priest_anthos", 100);
    
    expect(results.winRate).toBeLessThan(0.1); // Should be nearly impossible
  });
});
```

```typescript
// tests/data/balance/spec-balance.test.ts
describe("Spec DPS Balance", () => {
  test("no DPS spec is >15% below mean DPS at equivalent gear", async () => {
    const dpsSpecs = getAllDpsSpecs();
    const results: Record<string, number> = {};
    
    for (const spec of dpsSpecs) {
      const char = createTestCharacter({ spec, avgIlvl: 100 });
      const sim = await simulatePatchwerk(char, 300); // 5min fight
      results[spec] = sim.avgDps;
    }
    
    const mean = Object.values(results).reduce((a, b) => a + b) / dpsSpecs.length;
    
    for (const [spec, dps] of Object.entries(results)) {
      expect(dps).toBeGreaterThan(mean * 0.85);
    }
  });
});
```

```typescript
// tests/data/balance/progression-path.test.ts
describe("Progression Path", () => {
  test("gear progression enables content progression", async () => {
    const tiers = [
      { gearIlvl: 70, content: "dungeon_bosses", expectedWinRate: [0.5, 0.95] },
      { gearIlvl: 85, content: "tier1_bosses", expectedWinRate: [0.4, 0.85] },
      { gearIlvl: 100, content: "tier2_bosses", expectedWinRate: [0.4, 0.85] },
      { gearIlvl: 115, content: "tier3_bosses", expectedWinRate: [0.3, 0.80] },
      { gearIlvl: 130, content: "tier4_bosses", expectedWinRate: [0.2, 0.70] },
    ];
    
    for (const tier of tiers) {
      const party = createTestParty({ avgIlvl: tier.gearIlvl });
      const results = await simulateContentTier(party, tier.content, 500);
      expect(results.winRate).toBeGreaterThan(tier.expectedWinRate[0]);
      expect(results.winRate).toBeLessThan(tier.expectedWinRate[1]);
    }
  });
});
```

**Category C: Economy Balance Tests (Data-Only)**

```typescript
// tests/data/economy-balance.test.ts
describe("Economy Balance", () => {
  test("leveling 1-60 nets approximately 1,200g", () => {
    let totalGold = 0;
    for (const zone of Object.values(zones)) {
      for (const quest of getQuestsByZone(zone.id)) {
        totalGold += quest.rewards.gold;
      }
      // Estimate mob gold from zone grinding
      const avgMobGold = zone.levelRange.max * 0.6 * 100; // copper per mob
      const mobsKilledInZone = zone.totalDesignXp / (zone.levelRange.max * 45 + 100);
      totalGold += mobsKilledInZone * avgMobGold;
    }
    
    // Subtract estimated spending (mount, repairs, training)
    const spending = 300 * 10000; // 300g in copper
    const net = (totalGold - spending) / 10000; // convert copper to gold
    
    expect(net).toBeGreaterThan(1000);
    expect(net).toBeLessThan(1500);
  });
  
  test("daily quest hub yields 75-150g per day", () => {
    const dailies = getQuestsByType("daily");
    const dailyGold = dailies.slice(0, 5).reduce((sum, q) => sum + q.rewards.gold, 0);
    expect(dailyGold / 10000).toBeGreaterThan(75);
    expect(dailyGold / 10000).toBeLessThan(150);
  });
});
```

---

## 9. RISK ASSESSMENT

### 9.1 Schema Complexity

**RISK: HIGH.** The data layer has 20+ distinct schemas with hundreds of cross-references. A single ID typo in a loot table breaks an entire dungeon's rewards.

**Mitigation:**
- Comprehensive cross-reference validation at load time (Phase 0). If any ID resolves to `undefined`, the game refuses to start.
- Branded type IDs (`ItemId`, `BossId`) make it impossible to accidentally pass a `ZoneId` where a `BossId` is expected at compile time.
- CI pipeline runs all data integrity tests on every commit.

### 9.2 Data Volume

**RISK: MEDIUM.** With 200+ items, 200+ quests, 60+ bosses, 600+ achievements, the JSON files will be large. Maintaining them by hand is error-prone.

**Mitigation:**
- Split JSON files by domain and sub-domain (items/dungeon_loot.json, items/raid_loot.json, etc.).
- Build a data generation utility for stat-budget-conformant items: provide `(name, ilvl, quality, slot, role_template)` and it computes stats automatically.
- Content completeness tests catch missing entries early.

### 9.3 Forward Compatibility

**RISK: MEDIUM.** The post-launch roadmap adds a Monk class, Engineering profession, new zones, new dungeons, new raids, level 70, prestige system.

**Mitigation:**
- Schemas use string IDs and open enums, not closed integer sequences. Adding a 9th class or 13th zone requires no schema changes -- just new data entries.
- The `ClassName` enum can be extended in a future version without breaking existing saves, because the engine stores class names as TEXT in SQLite, not as integer codes.
- Data loader validates against Zod schemas, which can be backward-compatible (new optional fields).
- Version migration system handles schema evolution.

### 9.4 Maintainability

**RISK: MEDIUM.** A solo developer must maintain 20+ JSON files, their schemas, and their tests.

**Mitigation:**
- Data generation utilities reduce manual work.
- Schema validation catches errors early.
- Test harness provides confidence that changes don't break balance.
- Clear separation: add a new dungeon by adding one JSON file and one loot table JSON file, then run tests.

### 9.5 Performance

**RISK: LOW.** All game data loads into memory at startup. At the estimated data volume (<5 MB total JSON), loading takes <100ms. The `GameData` object is frozen and immutable, enabling safe concurrent reads.

### 9.6 Save/Data ID Coordination

**RISK: HIGH.** The engine's SQLite schema uses `item_template_id INTEGER` for items, but the data layer uses branded string IDs. This mismatch will cause bugs.

**Mitigation:** Resolve in Phase 0 by coordinating with the engine agent. Recommended approach: change `item_template_id` to TEXT in the SQLite schema, or maintain a stable integer mapping in the data layer. I strongly recommend TEXT IDs throughout -- they are debuggable, human-readable, and extensible.

---

## 10. ESTIMATED COMPLEXITY

| Phase | Description | Size | Duration Estimate | Key Risk |
|-------|------------|------|-------------------|----------|
| **Phase 0** | Foundation (enums, branded types, constants, Zod setup) | **S** | 1-2 days | Must coordinate ID format with engine |
| **Phase 1** | Character Foundation (races, classes, stats, abilities, talents) | **L** | 5-7 days | 24 complete talent trees, 100+ abilities per class |
| **Phase 2** | Items and Economy (items, gems, enchants, sets, vendors) | **XL** | 7-10 days | 200+ items with budget-verified stats |
| **Phase 3** | World Content (zones, mobs, quests) | **L** | 5-7 days | 200+ quests, 100+ mob types, 12 zones |
| **Phase 4** | Instanced Content (dungeons, raids, loot tables) | **XL** | 7-10 days | 60+ boss encounters, 60+ loot tables |
| **Phase 5** | Professions (professions, recipes, transmutes) | **M** | 3-5 days | 100+ recipes across 12 professions |
| **Phase 6** | Meta/Chase (achievements, legendaries, chase items, AH) | **L** | 5-7 days | 600+ achievements, 5 legendary questlines |
| **Phase 7** | Balance Test Harness | **L** | 5-7 days | Requires combat agent API; can run in parallel once it exists |

**Total estimated effort:** 38-55 days for a single developer.

**Parallelization opportunities:**
- Phases 1-3 can proceed simultaneously once Phase 0 is complete.
- Phase 4 depends on Phases 1 and 2 (boss stats need stat formulas; loot tables need items).
- Phase 5 depends on Phase 2 (recipes produce items).
- Phase 6 depends on Phases 3 and 4 (achievements reference content).
- Phase 7 can start skeleton tests in Phase 0 and grow incrementally.

**Critical path:** Phase 0 -> Phase 1 + Phase 2 (parallel) -> Phase 4 -> Phase 7.

---

### Critical Files for Implementation

- `/mnt/c/Users/Caus/Desktop/LegendsOfTheRealm/src/shared/enums.ts` (to be created) - Foundation of the entire type system; every data file, every consumer agent, every schema depends on these enum definitions. Must be settled first and must never have breaking changes.
- `/mnt/c/Users/Caus/Desktop/LegendsOfTheRealm/src/game/data/schemas/item.schema.ts` (to be created) - The single most cross-referenced schema. Items are referenced by loot tables, quest rewards, recipes, achievements, set bonuses, vendors, and chase items. Getting the `ItemDefinition` interface right is the highest-leverage design decision.
- `/mnt/c/Users/Caus/Desktop/LegendsOfTheRealm/src/game/data/loader.ts` (to be created) - The runtime loading and validation pipeline. Every consumer agent depends on this loading correctly, validating all cross-references, and producing a frozen `GameData` singleton. This is the single point of failure for data integrity.
- `/mnt/c/Users/Caus/Desktop/LegendsOfTheRealm/src/game/data/schemas/loot_table.schema.ts` (to be created) - The loot system is the primary reward mechanism. Its three-layer architecture (guaranteed/rolled/bonus) must be expressive enough to handle every drop scenario from zone grinding to raid ultra-rares to fishing treasures, while remaining simple enough for the engine to roll efficiently.
- `/mnt/c/Users/Caus/Desktop/LegendsOfTheRealm/project_plans/02_character_and_combat.md` (existing, reference) - The source of truth for all combat formulas, stat conversions, and talent tree definitions. Every number in the data layer must trace back to this document. The balance test harness verifies conformance against it.