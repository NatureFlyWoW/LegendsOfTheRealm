// src/game/combat/AbilitySystem.ts
import type {
  CombatEntity,
  AbilityInstance,
  CombatEvent,
  ISeededRng,
} from "@shared/combat-interfaces";
import { DamageType } from "@shared/enums";
import {
  buildAttackTable,
  resolveAttack,
  type AttackTableInput,
} from "./attackTable";
import {
  calculatePhysicalDamage,
  calculateSpellDamage,
  type PhysicalDamageInput,
  type SpellDamageInput,
} from "./damage";
import { BASE_PHYSICAL_CRIT_MULTIPLIER } from "@shared/constants";

/**
 * Result of executing an ability.
 */
export interface AbilityResult {
  success: boolean;
  failReason?: "on_cooldown" | "insufficient_resource" | "invalid_target";
  events: CombatEvent[];
  resourceSpent: number;
  cooldownStarted: number;
}

/**
 * Execute an ability from one CombatEntity against a target.
 *
 * Key logic:
 * 1. Check if ability is on cooldown
 * 2. Check if caster has enough resource
 * 3. Build attack table and resolve attack
 * 4. Calculate damage based on attack outcome
 * 5. Deduct resource, set cooldown, generate events
 *
 * @param caster - The entity casting the ability
 * @param ability - The ability being executed
 * @param target - The target entity
 * @param casterHp - Current HP of caster
 * @param targetHp - Current HP of target
 * @param rng - Seeded RNG for deterministic results
 * @param tick - Current tick number
 * @param cooldowns - Map of ability ID to tick when cooldown expires
 * @param casterResource - Current resource state of caster
 * @returns AbilityResult with success status and generated events
 */
export function executeAbility(
  caster: CombatEntity,
  ability: AbilityInstance,
  target: CombatEntity,
  casterHp: number,
  targetHp: number,
  rng: ISeededRng,
  tick: number,
  cooldowns: Map<string, number>,
  casterResource: { current: number; max: number },
): AbilityResult {
  // Check if ability is on cooldown
  const cooldownExpiresTick = cooldowns.get(ability.id) ?? 0;
  if (cooldownExpiresTick > tick) {
    return {
      success: false,
      failReason: "on_cooldown",
      events: [],
      resourceSpent: 0,
      cooldownStarted: 0,
    };
  }

  // Check if caster has enough resource
  if (casterResource.current < ability.resourceCost) {
    return {
      success: false,
      failReason: "insufficient_resource",
      events: [],
      resourceSpent: 0,
      cooldownStarted: 0,
    };
  }

  // Determine if this is a physical or spell ability
  const isPhysical = ability.damageType === DamageType.Physical;
  const isSpell = !isPhysical;

  // Build attack table input
  const attackTableInput: AttackTableInput = {
    hitRating: caster.effectiveStats.hitChance * 12.5, // Convert % to rating
    critChance: caster.effectiveStats.critChance,
    targetDodgeChance: target.effectiveStats.dodgeChance,
    targetParryChance: target.effectiveStats.parryChance,
    targetBlockChance: target.effectiveStats.blockChance,
    isDualWield: false, // Abilities don't use dual-wield mechanics
    isSpell,
    isBoss: target.entityType === "enemy", // Simplification: treat all enemies as bosses
  };

  // Build attack table and resolve attack
  const attackTable = buildAttackTable(attackTableInput);
  const attackOutcome = resolveAttack(attackTable, rng);

  const events: CombatEvent[] = [];

  // Handle miss outcomes (miss, dodge, parry)
  if (attackOutcome === "miss" || attackOutcome === "dodge" || attackOutcome === "parry") {
    events.push({
      tick,
      sourceId: caster.id,
      sourceName: caster.name,
      targetId: target.id,
      targetName: target.name,
      type: "miss",
      abilityName: ability.name,
      missType: attackOutcome,
    });

    // Deduct resource and set cooldown even on miss
    const resourceSpent = ability.resourceCost;
    const cooldownTicks = Math.ceil(ability.cooldownMs / 1000);
    const cooldownStarted = cooldownTicks > 0 ? tick + cooldownTicks : 0;

    return {
      success: true,
      events,
      resourceSpent,
      cooldownStarted,
    };
  }

  // Calculate damage for hit/crit/block outcomes
  const isCrit = attackOutcome === "crit";
  let damage = 0;

  if (isPhysical) {
    // Physical damage calculation
    const physicalInput: PhysicalDamageInput = {
      weaponDamageMin: caster.effectiveStats.weaponDamageMin,
      weaponDamageMax: caster.effectiveStats.weaponDamageMax,
      weaponSpeed: caster.effectiveStats.weaponSpeed,
      attackPower: caster.effectiveStats.attackPower,
      coefficient: ability.coefficient,
      armorMitigation: calculateArmorMitigation(target.effectiveStats.armor, caster.level),
      critMultiplier: BASE_PHYSICAL_CRIT_MULTIPLIER,
      isCrit,
      modifiers: 1.0, // No modifiers for now
    };
    damage = calculatePhysicalDamage(physicalInput, rng);
  } else {
    // Spell damage calculation
    const baseDamage = ability.baseDamage ?? 0;
    const spellInput: SpellDamageInput = {
      baseDamageMin: baseDamage,
      baseDamageMax: baseDamage,
      spellPower: caster.effectiveStats.spellPower,
      coefficient: ability.coefficient,
      isCrit,
      critMultiplier: 1.5, // Default spell crit multiplier
      resistance: 0, // No resistance for now
      modifiers: 1.0,
    };
    damage = calculateSpellDamage(spellInput, rng);
  }

  // Handle block - reduce damage by block value
  let isBlocked = false;
  let blockAmount = 0;
  if (attackOutcome === "block") {
    isBlocked = true;
    blockAmount = target.effectiveStats.blockValue;
    damage = Math.max(0, damage - blockAmount);
  }

  // Calculate overkill
  const overkill = Math.max(0, damage - targetHp);
  const effectiveDamage = Math.min(damage, targetHp);

  // Generate damage event
  events.push({
    tick,
    sourceId: caster.id,
    sourceName: caster.name,
    targetId: target.id,
    targetName: target.name,
    type: "damage",
    abilityName: ability.name,
    amount: effectiveDamage,
    damageType: ability.damageType ?? DamageType.Physical,
    isCrit,
    isBlocked,
    blockAmount,
    overkill,
  });

  // Deduct resource and set cooldown
  const resourceSpent = ability.resourceCost;
  const cooldownTicks = Math.ceil(ability.cooldownMs / 1000);
  const cooldownStarted = cooldownTicks > 0 ? tick + cooldownTicks : 0;

  return {
    success: true,
    events,
    resourceSpent,
    cooldownStarted,
  };
}

/**
 * Calculate armor mitigation percentage.
 *
 * Formula: armor / (armor + 400 + 85 * attackerLevel)
 *
 * @param armor - Target's armor value
 * @param attackerLevel - Attacker's level
 * @returns Mitigation as a decimal (0-1)
 */
function calculateArmorMitigation(armor: number, attackerLevel: number): number {
  const armorConstant = 400 + 85 * attackerLevel;
  return armor / (armor + armorConstant);
}
