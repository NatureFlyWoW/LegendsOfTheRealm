// src/game/combat/resources.ts
import { ResourceType } from "@shared/enums";
import { BASE_GCD_SECONDS, MIN_GCD_SECONDS } from "@shared/constants";

/**
 * Resource state for a character.
 */
export interface ResourceState {
  type: ResourceType;
  current: number;
  max: number;
}

/**
 * Create initial resource state for a given resource type.
 *
 * Starting values:
 * - Mana: Full (1000 base, varies by class)
 * - Rage: 0 / 100
 * - Energy: 100 / 100
 * - Focus: 100 / 100
 * - ComboPoints: 0 / 5
 * - SoulShards: 0 / 3
 * - DivineFavor: 0 / 100
 * - Maelstrom: 0 / 100
 * - ArcaneCharges: 0 / 4
 */
export function createResourceState(type: ResourceType): ResourceState {
  switch (type) {
    case ResourceType.Mana:
      return { type, current: 1000, max: 1000 };

    case ResourceType.Rage:
      return { type, current: 0, max: 100 };

    case ResourceType.Energy:
      return { type, current: 100, max: 100 };

    case ResourceType.Focus:
      return { type, current: 100, max: 100 };

    case ResourceType.ComboPoints:
      return { type, current: 0, max: 5 };

    case ResourceType.SoulShards:
      return { type, current: 0, max: 3 };

    case ResourceType.DivineFavor:
      return { type, current: 0, max: 100 };

    case ResourceType.Maelstrom:
      return { type, current: 0, max: 100 };

    case ResourceType.ArcaneCharges:
      return { type, current: 0, max: 4 };

    default:
      // Fallback
      return { type, current: 0, max: 100 };
  }
}

/**
 * Attempt to spend resource.
 *
 * Returns success flag and new state.
 * If insufficient resource, returns failure and unchanged state.
 */
export function spendResource(
  state: ResourceState,
  amount: number
): { success: boolean; newState: ResourceState } {
  if (state.current < amount) {
    return {
      success: false,
      newState: { ...state },
    };
  }

  return {
    success: true,
    newState: {
      ...state,
      current: state.current - amount,
    },
  };
}

/**
 * Add resource, clamping at maximum.
 *
 * Negative amounts drain resource (clamping at 0).
 */
export function addResource(state: ResourceState, amount: number): ResourceState {
  const newCurrent = state.current + amount;
  return {
    ...state,
    current: Math.max(0, Math.min(newCurrent, state.max)),
  };
}

/**
 * Regenerate resource per tick.
 *
 * Regeneration rules:
 * - Mana: Out of combat = spirit/tick, In combat = spirit/5/tick
 * - Energy: 20/tick (modified by haste)
 * - Focus: 10/tick
 * - Rage: Decays 1/tick out of combat, no change in combat
 * - Other resources: No passive regen
 */
export function tickRegeneration(
  state: ResourceState,
  spirit: number,
  hastePercent: number,
  inCombat: boolean
): ResourceState {
  let regen = 0;

  switch (state.type) {
    case ResourceType.Mana:
      if (inCombat) {
        regen = spirit / 5;
      } else {
        regen = spirit;
      }
      break;

    case ResourceType.Energy:
      // Base 20/tick, modified by haste
      regen = 20 * (1 + hastePercent / 100);
      break;

    case ResourceType.Focus:
      regen = 10;
      break;

    case ResourceType.Rage:
      if (!inCombat) {
        // Decay 1/tick out of combat
        regen = -1;
      }
      break;

    default:
      // No passive regeneration
      regen = 0;
  }

  return addResource(state, regen);
}

/**
 * Generate rage from damage dealt or taken.
 *
 * Formula: damage / 230 * 7.5
 */
export function generateRage(damageDone: number): number {
  return (damageDone / 230) * 7.5;
}

/**
 * Calculate Global Cooldown based on haste.
 *
 * Formula: max(1.0, 1.5 / (1 + haste/100))
 *
 * Base GCD: 1.5s
 * Minimum GCD: 1.0s (50% haste cap)
 */
export function calculateGCD(hastePercent: number): number {
  const gcd = BASE_GCD_SECONDS / (1 + hastePercent / 100);
  return Math.max(MIN_GCD_SECONDS, gcd);
}
