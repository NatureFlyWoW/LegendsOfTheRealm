import { describe, it, expect } from "vitest";
import { abilityDefinitionsSchema } from "@game/data/schemas/ability.schema";
import { ClassName } from "@shared/enums";
import abilitiesJson from "@game/data/content/abilities.json";

describe("abilities.json", () => {
  it("loads and parses the abilities JSON file", () => {
    expect(abilitiesJson).toBeDefined();
    expect(Array.isArray(abilitiesJson)).toBe(true);
  });

  it("validates against the ability schema", () => {
    expect(() => abilityDefinitionsSchema.parse(abilitiesJson)).not.toThrow();
  });

  it("contains 16 abilities (2 per class)", () => {
    expect(abilitiesJson).toHaveLength(16);
  });

  it("has abilities for every class", () => {
    const classNames = abilitiesJson.map((a: any) => a.className);
    for (const cls of Object.values(ClassName)) {
      expect(classNames.filter((c: string) => c === cls).length).toBe(2);
    }
  });

  it("all abilities have spec=null (base class abilities)", () => {
    for (const ability of abilitiesJson as any[]) {
      expect(ability.spec).toBeNull();
    }
  });

  it("all abilities have at least one effect", () => {
    for (const ability of abilitiesJson as any[]) {
      expect(ability.effects.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("all abilities have unique IDs", () => {
    const ids = (abilitiesJson as any[]).map(a => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("Warrior has Heroic Strike", () => {
    const warriorAbilities = (abilitiesJson as any[]).filter(a => a.className === ClassName.Warrior);
    const names = warriorAbilities.map((a: any) => a.name);
    expect(names).toContain("Heroic Strike");
  });
});
