// tests/game/data/content/zones.test.ts

import { describe, it, expect } from "vitest";
import { zoneDefinitionsSchema } from "@game/data/schemas/zone.schema";
import zonesJson from "@game/data/content/zones.json";

describe("zones.json", () => {
  it("should load and parse the zones JSON file", () => {
    expect(zonesJson).toBeDefined();
    expect(Array.isArray(zonesJson)).toBe(true);
  });

  it("should validate against the zone schema", () => {
    expect(() => zoneDefinitionsSchema.parse(zonesJson)).not.toThrow();
  });

  it("should contain exactly 1 zone", () => {
    expect(zonesJson).toHaveLength(1);
  });

  it("should have Greenhollow Vale as the zone name", () => {
    const zone = zonesJson[0];
    expect(zone.name).toBe("Greenhollow Vale");
  });

  it("should have level range 1-5", () => {
    const zone = zonesJson[0];
    expect(zone.levelRange.min).toBe(1);
    expect(zone.levelRange.max).toBe(5);
  });

  it("should have 5 mob IDs", () => {
    const zone = zonesJson[0];
    expect(zone.mobIds).toHaveLength(5);
  });

  it("should have 5 quest IDs", () => {
    const zone = zonesJson[0];
    expect(zone.questIds).toHaveLength(5);
  });
});
