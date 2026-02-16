// tests/game/data/schemas/loot-table.schema.test.ts

import { describe, it, expect } from "vitest";
import { lootTableSchema } from "@game/data/schemas/loot-table.schema";
import type { LootTableSchema } from "@game/data/schemas/loot-table.schema";

describe("loot-table.schema", () => {
  const validLootTable: LootTableSchema = {
    id: "loot_cellar_rat",
    guaranteedDrops: [],
    rolledDrops: [{ itemId: "item_rat_tooth_dagger", weight: 10, minQuantity: 1, maxQuantity: 1 }],
    rolledDropCount: 1,
    goldRange: { min: 5, max: 12 },
  };

  it("should validate a complete valid loot table", () => {
    expect(() => lootTableSchema.parse(validLootTable)).not.toThrow();
  });

  it("should reject a loot table missing goldRange", () => {
    const { goldRange, ...noGoldRange } = validLootTable;
    expect(() => lootTableSchema.parse(noGoldRange)).toThrow();
  });

  it("should validate a loot table with empty guaranteedDrops", () => {
    const table = { ...validLootTable, guaranteedDrops: [] };
    expect(() => lootTableSchema.parse(table)).not.toThrow();
  });

  it("should validate optional bonusRolls", () => {
    const tableWithBonus = {
      ...validLootTable,
      bonusRolls: [{ itemId: "item_bonus", weight: 5, minQuantity: 1, maxQuantity: 1 }],
    };
    expect(() => lootTableSchema.parse(tableWithBonus)).not.toThrow();
  });

  it("should validate optional smartLoot", () => {
    const tableWithSmartLoot = {
      ...validLootTable,
      smartLoot: { classWeightBonus: 1.5, specWeightBonus: 2.0, upgradeWeightBonus: 1.2 },
    };
    expect(() => lootTableSchema.parse(tableWithSmartLoot)).not.toThrow();
  });

  it("should validate lootEntry sub-schema fields", () => {
    const tableWithGuaranteed = {
      ...validLootTable,
      guaranteedDrops: [{ itemId: "item_test", weight: 100, minQuantity: 1, maxQuantity: 3 }],
    };
    const result = lootTableSchema.parse(tableWithGuaranteed);
    expect(result.guaranteedDrops[0].itemId).toBe("item_test");
    expect(result.guaranteedDrops[0].weight).toBe(100);
    expect(result.guaranteedDrops[0].minQuantity).toBe(1);
    expect(result.guaranteedDrops[0].maxQuantity).toBe(3);
  });
});
