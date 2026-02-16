// src/game/engine/OfflineCalculator.ts
// Fast-sim offline gains calculator — statistical estimation, not tick-by-tick replay

import type { CharacterState, ItemInstance, MobId, QuestId } from "@shared/types";
import type { ISeededRng } from "@shared/combat-interfaces";
import { getXpForLevel, getZone, getMobsByZone, getLootTable } from "@game/data";

const MAX_LEVELS_OFFLINE = 10;
const MAX_LEVEL = 60;

/**
 * Result of offline gains calculation for a single character
 */
export interface CharacterOfflineResult {
  xpGained: number;
  levelsGained: number;
  goldGained: number;
  itemsGained: ItemInstance[];
  fightsCompleted: number;
  questProgress: Record<string, number>; // questId → kills added
  finalCharacter: CharacterState; // updated character state
}

/**
 * Calculate offline gains using statistical estimation (not tick-by-tick replay).
 *
 * Estimates:
 * - Average fight duration based on character level vs zone mob levels
 * - Fights completed = elapsedSeconds / avgFightDuration
 * - Total XP from fights × avg mob XP reward
 * - Level-ups applied iteratively with XP curve
 * - Loot rolled statistically: fights × weighted drop rates
 * - Quest progress: fights × (kills split across mob types)
 * - Gold earned: fights × avg gold per kill
 *
 * Caps:
 * - Maximum 10 levels gained offline
 * - Level cap at 60
 *
 * @param character - Current character state
 * @param elapsedSeconds - Time offline in seconds
 * @param rng - Seeded RNG for deterministic randomness
 * @returns CharacterOfflineResult with gains and updated character
 */
