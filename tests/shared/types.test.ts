// tests/shared/types.test.ts
import { describe, it, expect } from "vitest";
import type {
  ItemId, QuestId, ZoneId, DungeonId, RaidId, AbilityId,
  TalentId, MobId, LootTableId, RecipeId, AchievementId,
  CharacterState, ItemInstance, LootTable, LootEntry,
} from "@shared/types";
import { makeItemId, makeQuestId, makeZoneId } from "@shared/types";

describe("branded ID helpers", () => {
  it("makeItemId creates a branded string", () => {
    const id = makeItemId("bjornskars_icebreaker");
    expect(typeof id).toBe("string");
    expect(id).toBe("bjornskars_icebreaker");
  });

  it("makeQuestId creates a branded string", () => {
    const id = makeQuestId("greenhollow_01");
    expect(id).toBe("greenhollow_01");
  });

  it("makeZoneId creates a branded string", () => {
    const id = makeZoneId("greenhollow_vale");
    expect(id).toBe("greenhollow_vale");
  });
});

describe("type structure smoke tests", () => {
  it("LootEntry has required fields", () => {
    const entry: LootEntry = {
      itemId: makeItemId("test_sword"),
      weight: 0.5,
      minQuantity: 1,
      maxQuantity: 1,
    };
    expect(entry.weight).toBe(0.5);
  });

  it("LootTable has 3-layer structure", () => {
    const table: LootTable = {
      id: "test_table" as LootTableId,
      guaranteedDrops: [],
      rolledDrops: [],
      rolledDropCount: 2,
      goldRange: { min: 10, max: 50 },
    };
    expect(table.rolledDropCount).toBe(2);
    expect(table.goldRange.min).toBe(10);
  });
});
