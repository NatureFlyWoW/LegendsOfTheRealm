// Canonical game enums for Legends of the Shattered Realm
// All game content references these shared enums. Values are lowercase snake_case strings.

// ---------------------------------------------------------------------------
// Character & Class
// ---------------------------------------------------------------------------

export enum ClassName {
  Warrior = "warrior",
  Mage = "mage",
  Cleric = "cleric",
  Rogue = "rogue",
  Ranger = "ranger",
  Necromancer = "necromancer",
  Shaman = "shaman",
  Druid = "druid",
}

export enum RaceName {
  Human = "human",
  Orc = "orc",
  Elf = "elf",
  Dwarf = "dwarf",
  Troll = "troll",
  Undead = "undead",
}

// ---------------------------------------------------------------------------
// Resources — 9 distinct resource types used across all specs
// ---------------------------------------------------------------------------

export enum ResourceType {
  Mana = "mana",
  Rage = "rage",
  Energy = "energy",
  ComboPoints = "combo_points",
  SoulShards = "soul_shards",
  Focus = "focus",
  DivineFavor = "divine_favor",
  Maelstrom = "maelstrom",
  ArcaneCharges = "arcane_charges",
}

// ---------------------------------------------------------------------------
// Item Quality
// ---------------------------------------------------------------------------

export enum QualityTier {
  Common = "common",
  Uncommon = "uncommon",
  Rare = "rare",
  Epic = "epic",
  Legendary = "legendary",
}

// ---------------------------------------------------------------------------
// Equipment — 16 gear slots (includes Back)
// ---------------------------------------------------------------------------

export enum GearSlot {
  Head = "head",
  Shoulder = "shoulder",
  Back = "back",
  Chest = "chest",
  Wrist = "wrist",
  Hands = "hands",
  Waist = "waist",
  Legs = "legs",
  Feet = "feet",
  Neck = "neck",
  Ring1 = "ring1",
  Ring2 = "ring2",
  Trinket1 = "trinket1",
  Trinket2 = "trinket2",
  MainHand = "main_hand",
  OffHand = "off_hand",
}

// ---------------------------------------------------------------------------
// Damage Schools
// ---------------------------------------------------------------------------

export enum DamageType {
  Physical = "physical",
  Fire = "fire",
  Frost = "frost",
  Arcane = "arcane",
  Nature = "nature",
  Shadow = "shadow",
  Holy = "holy",
}

// ---------------------------------------------------------------------------
// NPC Companion Quality
// ---------------------------------------------------------------------------

export enum CompanionQuality {
  Recruit = "recruit",
  Veteran = "veteran",
  Elite = "elite",
  Champion = "champion",
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export enum PrimaryStat {
  Strength = "strength",
  Agility = "agility",
  Intellect = "intellect",
  Stamina = "stamina",
  Spirit = "spirit",
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
  AttackPower = "attack_power",
  SpellPower = "spell_power",
  Armor = "armor",
  MP5 = "mp5",
}

// ---------------------------------------------------------------------------
// Activity / Idle Loop
// ---------------------------------------------------------------------------

export enum ActivityType {
  Idle = "idle",
  Grinding = "grinding",
  Questing = "questing",
  Dungeon = "dungeon",
  Raid = "raid",
  Gathering = "gathering",
  Crafting = "crafting",
  Fishing = "fishing",
  RestedInn = "rested_inn",
}

// ---------------------------------------------------------------------------
// Encounter Resolution
// ---------------------------------------------------------------------------

export type EncounterOutcome = "victory" | "wipe" | "enrage" | "timeout";

// ---------------------------------------------------------------------------
// Ability Effect Types — 34 distinct effect categories
// ---------------------------------------------------------------------------

export type AbilityEffectType =
  | "damage"
  | "heal"
  | "dot"
  | "hot"
  | "buff"
  | "debuff"
  | "absorb"
  | "shield"
  | "summon"
  | "summon_pet"
  | "dispel"
  | "interrupt"
  | "purge"
  | "taunt"
  | "threat_mod"
  | "stun"
  | "root"
  | "silence"
  | "fear"
  | "disorient"
  | "charm"
  | "knockback"
  | "pull"
  | "mana_drain"
  | "mana_burn"
  | "resource_restore"
  | "immunity"
  | "damage_reduction"
  | "morph"
  | "aura"
  | "execute"
  | "guaranteed_crit"
  | "linked_health"
  | "channel";

// ---------------------------------------------------------------------------
// Talent Effect Types — 17 talent modifier categories
// ---------------------------------------------------------------------------

export type TalentEffectType =
  | "stat_bonus"
  | "stat_percentage_bonus"
  | "ability_modifier"
  | "passive_proc"
  | "grant_ability"
  | "resource_modifier"
  | "cooldown_reduction"
  | "cost_reduction"
  | "damage_increase"
  | "healing_increase"
  | "crit_chance_bonus"
  | "crit_damage_bonus"
  | "threat_modifier"
  | "avoidance_bonus"
  | "pet_bonus"
  | "form_bonus"
  | "pushback_resistance";

// ---------------------------------------------------------------------------
// Weapon Types
// ---------------------------------------------------------------------------

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
  Bow = "bow",
  Shield = "shield",
  OffhandFrill = "offhand_frill",
}

// ---------------------------------------------------------------------------
// Armor Types
// ---------------------------------------------------------------------------

export enum ArmorType {
  Cloth = "cloth",
  Leather = "leather",
  Mail = "mail",
  Plate = "plate",
}

// ---------------------------------------------------------------------------
// Talent Specs — 24 specs (3 per class)
// Some specs share names across classes, so we suffix with class name
// where ambiguous (Fire for Mage vs Fire damage type, etc.)
// ---------------------------------------------------------------------------

export enum TalentSpec {
  // Warrior
  Protection = "protection",
  Arms = "arms",
  Fury = "fury",
  // Mage
  FireMage = "fire",
  FrostMage = "frost",
  ArcaneMage = "arcane",
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
  RestorationDruid = "restoration_druid",
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
