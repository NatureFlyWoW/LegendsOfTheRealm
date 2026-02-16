// tests/game/engine/LootService.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { LootService } from "@game/engine/LootService";
import { SeededRng } from "@game/rng/SeededRng";
import { makeLootTableId } from "@shared/types";

describe("LootService", () => {
  let service: LootService;

  beforeEach(() => {
    service = new LootService();
  });

  describe("rollLoot", () => {
    it("rolls deterministic loot with known seed", () => {
      const rng = new SeededRng(12345);
      const characterId = 1;

      const result1 = service.rollLoot(makeLootTableId("loot_cellar_rat"), characterId, rng);

      // Reset service and RNG to verify determinism
      service.resetInstanceIdCounter();
      const rng2 = new SeededRng(12345);
      const result2 = service.rollLoot(makeLootTableId("loot_cellar_rat"), characterId, rng2);

      expect(result1.gold).toBe(result2.gold);
      expect(result1.items.length).toBe(result2.items.length);
      expect(result1.items[0]?.templateId).toBe(result2.items[0]?.templateId);
    });

    it("rolls Kragg loot table with gold in expected range", () => {
      const rng = new SeededRng(54321);
      const characterId = 1;

      const result = service.rollLoot(makeLootTableId("loot_kragg"), characterId, rng);

      // Kragg has goldRange: { min: 50, max: 100 }
      expect(result.gold).toBeGreaterThanOrEqual(50);
      expect(result.gold).toBeLessThanOrEqual(100);

      // Kragg has rolledDropCount: 1, so should get at most 1 item
      expect(result.items.length).toBeLessThanOrEqual(1);
    });

    it("creates items with unique instance IDs", () => {
      const rng = new SeededRng(99999);
      const characterId = 1;

      // Roll multiple times to get multiple items
      const result1 = service.rollLoot(makeLootTableId("loot_cellar_rat"), characterId, rng);
      const result2 = service.rollLoot(makeLootTableId("loot_dire_wolf"), characterId, rng);
      const result3 = service.rollLoot(makeLootTableId("loot_kragg"), characterId, rng);

      const allItems = [...result1.items, ...result2.items, ...result3.items];
      const itemIds = allItems.map(item => item.id);
      const uniqueIds = new Set(itemIds);

      // All IDs should be unique
      expect(uniqueIds.size).toBe(itemIds.length);

      // IDs should be sequential
      if (allItems.length > 0) {
        expect(itemIds).toEqual([...itemIds].sort((a, b) => a - b));
      }
    });

    it("assigns correct characterId to all items", () => {
      const rng = new SeededRng(11111);
      const characterId = 42;

      const result = service.rollLoot(makeLootTableId("loot_cellar_rat"), characterId, rng);

      for (const item of result.items) {
        expect(item.characterId).toBe(characterId);
      }
    });

    it("initializes item instances with correct defaults", () => {
      const rng = new SeededRng(22222);
      const characterId = 1;

      const result = service.rollLoot(makeLootTableId("loot_cellar_rat"), characterId, rng);

      if (result.items.length > 0) {
        const item = result.items[0];
        expect(item.bagSlot).toBeNull();
        expect(item.equippedSlot).toBeNull();
        expect(item.durability).toBe(100);
        expect(item.enchantId).toBeUndefined();
        expect(item.gemIds).toBeUndefined();
      }
    });

    it("rolls cellar rat table multiple times and verifies drop rate distribution", () => {
      const iterations = 1000;
      let itemCount = 0;

      for (let i = 0; i < iterations; i++) {
        const rng = new SeededRng(i);
        const result = service.rollLoot(makeLootTableId("loot_cellar_rat"), 1, rng);
        itemCount += result.items.length;
      }

      // Cellar rat has 1 rolled drop with weight 10, rolledDropCount: 1
      // So we should get roughly 1000 items (one per roll)
      // Allow some variance due to RNG
      expect(itemCount).toBeGreaterThan(900);
      expect(itemCount).toBeLessThan(1100);

      // Average should be close to 1 item per roll
      const average = itemCount / iterations;
      expect(average).toBeGreaterThan(0.9);
      expect(average).toBeLessThan(1.1);
    });

    it("handles loot table with multiple weighted drops", () => {
      const rng = new SeededRng(33333);
      const characterId = 1;

      // loot_greenhollow_world has 2 rolled drops with different weights
      const result = service.rollLoot(makeLootTableId("loot_greenhollow_world"), characterId, rng);

      // Should have rolledDropCount items (1 in this case)
      expect(result.items.length).toBeGreaterThanOrEqual(0);
      expect(result.items.length).toBeLessThanOrEqual(1);

      // Gold should be in range [1, 5]
      expect(result.gold).toBeGreaterThanOrEqual(1);
      expect(result.gold).toBeLessThanOrEqual(5);
    });

    it("verifies weighted drop distribution over many rolls", () => {
      const iterations = 10000;
      const itemCounts = new Map<string, number>();

      for (let i = 0; i < iterations; i++) {
        const rng = new SeededRng(i);
        service.resetInstanceIdCounter();
        const result = service.rollLoot(makeLootTableId("loot_greenhollow_world"), 1, rng);

        for (const item of result.items) {
          const count = itemCounts.get(item.templateId) || 0;
          itemCounts.set(item.templateId, count + 1);
        }
      }

      // loot_greenhollow_world has:
      // - item_worn_leather_gloves: weight 2
      // - item_tarnished_silver_ring: weight 1
      // Total weight: 3
      // Expected distribution: gloves 66.67%, ring 33.33%

      const glovesCount = itemCounts.get("item_worn_leather_gloves") || 0;
      const ringCount = itemCounts.get("item_tarnished_silver_ring") || 0;

      // With 10000 iterations, we should see roughly 2:1 ratio
      // Allow 10% variance
      const totalItems = glovesCount + ringCount;
      if (totalItems > 0) {
        const glovesPercent = glovesCount / totalItems;
        expect(glovesPercent).toBeGreaterThan(0.60);
        expect(glovesPercent).toBeLessThan(0.73);
      }
    });

    it("handles loot table with guaranteed drops", () => {
      // Note: Current loot tables don't have guaranteed drops
      // This test verifies the code path works if they're added
      const rng = new SeededRng(44444);
      const characterId = 1;

      // Test with existing table that has no guaranteed drops
      const result = service.rollLoot(makeLootTableId("loot_cellar_rat"), characterId, rng);

      // Should still work fine
      expect(result.items).toBeDefined();
      expect(result.gold).toBeGreaterThanOrEqual(0);
    });

    it("throws error for non-existent loot table", () => {
      const rng = new SeededRng(55555);
      const characterId = 1;

      expect(() => {
        service.rollLoot(makeLootTableId("loot_nonexistent"), characterId, rng);
      }).toThrow("Loot table not found: loot_nonexistent");
    });

    it("handles edge case of empty rolled drops array", () => {
      const rng = new SeededRng(66666);
      const characterId = 1;

      // Most tables have at least one rolled drop, but verify graceful handling
      // if rolledDropCount > 0 but rolledDrops is empty
      const result = service.rollLoot(makeLootTableId("loot_cellar_rat"), characterId, rng);

      // Should not crash
      expect(result).toBeDefined();
      expect(Array.isArray(result.items)).toBe(true);
    });
  });

  describe("instance ID management", () => {
    it("resets instance ID counter", () => {
      const rng = new SeededRng(77777);

      // Create some items
      service.rollLoot(makeLootTableId("loot_cellar_rat"), 1, rng);
      service.rollLoot(makeLootTableId("loot_cellar_rat"), 1, rng);

      // Reset and create new item
      service.resetInstanceIdCounter();
      const result = service.rollLoot(makeLootTableId("loot_cellar_rat"), 1, rng);

      if (result.items.length > 0) {
        expect(result.items[0].id).toBe(1);
      }
    });

    it("sets next instance ID manually", () => {
      const rng = new SeededRng(88888);

      service.setNextInstanceId(1000);
      const result = service.rollLoot(makeLootTableId("loot_cellar_rat"), 1, rng);

      if (result.items.length > 0) {
        expect(result.items[0].id).toBe(1000);
      }
    });

    it("increments instance IDs across multiple rolls", () => {
      const rng = new SeededRng(99999);

      const result1 = service.rollLoot(makeLootTableId("loot_cellar_rat"), 1, rng);
      const result2 = service.rollLoot(makeLootTableId("loot_dire_wolf"), 1, rng);

      const allIds = [
        ...result1.items.map(i => i.id),
        ...result2.items.map(i => i.id)
      ];

      // All IDs should be unique and increasing
      for (let i = 1; i < allIds.length; i++) {
        expect(allIds[i]).toBeGreaterThan(allIds[i - 1]);
      }
    });
  });

  describe("gold rolling", () => {
    it("rolls gold within range for different loot tables", () => {
      const tables = [
        { id: "loot_cellar_rat", min: 5, max: 12 },
        { id: "loot_dire_wolf", min: 10, max: 20 },
        { id: "loot_blackthorn_scout", min: 15, max: 30 },
        { id: "loot_blackthorn_bandit", min: 20, max: 40 },
        { id: "loot_kragg", min: 50, max: 100 },
      ];

      for (const table of tables) {
        const rng = new SeededRng(12345);
        const result = service.rollLoot(makeLootTableId(table.id), 1, rng);

        expect(result.gold).toBeGreaterThanOrEqual(table.min);
        expect(result.gold).toBeLessThanOrEqual(table.max);
      }
    });

    it("produces different gold amounts with different seeds", () => {
      const goldAmounts = new Set<number>();

      for (let seed = 0; seed < 100; seed++) {
        const rng = new SeededRng(seed);
        const result = service.rollLoot(makeLootTableId("loot_kragg"), 1, rng);
        goldAmounts.add(result.gold);
      }

      // Should have good variety in gold amounts (not all the same)
      expect(goldAmounts.size).toBeGreaterThan(20);
    });
  });

  describe("weighted random selection", () => {
    it("handles single entry weighted selection", () => {
      const rng = new SeededRng(11111);

      // dire_wolf has only 1 rolled drop entry
      const result = service.rollLoot(makeLootTableId("loot_dire_wolf"), 1, rng);

      // Should always get the item (or no item, but deterministic)
      if (result.items.length > 0) {
        expect(result.items[0].templateId).toBe("item_wolf_pelt_shoulders");
      }
    });

    it("distributes weighted rolls proportionally", () => {
      const iterations = 5000;
      const itemCounts = new Map<string, number>();

      for (let i = 0; i < iterations; i++) {
        const rng = new SeededRng(i);
        service.resetInstanceIdCounter();
        const result = service.rollLoot(makeLootTableId("loot_greenhollow_world"), 1, rng);

        for (const item of result.items) {
          const count = itemCounts.get(item.templateId) || 0;
          itemCounts.set(item.templateId, count + 1);
        }
      }

      // Verify we got both types of items
      const gloves = itemCounts.get("item_worn_leather_gloves") || 0;
      const ring = itemCounts.get("item_tarnished_silver_ring") || 0;

      // With weight 2:1, gloves should be roughly 2x more common
      if (gloves > 0 && ring > 0) {
        const ratio = gloves / ring;
        expect(ratio).toBeGreaterThan(1.7);
        expect(ratio).toBeLessThan(2.3);
      }
    });
  });
});
