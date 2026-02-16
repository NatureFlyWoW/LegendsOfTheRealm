// tests/game/data/content/items.test.ts

import { describe, it, expect } from "vitest";
import { itemDefinitionsSchema } from "@game/data/schemas/item.schema";
import { QualityTier } from "@shared/enums";
import itemsJson from "@game/data/content/items.json";

describe("items.json", () => {
  it("should load and parse the items JSON file", () => {
    expect(itemsJson).toBeDefined();
    expect(Array.isArray(itemsJson)).toBe(true);
  });

  it("should validate against the item schema", () => {
    expect(() => itemDefinitionsSchema.parse(itemsJson)).not.toThrow();
  });

  it("should contain exactly 15 items", () => {
    expect(itemsJson).toHaveLength(15);
  });

  it("should have unique IDs", () => {
    const ids = itemsJson.map((i: any) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("should have all items with at least one source", () => {
    itemsJson.forEach((item: any) => {
      expect(item.sources.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("should have Farmer's Pitchfork as common quality", () => {
    const pitchfork = itemsJson.find((i: any) => i.id === "item_farmers_pitchfork");
    expect(pitchfork).toBeDefined();
    expect(pitchfork!.quality).toBe(QualityTier.Common);
  });

  it("should have Iron Shortsword as uncommon quality", () => {
    const sword = itemsJson.find((i: any) => i.id === "item_iron_shortsword");
    expect(sword).toBeDefined();
    expect(sword!.quality).toBe(QualityTier.Uncommon);
  });

  it("should have Kragg's Head Trophy as unique", () => {
    const trophy = itemsJson.find((i: any) => i.id === "item_kraggs_head_trophy");
    expect(trophy).toBeDefined();
    expect(trophy!.unique).toBe(true);
  });
});
