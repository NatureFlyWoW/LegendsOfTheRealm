// src/game/combat/healing.ts
import type { ISeededRng } from "@shared/combat-interfaces";

/**
 * Input parameters for heal calculation.
 */
export interface HealInput {
  baseHealMin: number;
  baseHealMax: number;
  spellPower: number;
  coefficient: number;
  isCrit: boolean;
  critMultiplier: number; // Default 1.5
  modifiers: number;
}

/**
 * Result of applying healing to a target.
 */
export interface HealingResult {
  actual: number; // HP actually restored
  overheal: number; // Healing that exceeded max HP
}

/**
 * Calculate direct heal amount.
 *
 * Formula:
 * (baseHeal + SP * coefficient) * modifiers * critMultiplier
 *
 * Note: Unlike damage, healing has no variance.
 */
export function calculateHeal(input: HealInput, rng: ISeededRng): number {
  // Calculate base heal
  const baseHeal = rng.nextFloat(input.baseHealMin, input.baseHealMax);

  // Add spell power contribution
  const spellPowerContribution = input.spellPower * input.coefficient;
  let heal = baseHeal + spellPowerContribution;

  // Apply modifiers
  heal *= input.modifiers;

  // Apply crit multiplier
  if (input.isCrit) {
    heal *= input.critMultiplier;
  }

  return heal;
}

/**
 * Calculate healing per tick for HoT (Heal over Time) effects.
 *
 * HoTs distribute healing evenly across ticks.
 *
 * Formula:
 * (baseTotalHeal + SP * coefficient) / numTicks
 */
export function calculateHotTick(
  baseTotalHeal: number,
  spellPower: number,
  coefficient: number,
  numTicks: number
): number {
  const totalHeal = baseTotalHeal + spellPower * coefficient;
  return totalHeal / numTicks;
}

/**
 * Calculate absorb shield amount.
 *
 * Formula:
 * baseAbsorb + SP * coefficient
 */
export function calculateAbsorb(
  baseAbsorb: number,
  spellPower: number,
  coefficient: number
): number {
  return baseAbsorb + spellPower * coefficient;
}

/**
 * Apply healing to a target and track overheal.
 *
 * Healing cannot exceed max HP. Any excess is recorded as overheal.
 *
 * Returns:
 * - actual: HP actually restored
 * - overheal: Healing that exceeded max HP
 */
export function applyHealing(
  healAmount: number,
  currentHp: number,
  maxHp: number
): HealingResult {
  const missingHp = maxHp - currentHp;
  const actual = Math.min(healAmount, missingHp);
  const overheal = healAmount - actual;

  return {
    actual,
    overheal,
  };
}
