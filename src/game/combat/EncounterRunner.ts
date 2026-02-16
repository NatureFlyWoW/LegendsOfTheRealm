// src/game/combat/EncounterRunner.ts
import type {
  CombatEntity,
  CombatEvent,
  ISeededRng,
  AbilityInstance,
  RotationEntry,
} from "@shared/combat-interfaces";
import { executeAbility } from "./AbilitySystem";
import { tickRegeneration } from "./resources";
import { DamageType } from "@shared/enums";

/**
 * Parameters for a simple 1v1 encounter.
 */
export interface SimpleEncounterParams {
  player: CombatEntity;
  enemy: CombatEntity;
  tickLimit: number;
}

/**
 * Result of a simple 1v1 encounter.
 */
export interface SimpleEncounterResult {
  outcome: "victory" | "defeat" | "timeout";
  durationTicks: number;
  events: CombatEvent[];
  playerHpRemaining: number;
  xpAwarded: number;
}

/**
 * Run a tick-by-tick 1v1 combat encounter.
 *
 * Core loop:
 * 1. Player selects and executes ability
 * 2. Enemy selects and executes ability
 * 3. Apply resource regeneration
 * 4. Tick down cooldowns
 * 5. Check for death/timeout
 *
 * Pure function - deterministic given same inputs and RNG state.
 *
 * @param params - Encounter parameters
 * @param rng - Seeded RNG for deterministic results
 * @returns Encounter result with outcome and accumulated events
 */
export function runSimpleEncounter(
  params: SimpleEncounterParams,
  rng: ISeededRng,
): SimpleEncounterResult {
  const { player, enemy, tickLimit } = params;

  // Initialize combat state
  let playerHp = player.effectiveStats.maxHp;
  let enemyHp = enemy.effectiveStats.maxHp;

  const playerResource = {
    current: player.resources.current,
    max: player.resources.max,
  };

  const enemyResource = {
    current: enemy.resources.current,
    max: enemy.resources.max,
  };

  const playerCooldowns = new Map<string, number>();
  const enemyCooldowns = new Map<string, number>();

  const allEvents: CombatEvent[] = [];
  let tick = 0;

  // Combat loop
  while (tick < tickLimit) {
    tick++;

    // 1. Player turn - select and execute ability
    const playerAbility = selectAbility(
      player,
      enemy,
      playerHp,
      enemyHp,
      playerResource,
      playerCooldowns,
      tick,
    );

    if (playerAbility) {
      const result = executeAbility(
        player,
        playerAbility,
        enemy,
        playerHp,
        enemyHp,
        rng,
        tick,
        playerCooldowns,
        playerResource,
      );

      if (result.success) {
        // Apply resource cost
        playerResource.current -= result.resourceSpent;

        // Set cooldown
        if (result.cooldownStarted > 0) {
          playerCooldowns.set(playerAbility.id, result.cooldownStarted);
        }

        // Apply damage to enemy
        for (const event of result.events) {
          if (event.type === "damage") {
            enemyHp = Math.max(0, enemyHp - event.amount);
          }
        }

        // Accumulate events
        allEvents.push(...result.events);
      }
    } else {
      // No ability available - use auto-attack (basic melee)
      const autoAttackDamage = executeAutoAttack(
        player,
        enemy,
        tick,
        rng,
      );

      if (autoAttackDamage > 0) {
        enemyHp = Math.max(0, enemyHp - autoAttackDamage);

        allEvents.push({
          tick,
          sourceId: player.id,
          sourceName: player.name,
          targetId: enemy.id,
          targetName: enemy.name,
          type: "damage",
          abilityName: "Auto Attack",
          amount: autoAttackDamage,
          damageType: DamageType.Physical,
          isCrit: false,
          isBlocked: false,
          blockAmount: 0,
          overkill: 0,
        });
      }
    }

    // Check for enemy death
    if (enemyHp <= 0) {
      // Generate death event
      allEvents.push({
        tick,
        sourceId: player.id,
        sourceName: player.name,
        targetId: enemy.id,
        targetName: enemy.name,
        type: "death",
        killingAbility: playerAbility?.name ?? "Unknown",
      });

      return {
        outcome: "victory",
        durationTicks: tick,
        events: allEvents,
        playerHpRemaining: playerHp,
        xpAwarded: getEnemyXpReward(enemy),
      };
    }

    // 2. Enemy turn - select and execute ability
    const enemyAbility = selectAbility(
      enemy,
      player,
      enemyHp,
      playerHp,
      enemyResource,
      enemyCooldowns,
      tick,
    );

    if (enemyAbility) {
      const result = executeAbility(
        enemy,
        enemyAbility,
        player,
        enemyHp,
        playerHp,
        rng,
        tick,
        enemyCooldowns,
        enemyResource,
      );

      if (result.success) {
        // Apply resource cost
        enemyResource.current -= result.resourceSpent;

        // Set cooldown
        if (result.cooldownStarted > 0) {
          enemyCooldowns.set(enemyAbility.id, result.cooldownStarted);
        }

        // Apply damage to player
        for (const event of result.events) {
          if (event.type === "damage") {
            playerHp = Math.max(0, playerHp - event.amount);
          }
        }

        // Accumulate events
        allEvents.push(...result.events);
      }
    } else {
      // No ability available - use auto-attack (basic melee)
      const autoAttackDamage = executeAutoAttack(
        enemy,
        player,
        tick,
        rng,
      );

      if (autoAttackDamage > 0) {
        playerHp = Math.max(0, playerHp - autoAttackDamage);

        allEvents.push({
          tick,
          sourceId: enemy.id,
          sourceName: enemy.name,
          targetId: player.id,
          targetName: player.name,
          type: "damage",
          abilityName: "Auto Attack",
          amount: autoAttackDamage,
          damageType: DamageType.Physical,
          isCrit: false,
          isBlocked: false,
          blockAmount: 0,
          overkill: 0,
        });
      }
    }

    // Check for player death
    if (playerHp <= 0) {
      // Generate death event
      allEvents.push({
        tick,
        sourceId: enemy.id,
        sourceName: enemy.name,
        targetId: player.id,
        targetName: player.name,
        type: "death",
        killingAbility: enemyAbility?.name ?? "Unknown",
      });

      return {
        outcome: "defeat",
        durationTicks: tick,
        events: allEvents,
        playerHpRemaining: 0,
        xpAwarded: 0,
      };
    }

    // 3. Apply resource regeneration (always in combat for 1v1)
    const playerRegen = tickRegeneration(
      player.resources,
      player.effectiveStats.spirit,
      player.effectiveStats.hastePercent,
      true, // Always in combat during encounter
    );
    playerResource.current = playerRegen.current;

    const enemyRegen = tickRegeneration(
      enemy.resources,
      enemy.effectiveStats.spirit,
      enemy.effectiveStats.hastePercent,
      true,
    );
    enemyResource.current = enemyRegen.current;

    // 4. Cooldowns tick down automatically (checked against current tick)
    // No explicit decrement needed - we check if cooldown expiry tick <= current tick
  }

  // Timeout - no winner
  return {
    outcome: "timeout",
    durationTicks: tick,
    events: allEvents,
    playerHpRemaining: playerHp,
    xpAwarded: 0,
  };
}

