// src/shared/constants.ts

// ============================================================
// Core Game Constants
// ============================================================

export const TICK_RATE_MS = 1000;
export const MAX_LEVEL = 60;
export const XP_FORMULA_EXPONENT = 2.4;
export const BAG_SLOT_COUNT = 80;
export const MAX_CHARACTERS_PER_SAVE = 50;
export const AUTO_SAVE_INTERVAL_MS = 60_000;
export const MAX_OFFLINE_SECONDS = 604_800;
export const TICK_BUDGET_MS = 50;

// ============================================================
// XP Formulas (from design doc Section 2.4)
// ============================================================

export function xpToNextLevel(level: number): number {
  if (level >= MAX_LEVEL) return 0;
  return Math.round(1000 * Math.pow(level, XP_FORMULA_EXPONENT));
}

export function calculateBaseMobXP(mobLevel: number): number {
  return mobLevel * 45 + 100;
}

export function getMobXpLevelModifier(delta: number): number {
  if (delta >= 4) return 1.4;
  if (delta === 3) return 1.3;
  if (delta === 2) return 1.2;
  if (delta === 1) return 1.1;
  if (delta === 0) return 1.0;
  if (delta === -1) return 0.9;
  if (delta === -2) return 0.75;
  if (delta === -3) return 0.5;
  if (delta === -4) return 0.25;
  return 0.1;
}

// ============================================================
// Stat Budget (from design doc Section 2.2)
// ============================================================

export const STAT_BUDGET_PER_ILVL = 2;

export const QUALITY_ILVL_OFFSET = {
  common: 0,
  uncommon: 5,
  rare: 10,
  epic: 20,
  legendary: 30,
} as const;

// ============================================================
// Companion System
// ============================================================

export const COMPANION_THRESHOLDS = {
  dungeon: { veteran: 1, elite: 10, champion: 25 },
  raid: { veteran: 1, elite: 5, champion: 15 },
} as const;

export const COMPANION_EFFICIENCY = {
  recruit: 0.70,
  veteran: 0.85,
  elite: 1.00,
  champion: 1.15,
} as const;

export const COMPANION_ILVL_OFFSET = {
  recruit: -10,
  veteran: 0,
  elite: 5,
  champion: 10,
} as const;

// ============================================================
// Offline Efficiency Penalties
// ============================================================

export const OFFLINE_EFFICIENCY = {
  grinding: 0.80,
  questing: 0.75,
  dungeon: 0.70,
  gathering: 0.85,
  crafting: 0.95,
  fishing: 0.90,
  raid: 0,
} as const;

// ============================================================
// Rested XP
// ============================================================

export const RESTED_XP_RATE = 0.05;
export const RESTED_XP_INTERVAL = 28_800;
export const RESTED_XP_CAP_MULTIPLIER = 1.5;
export const RESTED_XP_CONSUMPTION_MULTIPLIER = 2.0;

// ============================================================
// Rating Conversions at Level 60 (from design doc Section 2.1.2)
// ============================================================

export const RATING_CONVERSIONS = {
  critRating: 22,
  hitRating: 12.5,
  hasteRating: 15,
  defenseRating: 2.5,
  dodgeRating: 18,
  parryRating: 20,
  blockRating: 5,
  resilience: 25,
  spellHitRating: 12.5,
} as const;

// ============================================================
// Combat Constants
// ============================================================

export const BASE_GCD_SECONDS = 1.5;
export const MIN_GCD_SECONDS = 1.0;
export const BASE_PHYSICAL_CRIT_MULTIPLIER = 2.0;
export const BASE_HEALING_CRIT_MULTIPLIER = 1.5;
export const BOSS_CRIT_SUPPRESSION = 0.048;
export const DUAL_WIELD_MISS_PENALTY = 0.19;
export const MELEE_AGGRO_THRESHOLD = 1.1;
export const RANGED_AGGRO_THRESHOLD = 1.3;
export const HEALING_THREAT_MULTIPLIER = 0.5;

// ============================================================
// HP and Mana formulas
// ============================================================

export const HP_PER_STAMINA = 10;
export const MANA_PER_INTELLECT = 15;

// ============================================================
// Armor Mitigation
// ============================================================

export const ARMOR_CONSTANT_BASE = 400;
export const ARMOR_CONSTANT_PER_LEVEL = 85;

// ============================================================
// Spell Coefficients
// ============================================================

export const SPELL_COEFFICIENT_REFERENCE_CAST = 3.5;
