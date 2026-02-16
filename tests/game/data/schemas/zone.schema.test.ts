// tests/game/data/schemas/zone.schema.test.ts

import { describe, it, expect } from "vitest";
import { zoneDefinitionSchema } from "@game/data/schemas/zone.schema";

describe("zone.schema", () => {
  const validZone = {
    id: "zone_greenhollow_vale",
    name: "Greenhollow Vale",
    levelRange: { min: 1, max: 5 },
    theme: "pastoral_farmland",
    loreDescription: "A peaceful vale now threatened by bandits and wolves.",
    mobIds: ["mob_cellar_rat", "mob_dire_wolf"],
    questIds: ["quest_rat_problem"],
    gatheringNodes: [],
    rareSpawns: [],
    worldDropTable: "loot_greenhollow_world",
  };

  it("should validate a complete zone definition", () => {
    expect(() => zoneDefinitionSchema.parse(validZone)).not.toThrow();
  });

  it("should reject missing name", () => {
    const { name, ...noName } = validZone;
    expect(() => zoneDefinitionSchema.parse(noName)).toThrow();
  });

  it("should reject missing levelRange", () => {
    const { levelRange, ...noRange } = validZone;
    expect(() => zoneDefinitionSchema.parse(noRange)).toThrow();
  });

  it("should validate optional dungeonUnlock", () => {
    const zoneWithDungeon = { ...validZone, dungeonUnlock: "dungeon_blackthorn_hideout" };
    const result = zoneDefinitionSchema.parse(zoneWithDungeon);
    expect(result.dungeonUnlock).toBe("dungeon_blackthorn_hideout");
  });

  it("should validate empty gatheringNodes and rareSpawns arrays", () => {
    const result = zoneDefinitionSchema.parse(validZone);
    expect(result.gatheringNodes).toEqual([]);
    expect(result.rareSpawns).toEqual([]);
  });
});
