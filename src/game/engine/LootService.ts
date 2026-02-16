// src/game/engine/LootService.ts
import { getLootTable } from "@game/data";
import type { ISeededRng } from "@shared/combat-interfaces";
import type { ItemInstance, LootTableId } from "@shared/types";

/**
 * Result of rolling loot from a loot table
 */
export interface LootResult {
  items: ItemInstance[];
  gold: number;
}

/**
 * LootService handles loot table rolling and ItemInstance creation.
 * Uses seeded RNG for deterministic, reproducible loot results.
 */
export class LootService {
  private nextInstanceId = 1;

  /**
   * Roll loot from a loot table
   * @param lootTableId - ID of the loot table to roll
   * @param characterId - Character receiving the loot
   * @param rng - Seeded RNG for deterministic rolls
   * @returns Loot result with items and gold
   */
  rollLoot(lootTableId: LootTableId, characterId: number, rng: ISeededRng): LootResult {
    const lootTable = getLootTable(lootTableId);
    if (!lootTable) {
      throw new Error(`Loot table not found: ${lootTableId}`);
    }

    const items: ItemInstance[] = [];

    // Process guaranteed drops (always included)
    for (const drop of lootTable.guaranteedDrops) {
      const quantity = drop.minQuantity === drop.maxQuantity
        ? drop.minQuantity
        : rng.nextInt(drop.minQuantity, drop.maxQuantity);

      for (let i = 0; i < quantity; i++) {
        items.push(this.createItemInstance(drop.itemId, characterId));
      }
    }

    // Process rolled drops (weighted random selection)
    for (let roll = 0; roll < lootTable.rolledDropCount; roll++) {
      if (lootTable.rolledDrops.length === 0) continue;

      const selectedDrop = this.weightedRandomSelect(lootTable.rolledDrops, rng);
      if (selectedDrop) {
        const quantity = selectedDrop.minQuantity === selectedDrop.maxQuantity
          ? selectedDrop.minQuantity
          : rng.nextInt(selectedDrop.minQuantity, selectedDrop.maxQuantity);

        for (let i = 0; i < quantity; i++) {
          items.push(this.createItemInstance(selectedDrop.itemId, characterId));
        }
      }
    }

    // Roll gold amount
    const gold = rng.nextInt(lootTable.goldRange.min, lootTable.goldRange.max);

    return { items, gold };
  }

  /**
   * Select a random entry from a weighted list
   * @param entries - List of entries with weights
   * @param rng - Seeded RNG
   * @returns Selected entry or null if list is empty
   */
  private weightedRandomSelect<T extends { weight: number }>(
    entries: readonly T[],
    rng: ISeededRng
  ): T | null {
    if (entries.length === 0) return null;

    // Calculate total weight
    const totalWeight = entries.reduce((sum, entry) => sum + entry.weight, 0);
    if (totalWeight <= 0) return null;

    // Roll and find matching entry
    const roll = rng.nextFloat(0, totalWeight);
    let accumulated = 0;

    for (const entry of entries) {
      accumulated += entry.weight;
      if (roll < accumulated) {
        return entry;
      }
    }

    // Fallback to last entry (handles floating point edge cases)
    return entries[entries.length - 1];
  }

  /**
   * Create a new ItemInstance with a unique ID
   * @param templateId - Item template ID
   * @param characterId - Owner character ID
   * @returns New item instance
   */
  private createItemInstance(templateId: string, characterId: number): ItemInstance {
    return {
      id: this.nextInstanceId++,
      templateId: templateId as any, // Cast to ItemId brand type
      characterId,
      bagSlot: null,
      equippedSlot: null,
      durability: 100,
    };
  }

  /**
   * Reset the instance ID counter (useful for testing)
   */
  resetInstanceIdCounter(): void {
    this.nextInstanceId = 1;
  }

  /**
   * Set the next instance ID (useful for loading from save)
   */
  setNextInstanceId(id: number): void {
    this.nextInstanceId = id;
  }
}