/**
 * Select the next ability to use from the entity's rotation.
 *
 * Logic:
 * 1. Iterate rotation by priority (lower number = higher priority)
 * 2. Pick first ability that is:
 *    - Off cooldown
 *    - Has sufficient resource
 *    - Meets condition (if any)
 * 3. If no ability available, use auto-attack (basic melee)
 *
 * @param caster - The entity selecting an ability
 * @param target - The target entity
 * @param casterHp - Current HP of caster
 * @param targetHp - Current HP of target
 * @param resource - Current resource state
 * @param cooldowns - Map of ability ID to expiry tick
 * @param tick - Current tick
 * @returns The selected ability, or null if auto-attack should be used
 */
function selectAbility(
  caster: CombatEntity,
  target: CombatEntity,
  casterHp: number,
  targetHp: number,
  resource: { current: number; max: number },
  cooldowns: Map<string, number>,
  tick: number,
): AbilityInstance | null {
  // Iterate rotation by priority
  for (const entry of caster.rotation) {
    const ability = caster.abilities.find((a) => a.id === entry.abilityId);
    if (!ability) continue;

    // Check cooldown
    const cooldownExpiry = cooldowns.get(ability.id) ?? 0;
    if (cooldownExpiry > tick) continue;

    // Check resource
    if (resource.current < ability.resourceCost) continue;

    // Check condition (for now, only support "always" condition)
    if (entry.condition && entry.condition.type !== "always") {
      // Skip conditions we don't support yet
      continue;
    }

    // Ability is available
    return ability;
  }

  // No ability available - use auto-attack
  // Return null to indicate auto-attack should be used
  return null;
}

/**
 * Get the XP reward for defeating an enemy.
 *
 * In Phase 2, XP is stored directly on the mob definition.
 * We approximate it from the entity's spec ID (which maps to mob ID).
 *
 * @param enemy - The defeated enemy
 * @returns XP reward
 */
function getEnemyXpReward(enemy: CombatEntity): number {
  // For Phase 2, we use a simple level-based formula
  // XP = level * 45 (matches Cellar Rat at level 1 = 45 XP)
  // This will be replaced by looking up the mob definition in Phase 3
  return enemy.level * 45;
}

/**
 * Execute a basic auto-attack (melee swing with weapon damage).
 *
 * Auto-attacks use weapon damage without ability coefficients.
 * Simplified version for Phase 2 - no attack table, just direct damage.
 *
 * @param attacker - The entity performing auto-attack
 * @param defender - The target entity
 * @param tick - Current tick
 * @param rng - Seeded RNG for damage variance
 * @returns Damage dealt
 */
function executeAutoAttack(
  attacker: CombatEntity,
  defender: CombatEntity,
  tick: number,
  rng: ISeededRng,
): number {
  // Calculate weapon damage
  const weaponDamage = rng.nextFloat(
    attacker.effectiveStats.weaponDamageMin,
    attacker.effectiveStats.weaponDamageMax,
  );

  // Add attack power contribution (simplified: AP / 14 * weapon speed)
  const apContribution = (attacker.effectiveStats.attackPower / 14) * attacker.effectiveStats.weaponSpeed;

  let damage = weaponDamage + apContribution;

  // Apply armor mitigation (simplified)
  const armorMitigation = calculateArmorMitigation(defender.effectiveStats.armor, attacker.level);
  damage *= 1 - armorMitigation;

  // Apply variance
  const variance = rng.nextFloat(0.95, 1.05);
  damage *= variance;

  return Math.floor(Math.max(0, damage));
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
