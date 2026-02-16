// tests/game/data/content/loot-tables.test.ts

import { describe, it, expect } from "vitest";
import { lootTablesSchema } from "@game/data/schemas/loot-table.schema";
import lootTablesJson from "@game/data/content/loot-tables.json";

describe("loot-tables.json", () => {
  it("should load and parse the loot tables JSON file", () => {
    expect(lootTablesJson).toBeDefined();
    expect(Array.isArray(lootTablesJson)).toBe(true);
  });

  it("should validate against the loot table schema", () => {
    expect(() => lootTablesSchema.parse(lootTablesJson)).not.toThrow();
  });

  it("should contain exactly 6 loot tables", () => {
    expect(lootTablesJson).toHaveLength(6);
  });

  it("should have unique loot table IDs", () => {
    const ids = lootTablesJson.map((t: any) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("should have goldRange min <= max for all tables", () => {
    lootTablesJson.forEach((table: any) => {
      expect(table.goldRange.min).toBeLessThanOrEqual(table.goldRange.max);
    });
  });

  it("should have Kragg gold range greater than cellar rat", () => {
    const kragg = lootTablesJson.find((t: any) => t.id === "loot_kragg");
    const cellarRat = lootTablesJson.find((t: any) => t.id === "loot_cellar_rat");
    expect(kragg).toBeDefined();
    expect(cellarRat).toBeDefined();
    expect(kragg!.goldRange.min).toBeGreaterThan(cellarRat!.goldRange.min);
    expect(kragg!.goldRange.max).toBeGreaterThan(cellarRat!.goldRange.max);
  });

  it("should have all tables with rolledDropCount of 1", () => {
    lootTablesJson.forEach((table: any) => {
      expect(table.rolledDropCount).toBe(1);
    });
  });
});
