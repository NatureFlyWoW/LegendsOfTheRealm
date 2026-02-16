// tests/game/data/content/mobs.test.ts

import { describe, it, expect } from "vitest";
import { mobDefinitionsSchema } from "@game/data/schemas/mob.schema";
import mobsJson from "@game/data/content/mobs.json";

describe("mobs.json", () => {
  it("should load and parse the mobs JSON file", () => {
    expect(mobsJson).toBeDefined();
    expect(Array.isArray(mobsJson)).toBe(true);
  });

  it("should validate against the mob schema", () => {
    expect(() => mobDefinitionsSchema.parse(mobsJson)).not.toThrow();
  });

  it("should contain exactly 5 mobs", () => {
    expect(mobsJson).toHaveLength(5);
  });

  it("should have Kragg as elite and boss", () => {
    const kragg = mobsJson.find((m: any) => m.id === "mob_kragg");
    expect(kragg).toBeDefined();
    expect(kragg!.isElite).toBe(true);
    expect(kragg!.isBoss).toBe(true);
  });

  it("should have Kragg with 1 ability", () => {
    const kragg = mobsJson.find((m: any) => m.id === "mob_kragg");
    expect(kragg).toBeDefined();
    expect(kragg!.abilities).toHaveLength(1);
  });

  it("should have all mobs with lootTableIds", () => {
    mobsJson.forEach((mob: any) => {
      expect(mob.lootTableId).toBeDefined();
      expect(mob.lootTableId.length).toBeGreaterThan(0);
    });
  });

  it("should have all mobs with positive xpReward", () => {
    mobsJson.forEach((mob: any) => {
      expect(mob.xpReward).toBeGreaterThan(0);
    });
  });

  it("should have unique IDs", () => {
    const ids = mobsJson.map((m: any) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
