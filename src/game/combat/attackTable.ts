// src/game/combat/attackTable.ts
import type { ISeededRng } from "@shared/combat-interfaces";
import {
  RATING_CONVERSIONS,
  BOSS_CRIT_SUPPRESSION,
  DUAL_WIELD_MISS_PENALTY,
} from "@shared/constants";

/**
 * Input parameters for building an attack table.
 */
export interface AttackTableInput {
  hitRating: number;
  critChance: number; // Already computed as percentage
  targetDodgeChance: number;
  targetParryChance: number;
  targetBlockChance: number;
  isDualWield: boolean;
  isSpell: boolean;
  isBoss: boolean;
}

/**
 * Attack table result - all bands are percentages that sum to 100.
 * Bands are evaluated in order: Miss → Dodge → Parry → Block → Crit → Hit
 */
export interface AttackTableResult {
  miss: number;
  dodge: number;
  parry: number;
  block: number;
  crit: number;
  hit: number;
}

/**
 * Build an attack table for physical or spell attacks.
 *
 * Physical attacks: Miss → Dodge → Parry → Block → Crit → Hit
 * Spell attacks: Miss → Crit → Hit (no avoidance)
 *
 * Key rules:
 * - Base miss: 5% melee, 24% dual-wield, 6% spell
 * - Hit rating reduces miss: 1% per 12.5 rating
 * - Boss crit suppression: -4.8% crit
 * - Push-off: when avoidance exceeds space, hit is pushed off first, then crit
 * - All bands sum to exactly 100%
 */
export function buildAttackTable(input: AttackTableInput): AttackTableResult {
  // Calculate base miss chance
  let baseMiss: number;
  if (input.isSpell) {
    baseMiss = 6;
  } else if (input.isDualWield) {
    baseMiss = 5 + DUAL_WIELD_MISS_PENALTY * 100;
  } else {
    baseMiss = 5;
  }

  // Apply hit rating to reduce miss
  const hitPercent = input.hitRating / RATING_CONVERSIONS.hitRating;
  const miss = Math.max(0, baseMiss - hitPercent);

  // For spell attacks, only miss/crit/hit bands exist
  if (input.isSpell) {
    const crit = Math.max(0, input.critChance);
    const hit = 100 - miss - crit;

    return {
      miss,
      dodge: 0,
      parry: 0,
      block: 0,
      crit,
      hit: Math.max(0, hit),
    };
  }

  // Physical attack table
  const dodge = Math.max(0, input.targetDodgeChance);
  const parry = Math.max(0, input.targetParryChance);
  const block = Math.max(0, input.targetBlockChance);

  // Apply boss crit suppression
  let crit = input.critChance;
  if (input.isBoss) {
    crit = Math.max(0, crit - BOSS_CRIT_SUPPRESSION * 100);
  }

  // Calculate space consumed by fixed bands (miss + avoidance)
  const fixedBands = miss + dodge + parry + block;
  const availableSpace = 100 - fixedBands;

  // Push-off logic: crit and hit must fit in available space
  // If not enough space, hit is reduced first, then crit
  let finalCrit = crit;
  let finalHit = 0;

  if (availableSpace >= crit) {
    // Enough space for full crit
    finalCrit = crit;
    finalHit = availableSpace - crit;
  } else if (availableSpace > 0) {
    // Only partial crit fits, no hit
    finalCrit = availableSpace;
    finalHit = 0;
  } else {
    // No space at all
    finalCrit = 0;
    finalHit = 0;
  }

  return {
    miss,
    dodge,
    parry,
    block,
    crit: finalCrit,
    hit: finalHit,
  };
}

/**
 * Resolve a single attack roll using the attack table.
 *
 * Uses a single roll (0-100) and checks bands in order:
 * Miss → Dodge → Parry → Block → Crit → Hit
 *
 * Returns the outcome as a string.
 */
export function resolveAttack(
  table: AttackTableResult,
  rng: ISeededRng
): "miss" | "dodge" | "parry" | "block" | "crit" | "hit" {
  const roll = rng.nextFloat(0, 100);

  let cumulative = 0;

  cumulative += table.miss;
  if (roll < cumulative) return "miss";

  cumulative += table.dodge;
  if (roll < cumulative) return "dodge";

  cumulative += table.parry;
  if (roll < cumulative) return "parry";

  cumulative += table.block;
  if (roll < cumulative) return "block";

  cumulative += table.crit;
  if (roll < cumulative) return "crit";

  return "hit";
}