export function calculateOfflineGains(
  character: CharacterState,
  elapsedSeconds: number,
  rng: ISeededRng,
): CharacterOfflineResult {
  // Early exit for no offline time
  if (elapsedSeconds <= 0) {
    return {
      xpGained: 0,
      levelsGained: 0,
      goldGained: 0,
      itemsGained: [],
      fightsCompleted: 0,
      questProgress: {},
      finalCharacter: character,
    };
  }

  // Clone character to avoid mutation
  const finalCharacter: CharacterState = JSON.parse(JSON.stringify(character));

  // Get zone and mob data
  const zone = getZone(character.currentZone);
  if (!zone) {
    // Invalid zone — no gains
    return {
      xpGained: 0,
      levelsGained: 0,
      goldGained: 0,
      itemsGained: [],
      fightsCompleted: 0,
      questProgress: {},
      finalCharacter,
    };
  }

  const mobs = getMobsByZone(character.currentZone);
  if (mobs.length === 0) {
    // No mobs in zone — no gains
    return {
      xpGained: 0,
      levelsGained: 0,
      goldGained: 0,
      itemsGained: [],
      fightsCompleted: 0,
      questProgress: {},
      finalCharacter,
    };
  }

  // Estimate average fight duration based on level difference
  const avgMobLevel = mobs.reduce((sum, mob) => sum + mob.level, 0) / mobs.length;
  const levelDiff = character.level - avgMobLevel;
  const baseFightDuration = 30; // 30 seconds baseline
  const durationModifier = Math.max(0.3, 1 - (levelDiff * 0.1)); // Higher level = faster kills
  const avgFightDuration = baseFightDuration * durationModifier;

  // Calculate total fights completed
  const fightsCompleted = Math.floor(elapsedSeconds / avgFightDuration);

  if (fightsCompleted === 0) {
    return {
      xpGained: 0,
      levelsGained: 0,
      goldGained: 0,
      itemsGained: [],
      fightsCompleted: 0,
      questProgress: {},
      finalCharacter,
    };
  }

  // Calculate average XP and gold per mob
  const avgXpPerMob = mobs.reduce((sum, mob) => sum + mob.xpReward, 0) / mobs.length;
  const avgGoldPerMob = mobs.reduce((sum, mob) => {
    const lootTable = getLootTable(mob.lootTableId);
    if (!lootTable) return sum;
    const avgGold = (lootTable.goldRange.min + lootTable.goldRange.max) / 2;
    return sum + avgGold;
  }, 0) / mobs.length;

  // Calculate total XP and gold gained
  const totalXpGained = Math.floor(fightsCompleted * avgXpPerMob);
  const goldGained = Math.floor(fightsCompleted * avgGoldPerMob);

  // Apply level-ups iteratively with max cap
  let currentXp = finalCharacter.xp + totalXpGained;
  let currentLevel = finalCharacter.level;
  let levelsGained = 0;

  while (currentLevel < MAX_LEVEL && levelsGained < MAX_LEVELS_OFFLINE) {
    const xpNeeded = getXpForLevel(currentLevel);
    if (currentXp >= xpNeeded) {
      currentXp -= xpNeeded;
      currentLevel++;
      levelsGained++;
    } else {
      break;
    }
  }

  finalCharacter.level = currentLevel;
  finalCharacter.xp = currentXp;
  finalCharacter.gold += goldGained;

  // Roll loot statistically
  const itemsGained: ItemInstance[] = [];
  let nextItemInstanceId = 1; // In real implementation, this would come from database

  // Distribute fights across mobs based on their count in zone
  const mobWeights = mobs.map(() => 1); // Equal weight for simplicity
  const totalWeight = mobWeights.reduce((sum, w) => sum + w, 0);
  let remainingFightsForLoot = fightsCompleted;

  for (let i = 0; i < mobs.length; i++) {
    const mob = mobs[i];
    let mobFights: number;

    // For the last mob, assign all remaining fights to avoid rounding errors
    if (i === mobs.length - 1) {
      mobFights = remainingFightsForLoot;
    } else {
      mobFights = Math.floor(fightsCompleted * (mobWeights[i] / totalWeight));
      remainingFightsForLoot -= mobFights;
    }

    const lootTable = getLootTable(mob.lootTableId);
    if (!lootTable || mobFights === 0) continue;

    // Roll for each fight's loot drops
    for (let fight = 0; fight < mobFights; fight++) {
      // Guaranteed drops
      for (const drop of lootTable.guaranteedDrops) {
        const quantity = rng.nextInt(drop.minQuantity, drop.maxQuantity);
        for (let q = 0; q < quantity; q++) {
          itemsGained.push({
            id: nextItemInstanceId++,
            templateId: drop.itemId,
            characterId: character.id,
            bagSlot: null,
            equippedSlot: null,
            durability: 100,
          });
        }
      }

      // Rolled drops (weighted random)
      if (lootTable.rolledDrops.length > 0) {
        const totalDropWeight = lootTable.rolledDrops.reduce((sum, d) => sum + d.weight, 0);

        for (let roll = 0; roll < lootTable.rolledDropCount; roll++) {
          const rollValue = rng.nextFloat(0, totalDropWeight);
          let cumulative = 0;

          for (const drop of lootTable.rolledDrops) {
            cumulative += drop.weight;
            if (rollValue <= cumulative) {
              const quantity = rng.nextInt(drop.minQuantity, drop.maxQuantity);
              for (let q = 0; q < quantity; q++) {
                itemsGained.push({
                  id: nextItemInstanceId++,
                  templateId: drop.itemId,
                  characterId: character.id,
                  bagSlot: null,
                  equippedSlot: null,
                  durability: 100,
                });
              }
              break;
            }
          }
        }
      }
    }
  }

  // Calculate quest progress (kills split across mob types)
  const questProgress: Record<string, number> = {};
  let remainingFights = fightsCompleted;

  for (let i = 0; i < mobs.length; i++) {
    const mob = mobs[i];
    let mobFights: number;

    // For the last mob, assign all remaining fights to avoid rounding errors
    if (i === mobs.length - 1) {
      mobFights = remainingFights;
    } else {
      mobFights = Math.floor(fightsCompleted * (mobWeights[i] / totalWeight));
      remainingFights -= mobFights;
    }

    if (mobFights > 0) {
      questProgress[mob.id as string] = mobFights;
    }
  }

  return {
    xpGained: totalXpGained,
    levelsGained,
    goldGained,
    itemsGained,
    fightsCompleted,
    questProgress,
    finalCharacter,
  };
}
