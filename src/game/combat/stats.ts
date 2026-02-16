// src/game/combat/stats.ts
import {
  HP_PER_STAMINA,
  MANA_PER_INTELLECT,
  ARMOR_CONSTANT_BASE,
  ARMOR_CONSTANT_PER_LEVEL,
  RATING_CONVERSIONS,
} from "@shared/constants";

/**
 * Calculate maximum HP from stamina and class base HP.
 * Formula: HP = stamina * 10 + classBaseHp
 */
export function calculateMaxHp(stamina: number, classBaseHp: number): number {
  return stamina * HP_PER_STAMINA + classBaseHp;
}

/**
 * Calculate maximum mana from intellect and class base mana.
 * Formula: Mana = intellect * 15 + classBaseMana
 */
export function calculateMaxMana(intellect: number, classBaseMana: number): number {
  return intellect * MANA_PER_INTELLECT + classBaseMana;
}

/**
 * Calculate armor mitigation percentage against a given attacker level.
 * Formula: armor / (armor + 400 + 85 * attackerLevel)
 *
 * Examples at level 60:
 * - 2750 armor = 33.3% mitigation
 * - 5500 armor = 50% mitigation
 * - 11000 armor = 66.7% mitigation
 */
export function calculateArmorMitigation(armor: number, attackerLevel: number): number {
  if (armor <= 0) return 0;
  const denominator = armor + ARMOR_CONSTANT_BASE + ARMOR_CONSTANT_PER_LEVEL * attackerLevel;
  return armor / denominator;
}

/**
 * Convert a rating stat into a percentage value.
 *
 * Rating types and conversions at level 60:
 * - critRating: 22 rating = 1%
 * - hitRating: 12.5 rating = 1%
 * - hasteRating: 15 rating = 1%
 * - defenseRating: 2.5 rating = 1%
 * - dodgeRating: 18 rating = 1%
 * - parryRating: 20 rating = 1%
 * - blockRating: 5 rating = 1%
 * - resilience: 25 rating = 1%
 * - spellHitRating: 12.5 rating = 1%
 */
export function ratingToPercentage(rating: number, statType: string): number {
  const conversion = RATING_CONVERSIONS[statType as keyof typeof RATING_CONVERSIONS];
  if (!conversion || rating === 0) return 0;
  return rating / conversion;
}

/**
 * Class sets for determining attack power calculation.
 */
const STRENGTH_CLASSES = new Set(["warrior", "cleric"]);
const AGILITY_CLASSES = new Set(["rogue", "ranger", "druid"]);

/**
 * Calculate attack power from strength, agility, and class.
 *
 * - Strength-based classes (Warrior, Cleric): AP = strength * 2
 * - Agility-based classes (Rogue, Ranger, Druid): AP = agility * 2
 * - Other classes: AP = strength + agility
 */
export function calculateAttackPower(
  strength: number,
  agility: number,
  classId: string
): number {
  if (STRENGTH_CLASSES.has(classId)) return strength * 2;
  if (AGILITY_CLASSES.has(classId)) return agility * 2;
  return strength + agility;
}

/**
 * Calculate spell power from intellect and gear spell power.
 *
 * Currently, spell power comes only from gear.
 * Future: May add intellect scaling for certain specs.
 */
export function calculateSpellPower(intellect: number, gearSpellPower: number): number {
  return gearSpellPower;
}
