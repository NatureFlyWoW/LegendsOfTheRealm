// src/game/combat/damage.ts
import type { ISeededRng } from "@shared/combat-interfaces";

/**
 * Input parameters for physical damage calculation.
 */
export interface PhysicalDamageInput {
  weaponDamageMin: number;
  weaponDamageMax: number;
  weaponSpeed: number;
  attackPower: number;
  coefficient: number;
  armorMitigation: number; // 0-1
  critMultiplier: number;
  isCrit: boolean;
  modifiers: number; // Multiplicative, e.g. 1.1 for 10% bonus
}

/**
 * Input parameters for spell damage calculation.
 */
export interface SpellDamageInput {
  baseDamageMin: number;
  baseDamageMax: number;
  spellPower: number;
  coefficient: number;
  isCrit: boolean;
  critMultiplier: number;
  resistance: number; // 0-1
  modifiers: number;
}

/**
 * Calculate physical ability damage.
 *
 * Formula:
 * (weaponDmg + (AP / 14) * speed) * coefficient * modifiers * (1 - armorMitigation) * critMultiplier * variance
 *
 * Variance: random value between 0.95 and 1.05
 */
export function calculatePhysicalDamage(
  input: PhysicalDamageInput,
  rng: ISeededRng
): number {
  // Calculate weapon damage
  const weaponDamage = rng.nextFloat(input.weaponDamageMin, input.weaponDamageMax);

  // Add attack power contribution
  const apContribution = (input.attackPower / 14) * input.weaponSpeed;
  const baseDamage = weaponDamage + apContribution;

  // Apply coefficient
  let damage = baseDamage * input.coefficient;

  // Apply modifiers
  damage *= input.modifiers;

  // Apply armor mitigation
  damage *= 1 - input.armorMitigation;

  // Apply crit multiplier
  if (input.isCrit) {
    damage *= input.critMultiplier;
  }

  // Apply variance
  const variance = rng.nextFloat(0.95, 1.05);
  damage *= variance;

  return damage;
}

/**
 * Calculate spell damage.
 *
 * Formula:
 * (baseDmg + SP * coefficient) * modifiers * critMultiplier * (1 - resistance) * variance
 */
export function calculateSpellDamage(
  input: SpellDamageInput,
  rng: ISeededRng
): number {
  // Calculate base damage
  const baseDamage = rng.nextFloat(input.baseDamageMin, input.baseDamageMax);

  // Add spell power contribution
  const spellPowerContribution = input.spellPower * input.coefficient;
  let damage = baseDamage + spellPowerContribution;

  // Apply modifiers
  damage *= input.modifiers;

  // Apply crit multiplier
  if (input.isCrit) {
    damage *= input.critMultiplier;
  }

  // Apply resistance
  damage *= 1 - input.resistance;

  // Apply variance
  const variance = rng.nextFloat(0.95, 1.05);
  damage *= variance;

  return damage;
}

/**
 * Calculate damage per tick for DoT effects.
 *
 * DoTs distribute damage evenly across ticks without variance.
 *
 * Formula:
 * (baseTotalDamage + SP * coefficient) / numTicks
 */
export function calculateDotTick(
  baseTotalDamage: number,
  spellPower: number,
  coefficient: number,
  numTicks: number
): number {
  const totalDamage = baseTotalDamage + spellPower * coefficient;
  return totalDamage / numTicks;
}

/**
 * Calculate auto-attack damage.
 *
 * Auto-attacks use weapon damage and attack power but no coefficient or modifiers.
 * Only armor mitigation applies.
 *
 * Formula:
 * (weaponDmg + (AP / 14) * speed) * (1 - armorMitigation) * variance
 */
export function calculateAutoAttack(
  weaponDmgMin: number,
  weaponDmgMax: number,
  weaponSpeed: number,
  attackPower: number,
  armorMitigation: number,
  rng: ISeededRng
): number {
  // Calculate weapon damage
  const weaponDamage = rng.nextFloat(weaponDmgMin, weaponDmgMax);

  // Add attack power contribution
  const apContribution = (attackPower / 14) * weaponSpeed;
  let damage = weaponDamage + apContribution;

  // Apply armor mitigation
  damage *= 1 - armorMitigation;

  // Apply variance
  const variance = rng.nextFloat(0.95, 1.05);
  damage *= variance;

  return damage;
}
